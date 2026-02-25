import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheInvalidationService } from './cache-invalidation.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');

        if (!redisHost) {
          // Fallback to in-memory cache when Redis is not configured
          return { ttl: 300_000 };
        }

        const { redisStore } = await import('cache-manager-redis-yet');

        return {
          store: redisStore,
          socket: {
            host: redisHost,
            port: configService.get<number>('REDIS_PORT', 6379),
          },
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          database: configService.get<number>('REDIS_DB', 0),
          ttl: 300_000,
        };
      },
    }),
  ],
  providers: [CacheService, CacheInvalidationService],
  exports: [CacheService, CacheInvalidationService, CacheModule],
})
export class RedisCacheModule {}
