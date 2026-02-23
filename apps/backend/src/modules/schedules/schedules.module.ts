import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../../entities/schedule.entity';
import { RecurringSchedule } from '../../entities/recurring-schedule.entity';
import { NotificationEvent } from '../../entities/notification-event.entity';
import { NotificationDelivery } from '../../entities/notification-delivery.entity';
import { User } from '../../entities/user.entity';
import { WebPushSubscriptionEntity } from '../../entities/web-push-subscription.entity';
import { ScheduleService } from './services/schedule.service';
import { RecurringScheduleService } from './services/recurring-schedule.service';
import { ScheduleNotificationService } from './services/schedule-notification.service';
import { NotificationEventDispatcherService } from './services/notification-event-dispatcher.service';
import { NotificationDeliveryProcessorService } from './services/notification-delivery-processor.service';
import { WebPushSubscriptionService } from './services/web-push-subscription.service';
import { ScheduleController } from './controllers/schedule.controller';
import { RecurringScheduleController } from './controllers/recurring-schedule.controller';
import { WebPushSubscriptionController } from './controllers/web-push-subscription.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([
      Schedule,
      RecurringSchedule,
      NotificationEvent,
      NotificationDelivery,
      User,
      WebPushSubscriptionEntity,
    ]),
  ],
  controllers: [
    ScheduleController,
    RecurringScheduleController,
    WebPushSubscriptionController,
  ],
  providers: [
    ScheduleService,
    RecurringScheduleService,
    ScheduleNotificationService,
    NotificationEventDispatcherService,
    NotificationDeliveryProcessorService,
    WebPushSubscriptionService,
  ],
  exports: [ScheduleService, RecurringScheduleService],
})
export class SchedulesModule {}
