import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebPushSubscriptionEntity } from '../../../entities/web-push-subscription.entity';

export interface WebPushSubscriptionInput {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class WebPushSubscriptionService {
  constructor(
    @InjectRepository(WebPushSubscriptionEntity)
    private readonly webPushSubscriptionRepository: Repository<WebPushSubscriptionEntity>,
  ) {}

  async upsert(userId: string, subscription: WebPushSubscriptionInput, userAgent?: string | null) {
    const existing = await this.webPushSubscriptionRepository.findOne({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      existing.userId = userId;
      existing.p256dh = subscription.keys.p256dh;
      existing.auth = subscription.keys.auth;
      existing.expirationTime =
        typeof subscription.expirationTime === 'number'
          ? String(subscription.expirationTime)
          : null;
      existing.userAgent = userAgent || null;
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      existing.lastErrorMessage = null;
      return this.webPushSubscriptionRepository.save(existing);
    }

    return this.webPushSubscriptionRepository.save(
      this.webPushSubscriptionRepository.create({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        expirationTime:
          typeof subscription.expirationTime === 'number'
            ? String(subscription.expirationTime)
            : null,
        userAgent: userAgent || null,
        isActive: true,
        lastUsedAt: new Date(),
      }),
    );
  }

  async deactivateByEndpoint(userId: string, endpoint: string) {
    const result = await this.webPushSubscriptionRepository.update(
      { userId, endpoint },
      { isActive: false, lastUsedAt: new Date() },
    );
    return result.affected ?? 0;
  }

  async listActiveByUser(userId: string) {
    return this.webPushSubscriptionRepository.find({
      where: { userId, isActive: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async markSuccess(id: string) {
    await this.webPushSubscriptionRepository.update(id, {
      isActive: true,
      lastUsedAt: new Date(),
      lastSuccessAt: new Date(),
      lastErrorMessage: null,
    });
  }

  async markFailure(id: string, message: string, deactivate = false) {
    await this.webPushSubscriptionRepository.update(id, {
      isActive: deactivate ? false : undefined,
      lastUsedAt: new Date(),
      lastFailureAt: new Date(),
      lastErrorMessage: message.slice(0, 1000),
    });
  }
}
