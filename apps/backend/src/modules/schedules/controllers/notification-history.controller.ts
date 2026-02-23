import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthUser, GetUser } from '../../auth/decorators/get-user.decorator';
import { NotificationDelivery } from '../../../entities/notification-delivery.entity';

@Controller('notifications/history')
@UseGuards(JwtAuthGuard)
export class NotificationHistoryController {
  constructor(
    @InjectRepository(NotificationDelivery)
    private readonly notificationDeliveryRepository: Repository<NotificationDelivery>,
  ) {}

  @Get()
  async getHistory(
    @GetUser() user: AuthUser,
    @Query('take') take = '30',
    @Query('skip') skip = '0',
  ) {
    const safeTake = Math.min(100, Math.max(1, Number(take) || 30));
    const safeSkip = Math.max(0, Number(skip) || 0);

    const [deliveries, total] = await this.notificationDeliveryRepository.findAndCount({
      where: { userId: user.id },
      relations: ['event'],
      order: { createdAt: 'DESC' },
      take: safeTake,
      skip: safeSkip,
    });

    return {
      success: true,
      total,
      data: deliveries.map((delivery) => ({
        id: delivery.id,
        eventId: delivery.eventId,
        channel: delivery.channel,
        status: delivery.status,
        attemptCount: delivery.attemptCount,
        providerMessageId: delivery.providerMessageId,
        errorMessage: delivery.errorMessage,
        createdAt: delivery.createdAt,
        sentAt: delivery.sentAt,
        readAt: delivery.readAt,
        payload: delivery.payload,
        event: delivery.event
          ? {
              id: delivery.event.id,
              type: delivery.event.type,
              status: delivery.event.status,
              dedupKey: delivery.event.dedupKey,
              payload: delivery.event.payload,
              createdAt: delivery.event.createdAt,
              processedAt: delivery.event.processedAt,
            }
          : null,
      })),
    };
  }

  @Get('summary')
  async getSummary(@GetUser() user: AuthUser) {
    const unreadCount = await this.notificationDeliveryRepository.count({
      where: { userId: user.id, readAt: IsNull() },
    });

    const latest = await this.notificationDeliveryRepository.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      select: ['id', 'createdAt', 'status', 'channel'],
    });

    return {
      success: true,
      unreadCount,
      hasUnread: unreadCount > 0,
      latest: latest
        ? {
            id: latest.id,
            createdAt: latest.createdAt,
            status: latest.status,
            channel: latest.channel,
          }
        : null,
    };
  }

  @Patch('read-all')
  async markAllRead(@GetUser() user: AuthUser) {
    const now = new Date();
    const result = await this.notificationDeliveryRepository
      .createQueryBuilder()
      .update(NotificationDelivery)
      .set({ readAt: now })
      .where('"userId" = :userId', { userId: user.id })
      .andWhere('"readAt" IS NULL')
      .execute();

    return {
      success: true,
      updated: result.affected ?? 0,
      readAt: now,
    };
  }

  @Patch(':id/read')
  async markOneRead(@GetUser() user: AuthUser, @Param('id') id: string) {
    const result = await this.notificationDeliveryRepository
      .createQueryBuilder()
      .update(NotificationDelivery)
      .set({ readAt: new Date() })
      .where('id = :id', { id })
      .andWhere('"userId" = :userId', { userId: user.id })
      .andWhere('"readAt" IS NULL')
      .execute();

    return {
      success: true,
      updated: result.affected ?? 0,
    };
  }
}
