import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthUser, GetUser } from '../../auth/decorators/get-user.decorator';
import {
  WebPushSubscriptionInput,
  WebPushSubscriptionService,
} from '../services/web-push-subscription.service';
import { ConfigService } from '@nestjs/config';

@Controller('notifications/web-push')
@UseGuards(JwtAuthGuard)
export class WebPushSubscriptionController {
  constructor(
    private readonly webPushSubscriptionService: WebPushSubscriptionService,
    private readonly configService: ConfigService,
  ) {}

  @Get('config')
  getConfig() {
    return {
      publicKey: this.configService.get<string>('WEB_PUSH_VAPID_PUBLIC_KEY') || null,
    };
  }

  @Get('subscriptions')
  async getMySubscriptions(@GetUser() user: AuthUser) {
    const subscriptions = await this.webPushSubscriptionService.listActiveByUser(user.id);
    return {
      subscriptions: subscriptions.map((subscription) => ({
        id: subscription.id,
        endpoint: subscription.endpoint,
        userAgent: subscription.userAgent,
        lastUsedAt: subscription.lastUsedAt,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      })),
    };
  }

  @Post('subscriptions')
  async upsertSubscription(
    @Body()
    body: {
      subscription: WebPushSubscriptionInput;
      userAgent?: string;
    },
    @GetUser() user: AuthUser,
  ) {
    const saved = await this.webPushSubscriptionService.upsert(
      user.id,
      body.subscription,
      body.userAgent || null,
    );

    return {
      message: '브라우저 알림 구독이 저장되었습니다.',
      subscription: {
        id: saved.id,
        endpoint: saved.endpoint,
        isActive: saved.isActive,
      },
    };
  }

  @Delete('subscriptions')
  async removeSubscription(
    @Body()
    body: {
      endpoint: string;
    },
    @GetUser() user: AuthUser,
  ) {
    const affected = await this.webPushSubscriptionService.deactivateByEndpoint(user.id, body.endpoint);
    return {
      message: affected ? '브라우저 알림 구독이 해제되었습니다.' : '구독을 찾지 못했습니다.',
      affected,
    };
  }
}
