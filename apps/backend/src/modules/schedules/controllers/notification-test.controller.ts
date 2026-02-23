import {
  BadRequestException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthUser, GetUser } from '../../auth/decorators/get-user.decorator';
import { UserService } from '../../auth/services/user.service';
import {
  NotificationChannel,
  NotificationEvent,
  NotificationEventStatus,
  NotificationEventType,
} from '../../../entities/notification-event.entity';
import { NotificationEventDispatcherService } from '../services/notification-event-dispatcher.service';
import { NotificationDeliveryProcessorService } from '../services/notification-delivery-processor.service';

@Controller('notifications/test')
@UseGuards(JwtAuthGuard)
export class NotificationTestController {
  constructor(
    private readonly userService: UserService,
    private readonly eventDispatcherService: NotificationEventDispatcherService,
    private readonly deliveryProcessorService: NotificationDeliveryProcessorService,
    @InjectRepository(NotificationEvent)
    private readonly notificationEventRepository: Repository<NotificationEvent>,
  ) {}

  @Post('schedule-followup')
  async sendScheduleFollowupTest(@GetUser() user: AuthUser) {
    const prefs = await this.userService.getMyNotificationPreferences(user.id);

    const channels: NotificationChannel[] = [];
    if (prefs.channels.webPush) channels.push(NotificationChannel.WEB_PUSH);
    if (prefs.channels.email) channels.push(NotificationChannel.EMAIL);
    if (prefs.channels.slack) channels.push(NotificationChannel.SLACK);

    if (!prefs.overdueFollowupEnabled) {
      throw new BadRequestException('완료 확인 리마인더가 비활성화되어 있습니다.');
    }

    if (channels.length === 0) {
      throw new BadRequestException('활성화된 알림 채널이 없습니다.');
    }

    const now = new Date();
    const dedupKey = `test:schedule-followup:${user.id}:${now.getTime()}`;

    const event = await this.notificationEventRepository.save(
      this.notificationEventRepository.create({
        userId: user.id,
        scheduleId: null,
        type: NotificationEventType.SCHEDULE_COMPLETION_FOLLOWUP,
        status: NotificationEventStatus.PENDING,
        dedupKey,
        channels,
        payload: {
          messageKey: 'schedule.completion_followup.test',
          scheduleId: null,
          scheduleTitle: '테스트 알림: 스케줄 완료 확인',
          scheduleStatus: 'pending',
          endTime: new Date(now.getTime() - prefs.delayMinutes * 60 * 1000),
          cardId: null,
          cardTitle: 'Settings > 알림 설정 테스트',
          followupDelayMinutes: prefs.delayMinutes,
          selectedChannels: channels,
          isTest: true,
          messageKo: '테스트 알림입니다. 완료했으면 완료 처리 해주세요.',
          messageEn: 'This is a test reminder. If completed, please mark it as completed.',
        },
      }),
    );

    // Trigger one-pass processing so the settings button feels immediate.
    await this.eventDispatcherService.dispatchPendingEvents();
    await this.deliveryProcessorService.processPendingDeliveries();

    const refreshed = await this.notificationEventRepository.findOne({
      where: { id: event.id },
      select: ['id', 'status', 'channels', 'createdAt', 'processedAt'],
    });

    return {
      success: true,
      message: '테스트 알림이 큐에 등록되어 처리되었습니다.',
      event: refreshed ?? event,
    };
  }
}
