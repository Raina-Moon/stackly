import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { NotificationEvent, NotificationChannel } from '../../../entities/notification-event.entity';
import {
  NotificationDelivery,
  NotificationDeliveryStatus,
} from '../../../entities/notification-delivery.entity';
import { User } from '../../../entities/user.entity';
import { EmailService } from '../../auth/email.service';
import { WebPushSubscriptionEntity } from '../../../entities/web-push-subscription.entity';
import { WebPushSubscriptionService } from './web-push-subscription.service';
import { CacheInvalidationService } from '../../../cache';

@Injectable()
export class NotificationDeliveryProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationDeliveryProcessorService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    @InjectRepository(NotificationDelivery)
    private readonly notificationDeliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(NotificationEvent)
    private readonly notificationEventRepository: Repository<NotificationEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WebPushSubscriptionEntity)
    private readonly webPushSubscriptionRepository: Repository<WebPushSubscriptionEntity>,
    private readonly emailService: EmailService,
    private readonly webPushSubscriptionService: WebPushSubscriptionService,
    private readonly configService: ConfigService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  onModuleInit() {
    const enabled = this.configService.get<string>('NOTIFICATION_DELIVERY_PROCESSOR_ENABLED') !== 'false';
    if (!enabled) {
      this.logger.log('Notification delivery processor worker is disabled');
      return;
    }

    const intervalMs = Number(this.configService.get('NOTIFICATION_DELIVERY_PROCESSOR_CHECK_MS') || 20_000);
    this.logger.log(`Notification delivery processor worker started (interval=${intervalMs}ms)`);

    this.timer = setInterval(() => {
      void this.processPendingDeliveries();
    }, intervalMs);

    setTimeout(() => {
      void this.processPendingDeliveries();
    }, 5_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async processPendingDeliveries(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const batchLimit = Number(this.configService.get('NOTIFICATION_DELIVERY_PROCESSOR_BATCH_LIMIT') || 100);
      const pendingDeliveries = await this.notificationDeliveryRepository.find({
        where: { status: NotificationDeliveryStatus.PENDING },
        order: { createdAt: 'ASC' },
        take: batchLimit,
      });

      if (pendingDeliveries.length === 0) return;

      let sentCount = 0;
      let skippedCount = 0;

      for (const delivery of pendingDeliveries) {
        const claimed = await this.notificationDeliveryRepository.update(
          { id: delivery.id, status: NotificationDeliveryStatus.PENDING },
          {
            status: NotificationDeliveryStatus.PROCESSING,
            attemptCount: () => '"attemptCount" + 1',
            lastAttemptedAt: new Date(),
          },
        );

        if (!claimed.affected) continue;

        const fresh = await this.notificationDeliveryRepository.findOne({ where: { id: delivery.id } });
        if (!fresh) continue;

        try {
          if (fresh.channel === NotificationChannel.EMAIL) {
            const emailSent = await this.handleEmailDelivery(fresh);
            if (emailSent) {
              sentCount += 1;
              await this.cacheInvalidation.onNotificationChange(fresh.userId);
            }
            continue;
          }

          if (fresh.channel === NotificationChannel.WEB_PUSH) {
            const webPushSent = await this.handleWebPushDelivery(fresh);
            if (webPushSent) {
              sentCount += 1;
              await this.cacheInvalidation.onNotificationChange(fresh.userId);
            } else {
              skippedCount += 1;
            }
            continue;
          }

          await this.notificationDeliveryRepository.update(fresh.id, {
            status: NotificationDeliveryStatus.SKIPPED,
            errorMessage: `${fresh.channel} channel handler is not implemented yet`,
          });
          skippedCount += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown delivery processor error';
          await this.notificationDeliveryRepository.update(fresh.id, {
            status: NotificationDeliveryStatus.FAILED,
            errorMessage: message.slice(0, 1000),
          });
          this.logger.error(`Failed to process notification delivery ${fresh.id}`, error as Error);
        }
      }

      if (sentCount > 0 || skippedCount > 0) {
        this.logger.log(
          `Processed notification deliveries (sent=${sentCount}, skipped=${skippedCount})`,
        );
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async handleWebPushDelivery(delivery: NotificationDelivery): Promise<boolean> {
    const event = await this.notificationEventRepository.findOne({
      where: { id: delivery.eventId },
    });
    if (!event) {
      await this.notificationDeliveryRepository.update(delivery.id, {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: 'Notification event not found',
      });
      return false;
    }

    const publicKey = this.configService.get<string>('WEB_PUSH_VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('WEB_PUSH_VAPID_PRIVATE_KEY');
    const subject =
      this.configService.get<string>('WEB_PUSH_VAPID_SUBJECT') || 'mailto:notifications@stackly.local';

    if (!publicKey || !privateKey) {
      await this.notificationDeliveryRepository.update(delivery.id, {
        status: NotificationDeliveryStatus.SKIPPED,
        errorMessage: 'WEB_PUSH_VAPID_PUBLIC_KEY/PRIVATE_KEY not configured',
      });
      return false;
    }

    const webPush = this.getWebPushClient();
    if (!webPush) {
      await this.notificationDeliveryRepository.update(delivery.id, {
        status: NotificationDeliveryStatus.SKIPPED,
        errorMessage: 'web-push package is not installed',
      });
      return false;
    }

    webPush.setVapidDetails(subject, publicKey, privateKey);

    const subscriptions = await this.webPushSubscriptionRepository.find({
      where: { userId: delivery.userId, isActive: true },
      order: { updatedAt: 'DESC' },
    });

    if (subscriptions.length === 0) {
      await this.notificationDeliveryRepository.update(delivery.id, {
        status: NotificationDeliveryStatus.SKIPPED,
        errorMessage: 'No active web push subscriptions',
      });
      return false;
    }

    const payload = (event.payload || {}) as Record<string, unknown>;
    const title = 'Stackly 일정 완료 확인';
    const body =
      typeof payload.messageKo === 'string'
        ? payload.messageKo
        : '해당 스케줄을 완료했나요? 완료했으면 완료 처리 해주세요.';
    const scheduleId = typeof payload.scheduleId === 'string' ? payload.scheduleId : null;
    const scheduleTitle = typeof payload.scheduleTitle === 'string' ? payload.scheduleTitle : 'Schedule';
    const cardId = typeof payload.cardId === 'string' ? payload.cardId : null;
    const notificationPayload = JSON.stringify({
      title,
      body,
      tag: scheduleId ? `schedule-followup:${scheduleId}` : `notification:${delivery.id}`,
      data: {
        url: '/schedule',
        scheduleId,
        cardId,
        eventId: event.id,
        deliveryId: delivery.id,
      },
      meta: {
        scheduleTitle,
        eventType: event.type,
      },
    });

    let successCount = 0;
    let lastError = '';

    for (const subscription of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime
              ? Number(subscription.expirationTime)
              : null,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          notificationPayload,
        );
        await this.webPushSubscriptionService.markSuccess(subscription.id);
        successCount += 1;
      } catch (error) {
        const statusCode =
          typeof (error as { statusCode?: number })?.statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : undefined;
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Unknown web push error';
        lastError = message;
        await this.webPushSubscriptionService.markFailure(
          subscription.id,
          message,
          statusCode === 404 || statusCode === 410,
        );
      }
    }

    if (successCount === 0) {
      await this.notificationDeliveryRepository.update(delivery.id, {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: lastError || 'Web push delivery failed for all subscriptions',
      });
      return false;
    }

    await this.notificationDeliveryRepository.update(delivery.id, {
      status: NotificationDeliveryStatus.SENT,
      sentAt: new Date(),
      providerMessageId: `${successCount} subscription(s)`,
      errorMessage: lastError ? `Partial failure: ${lastError}` : null,
    });
    return true;
  }

  private async handleEmailDelivery(delivery: NotificationDelivery): Promise<boolean> {
    const event = await this.notificationEventRepository.findOne({
      where: { id: delivery.eventId },
    });
    if (!event) {
      await this.notificationDeliveryRepository.update(delivery.id, {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: 'Notification event not found',
      });
      return false;
    }

    const user = await this.userRepository.findOne({
      where: { id: delivery.userId },
      select: ['id', 'email', 'nickname', 'firstName'],
    });
    if (!user?.email) {
      await this.notificationDeliveryRepository.update(delivery.id, {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: 'Recipient email not found',
      });
      return false;
    }

    const payload = (event.payload || {}) as Record<string, unknown>;
    const scheduleTitle = String(payload.scheduleTitle || 'Untitled schedule');
    const cardTitle = payload.cardTitle ? String(payload.cardTitle) : null;
    const endTimeValue = payload.endTime ? new Date(String(payload.endTime)) : null;
    const delayMinutes = Number(payload.followupDelayMinutes || 120);
    const messageKo =
      typeof payload.messageKo === 'string'
        ? payload.messageKo
        : '해당 스케줄을 완료했나요? 완료했으면 완료 처리 해주세요.';
    const messageEn =
      typeof payload.messageEn === 'string'
        ? payload.messageEn
        : 'Did you complete this schedule? If yes, please mark it as completed.';

    const recipientOverride = this.configService.get<string>('NOTIFICATION_TEST_EMAIL_OVERRIDE');
    const toEmail = recipientOverride || user.email;
    const subject = `[Stackly] 일정 완료 확인 요청: ${scheduleTitle}`;
    const html = this.buildScheduleFollowupEmailHtml({
      nickname: user.nickname || user.firstName || 'there',
      scheduleTitle,
      cardTitle,
      endTime: endTimeValue,
      delayMinutes,
      messageKo,
      messageEn,
    });

    const result = await this.emailService.sendEmail({
      to: toEmail,
      subject,
      html,
    });

    if (!result.success) {
      await this.notificationDeliveryRepository.update(delivery.id, {
        status: NotificationDeliveryStatus.FAILED,
        errorMessage: result.message.slice(0, 1000),
      });
      return false;
    }

    await this.notificationDeliveryRepository.update(delivery.id, {
      status: NotificationDeliveryStatus.SENT,
      sentAt: new Date(),
      providerMessageId: result.providerMessageId ?? null,
      errorMessage: recipientOverride
        ? `Delivered with test override to ${recipientOverride}`
        : null,
    });

    return true;
  }

  private buildScheduleFollowupEmailHtml(params: {
    nickname: string;
    scheduleTitle: string;
    cardTitle: string | null;
    endTime: Date | null;
    delayMinutes: number;
    messageKo: string;
    messageEn: string;
  }): string {
    const endTimeText = params.endTime
      ? new Intl.DateTimeFormat('ko-KR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(params.endTime)
      : '-';

    const cardBlock = params.cardTitle
      ? `<p style="margin: 0 0 12px; color: #334155;"><strong>연결 카드:</strong> ${this.escapeHtml(
          params.cardTitle,
        )}</p>`
      : '';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background: #f8fafc;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px;">
          <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.06em; color: #0ea5e9;">STACKLY REMINDER</div>
            <h1 style="margin: 8px 0 0; font-size: 22px; color: #0f172a;">스케줄 완료 확인이 필요합니다</h1>
          </div>

          <p style="margin: 0 0 14px; color: #334155;">${this.escapeHtml(
            params.nickname,
          )}님, 일정 종료 후 ${params.delayMinutes}분이 지나 아직 완료 처리되지 않았습니다.</p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px; color: #334155;"><strong>스케줄:</strong> ${this.escapeHtml(
              params.scheduleTitle,
            )}</p>
            ${cardBlock}
            <p style="margin: 0; color: #334155;"><strong>종료 시각:</strong> ${this.escapeHtml(
              endTimeText,
            )}</p>
          </div>

          <div style="border-left: 4px solid #38bdf8; background: #f0f9ff; padding: 12px 14px; border-radius: 8px; margin-bottom: 14px;">
            <p style="margin: 0 0 6px; color: #0f172a;">${this.escapeHtml(params.messageKo)}</p>
            <p style="margin: 0; color: #475569; font-size: 13px;">${this.escapeHtml(params.messageEn)}</p>
          </div>

          <p style="margin: 0; color: #64748b; font-size: 13px;">
            앱에서 해당 스케줄 상태를 <strong>완료</strong>로 변경해주세요.
          </p>
        </div>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private getWebPushClient():
    | {
        setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
        sendNotification: (
          subscription: {
            endpoint: string;
            expirationTime: number | null;
            keys: { p256dh: string; auth: string };
          },
          payload?: string,
        ) => Promise<unknown>;
      }
    | null {
    try {
      // Optional dependency: install `web-push` to enable actual browser push delivery
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('web-push');
    } catch {
      return null;
    }
  }
}
