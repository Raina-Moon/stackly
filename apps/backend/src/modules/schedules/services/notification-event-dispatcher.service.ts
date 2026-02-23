import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import {
  NotificationEvent,
  NotificationEventStatus,
} from '../../../entities/notification-event.entity';
import {
  NotificationDelivery,
  NotificationDeliveryStatus,
} from '../../../entities/notification-delivery.entity';

@Injectable()
export class NotificationEventDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationEventDispatcherService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    @InjectRepository(NotificationEvent)
    private readonly notificationEventRepository: Repository<NotificationEvent>,
    @InjectRepository(NotificationDelivery)
    private readonly notificationDeliveryRepository: Repository<NotificationDelivery>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const enabled = this.configService.get<string>('NOTIFICATION_EVENT_DISPATCHER_ENABLED') !== 'false';
    if (!enabled) {
      this.logger.log('Notification event dispatcher worker is disabled');
      return;
    }

    const intervalMs = Number(this.configService.get('NOTIFICATION_EVENT_DISPATCHER_CHECK_MS') || 30_000);
    this.logger.log(`Notification event dispatcher worker started (interval=${intervalMs}ms)`);

    this.timer = setInterval(() => {
      void this.dispatchPendingEvents();
    }, intervalMs);

    setTimeout(() => {
      void this.dispatchPendingEvents();
    }, 4_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async dispatchPendingEvents(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const batchLimit = Number(this.configService.get('NOTIFICATION_EVENT_DISPATCHER_BATCH_LIMIT') || 50);

      const candidates = await this.notificationEventRepository.find({
        where: { status: NotificationEventStatus.PENDING },
        order: { createdAt: 'ASC' },
        take: batchLimit,
      });

      if (candidates.length === 0) return;

      let processedCount = 0;

      for (const candidate of candidates) {
        const claimed = await this.notificationEventRepository.update(
          { id: candidate.id, status: NotificationEventStatus.PENDING },
          { status: NotificationEventStatus.PROCESSING, errorMessage: null },
        );

        if (!claimed.affected) continue;

        const event = await this.notificationEventRepository.findOne({ where: { id: candidate.id } });
        if (!event) continue;

        try {
          const channels = Array.isArray(event.channels) ? event.channels : [];

          for (const channel of channels) {
            const existingDelivery = await this.notificationDeliveryRepository.findOne({
              where: { eventId: event.id, channel },
              select: ['id'],
            });

            if (existingDelivery) continue;

            const delivery = this.notificationDeliveryRepository.create({
              eventId: event.id,
              userId: event.userId,
              channel,
              status: NotificationDeliveryStatus.PENDING,
              payload: {
                ...(event.payload || {}),
                eventType: event.type,
                dedupKey: event.dedupKey,
              },
            });

            await this.notificationDeliveryRepository.save(delivery);
          }

          await this.notificationEventRepository.update(event.id, {
            status: NotificationEventStatus.PROCESSED,
            processedAt: new Date(),
            errorMessage: null,
          });
          processedCount += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown dispatcher error';
          await this.notificationEventRepository.update(event.id, {
            status: NotificationEventStatus.FAILED,
            errorMessage: message.slice(0, 1000),
          });
          this.logger.error(`Failed to dispatch notification event ${event.id}`, error as Error);
        }
      }

      if (processedCount > 0) {
        this.logger.log(`Dispatched ${processedCount} notification events into channel deliveries`);
      }
    } finally {
      this.isRunning = false;
    }
  }
}
