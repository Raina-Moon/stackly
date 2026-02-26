import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { User } from '../../../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from '../dto/update-notification-preferences.dto';
import { CacheService, CacheInvalidationService } from '../../../cache';

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesDto = {
  overdueFollowupEnabled: true,
  delayMinutes: 120,
  slackChannelId: null,
  channels: {
    email: true,
    slack: false,
    webPush: true,
  },
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 이메일 중복 검사
    const existingEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('이미 등록된 이메일입니다.');
    }

    // 닉네임 중복 검사
    const existingNickname = await this.userRepository.findOne({
      where: { nickname: createUserDto.nickname },
    });
    if (existingNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async findByNickname(nickname: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { nickname, deletedAt: IsNull() },
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async findAll(skip = 0, take = 10): Promise<{ data: User[]; total: number }> {
    const [data, total] = await this.userRepository.findAndCount({
      skip,
      take,
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['ownedBoards', 'boardMemberships', 'assignedCards', 'schedules'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async findByIdMinimal(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      select: ['id', 'email', 'nickname', 'isActive'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('이미 등록된 이메일입니다.');
      }
    }

    if (updateUserDto.nickname && updateUserDto.nickname !== user.nickname) {
      const existingUser = await this.userRepository.findOne({
        where: { nickname: updateUserDto.nickname, deletedAt: IsNull() },
      });

      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
    }

    Object.assign(user, updateUserDto);
    const saved = await this.userRepository.save(user);
    await this.cacheInvalidation.onUserProfileChange(id);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    user.deletedAt = new Date();
    await this.userRepository.save(user);
    await this.cacheInvalidation.onUserProfileChange(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  private static readonly SEARCH_TTL = 120_000; // 2 minutes

  async search(query: string, excludeUserId?: string): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchQuery = query.trim().toLowerCase();

    // Cache key based on query hash + excludeUserId
    const raw = `${searchQuery}:${excludeUserId ?? ''}`;
    const hash = createHash('md5').update(raw).digest('hex');
    const cacheKey = this.cacheInvalidation.userSearchKey(hash);

    const cached = await this.cacheService.get<User[]>(cacheKey);
    if (cached) return cached;

    const qb = this.userRepository.createQueryBuilder('user');
    qb.where('user.deletedAt IS NULL');
    qb.andWhere(
      '(LOWER(user.nickname) LIKE :query OR LOWER(user.email) LIKE :query)',
      { query: `%${searchQuery}%` },
    );

    if (excludeUserId) {
      qb.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    qb.orderBy('user.nickname', 'ASC');
    qb.take(20);

    const results = await qb.getMany();
    await this.cacheService.set(cacheKey, results, UserService.SEARCH_TTL);
    return results;
  }

  getNotificationPreferences(user: User): NotificationPreferencesDto {
    const raw =
      user.notificationPreferences && typeof user.notificationPreferences === 'object'
        ? (user.notificationPreferences as Record<string, unknown>)
        : {};

    const rawChannels =
      raw.channels && typeof raw.channels === 'object'
        ? (raw.channels as Record<string, unknown>)
        : {};

    const delayMinutes =
      typeof raw.delayMinutes === 'number' && Number.isFinite(raw.delayMinutes)
        ? Math.min(24 * 60, Math.max(15, Math.round(raw.delayMinutes)))
        : DEFAULT_NOTIFICATION_PREFERENCES.delayMinutes;
    const slackChannelId =
      typeof raw.slackChannelId === 'string' && raw.slackChannelId.trim().length > 0
        ? raw.slackChannelId.trim().slice(0, 100)
        : DEFAULT_NOTIFICATION_PREFERENCES.slackChannelId;

    return {
      overdueFollowupEnabled:
        typeof raw.overdueFollowupEnabled === 'boolean'
          ? raw.overdueFollowupEnabled
          : DEFAULT_NOTIFICATION_PREFERENCES.overdueFollowupEnabled,
      delayMinutes,
      slackChannelId,
      channels: {
        email:
          typeof rawChannels.email === 'boolean'
            ? rawChannels.email
            : DEFAULT_NOTIFICATION_PREFERENCES.channels.email,
        slack:
          typeof rawChannels.slack === 'boolean'
            ? rawChannels.slack
            : DEFAULT_NOTIFICATION_PREFERENCES.channels.slack,
        webPush:
          typeof rawChannels.webPush === 'boolean'
            ? rawChannels.webPush
            : DEFAULT_NOTIFICATION_PREFERENCES.channels.webPush,
      },
    };
  }

  async getMyNotificationPreferences(id: string): Promise<NotificationPreferencesDto> {
    const user = await this.findById(id);
    return this.getNotificationPreferences(user);
  }

  async updateMyNotificationPreferences(
    id: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const user = await this.findById(id);
    const current = this.getNotificationPreferences(user);

    const next: NotificationPreferencesDto = {
      overdueFollowupEnabled:
        typeof dto.overdueFollowupEnabled === 'boolean'
          ? dto.overdueFollowupEnabled
          : current.overdueFollowupEnabled,
      delayMinutes:
        typeof dto.delayMinutes === 'number' && Number.isFinite(dto.delayMinutes)
          ? Math.min(24 * 60, Math.max(15, Math.round(dto.delayMinutes)))
          : current.delayMinutes,
      slackChannelId:
        typeof dto.slackChannelId === 'string'
          ? dto.slackChannelId.trim().slice(0, 100) || null
          : dto.slackChannelId === null
            ? null
            : current.slackChannelId,
      channels: {
        email:
          typeof dto.channels?.email === 'boolean' ? dto.channels.email : current.channels.email,
        slack:
          typeof dto.channels?.slack === 'boolean' ? dto.channels.slack : current.channels.slack,
        webPush:
          typeof dto.channels?.webPush === 'boolean'
            ? dto.channels.webPush
            : current.channels.webPush,
      },
    };

    user.notificationPreferences = next as unknown as Record<string, unknown>;
    await this.userRepository.save(user);
    return next;
  }
}
