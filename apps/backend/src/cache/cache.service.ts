import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.warn(`Cache get failed for key="${key}": ${error}`);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttlMs);
    } catch (error) {
      this.logger.warn(`Cache set failed for key="${key}": ${error}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.warn(`Cache del failed for key="${key}": ${error}`);
    }
  }

  async delMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.del(key)));
  }
}
