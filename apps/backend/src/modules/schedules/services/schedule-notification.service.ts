import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Schedule, ScheduleStatus } from '../../../entities/schedule.entity';
import {
  NotificationChannel,
  NotificationEvent,
  NotificationEventStatus,
  NotificationEventType,
} from '../../../entities/notification-event.entity';
import { User } from '../../../entities/user.entity';

interface ReminderPreferences {
  overdueFollowupEnabled: boolean;
  delayMinutes: number;
  channels: {
    email: boolean;
    slack: boolean;
    webPush: boolean;
  };
}

const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  overdueFollowupEnabled: true,
  delayMinutes: 120,
  channels: {
    email: true,
    slack: false,
    webPush: true,
  },
};

@Injectable()
export class ScheduleNotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduleNotificationService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(NotificationEvent)
    private readonly notificationEventRepository: Repository<NotificationEvent>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const enabled = this.configService.get<string>('SCHEDULE_OVERDUE_REMINDER_ENABLED') !== 'false';
    if (!enabled) {
      this.logger.log('Schedule overdue reminder worker is disabled');
      return;
    }

    const intervalMs = Number(this.configService.get('SCHEDULE_OVERDUE_REMINDER_CHECK_MS') || 60_000);
    this.logger.log(`Schedule overdue reminder worker started (interval=${intervalMs}ms)`);
    this.timer = setInterval(() => {
      void this.processOverdueScheduleCompletionFollowups();
    }, intervalMs);

    // Run once shortly after boot
    setTimeout(() => {
      void this.processOverdueScheduleCompletionFollowups();
    }, 3_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async processOverdueScheduleCompletionFollowups(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const defaultDelayMinutes = Number(
        this.configService.get('SCHEDULE_OVERDUE_REMINDER_DELAY_MINUTES') || 120,
      );
      const batchLimit = Number(this.configService.get('SCHEDULE_OVERDUE_REMINDER_BATCH_LIMIT') || 100);
      const minSupportedDelayMinutes = 15;
      const threshold = new Date(Date.now() - minSupportedDelayMinutes * 60 * 1000);

      const candidates = await this.scheduleRepository
        .createQueryBuilder('schedule')
        .leftJoinAndSelect('schedule.card', 'card')
        .leftJoinAndSelect('schedule.user', 'user')
        .where('schedule.deletedAt IS NULL')
        .andWhere("schedule.status != :completed", { completed: ScheduleStatus.COMPLETED })
        .andWhere('schedule.endTime <= :threshold', { threshold })
        .andWhere('schedule.completionFollowupNotifiedAt IS NULL')
        .orderBy('schedule.endTime', 'ASC')
        .take(batchLimit)
        .getMany();

      if (candidates.length === 0) return;

      let createdCount = 0;
      let skippedDisabledCount = 0;

      for (const schedule of candidates) {
        const prefs = this.getReminderPreferencesFromUser(
          schedule.user,
          Number.isFinite(defaultDelayMinutes) ? defaultDelayMinutes : 120,
        );

        if (!prefs.overdueFollowupEnabled) {
          await this.scheduleRepository.update(schedule.id, {
            completionFollowupNotifiedAt: new Date(),
            completionFollowupNotificationEventId: null,
          });
          skippedDisabledCount += 1;
          continue;
        }

        const effectiveDelayMs = prefs.delayMinutes * 60 * 1000;
        if (schedule.endTime.getTime() > Date.now() - effectiveDelayMs) {
          continue;
        }

        const channels = this.toNotificationChannels(prefs);
        if (channels.length === 0) {
          await this.scheduleRepository.update(schedule.id, {
            completionFollowupNotifiedAt: new Date(),
            completionFollowupNotificationEventId: null,
          });
          skippedDisabledCount += 1;
          continue;
        }

        const dedupKey = `schedule:${schedule.id}:completion-followup`;

        const existing = await this.notificationEventRepository.findOne({
          where: { dedupKey },
          select: ['id'],
        });

        if (existing) {
          await this.scheduleRepository.update(schedule.id, {
            completionFollowupNotifiedAt: new Date(),
            completionFollowupNotificationEventId: existing.id,
          });
          continue;
        }

        const event = this.notificationEventRepository.create({
          userId: schedule.userId,
          scheduleId: schedule.id,
          type: NotificationEventType.SCHEDULE_COMPLETION_FOLLOWUP,
          status: NotificationEventStatus.PENDING,
          dedupKey,
          channels,
          payload: {
            messageKey: 'schedule.completion_followup',
            scheduleId: schedule.id,
            scheduleTitle: schedule.title,
            scheduleStatus: schedule.status,
            endTime: schedule.endTime,
            cardId: schedule.cardId ?? null,
            cardTitle: schedule.card?.title ?? null,
            followupDelayMinutes: prefs.delayMinutes,
            selectedChannels: channels,
            messageKo: '해당 스케줄을 완료했나요? 완료했으면 완료 처리 해주세요.',
            messageEn: 'Did you complete this schedule? If yes, please mark it as completed.',
          },
        });

        const saved = await this.notificationEventRepository.save(event);
        await this.scheduleRepository.update(schedule.id, {
          completionFollowupNotifiedAt: new Date(),
          completionFollowupNotificationEventId: saved.id,
        });
        createdCount += 1;
      }

      if (createdCount > 0) {
        this.logger.log(`Queued ${createdCount} schedule completion follow-up notification events`);
      }
      if (skippedDisabledCount > 0) {
        this.logger.log(
          `Skipped ${skippedDisabledCount} schedule follow-up reminders due to user notification preferences`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to process overdue schedule completion follow-ups', error as Error);
    } finally {
      this.isRunning = false;
    }
  }

  private getReminderPreferencesFromUser(
    user: Pick<User, 'notificationPreferences'> | null | undefined,
    fallbackDelayMinutes: number,
  ): ReminderPreferences {
    const raw =
      user?.notificationPreferences && typeof user.notificationPreferences === 'object'
        ? (user.notificationPreferences as Record<string, unknown>)
        : {};
    const rawChannels =
      raw.channels && typeof raw.channels === 'object'
        ? (raw.channels as Record<string, unknown>)
        : {};

    const safeFallbackDelay = Number.isFinite(fallbackDelayMinutes)
      ? Math.max(15, Math.min(1440, Math.round(fallbackDelayMinutes)))
      : DEFAULT_REMINDER_PREFERENCES.delayMinutes;

    return {
      overdueFollowupEnabled:
        typeof raw.overdueFollowupEnabled === 'boolean'
          ? raw.overdueFollowupEnabled
          : DEFAULT_REMINDER_PREFERENCES.overdueFollowupEnabled,
      delayMinutes:
        typeof raw.delayMinutes === 'number' && Number.isFinite(raw.delayMinutes)
          ? Math.max(15, Math.min(1440, Math.round(raw.delayMinutes)))
          : safeFallbackDelay,
      channels: {
        email:
          typeof rawChannels.email === 'boolean'
            ? rawChannels.email
            : DEFAULT_REMINDER_PREFERENCES.channels.email,
        slack:
          typeof rawChannels.slack === 'boolean'
            ? rawChannels.slack
            : DEFAULT_REMINDER_PREFERENCES.channels.slack,
        webPush:
          typeof rawChannels.webPush === 'boolean'
            ? rawChannels.webPush
            : DEFAULT_REMINDER_PREFERENCES.channels.webPush,
      },
    };
  }

  private toNotificationChannels(prefs: ReminderPreferences): NotificationChannel[] {
    const channels: NotificationChannel[] = [];
    if (prefs.channels.webPush) channels.push(NotificationChannel.WEB_PUSH);
    if (prefs.channels.email) channels.push(NotificationChannel.EMAIL);
    if (prefs.channels.slack) channels.push(NotificationChannel.SLACK);
    return channels;
  }
}
