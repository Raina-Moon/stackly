import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../services/user.service';
import { CacheService, CacheInvalidationService } from '../../../cache';

export interface JwtPayload {
  sub: string;
  email: string;
  nickname: string;
}

interface JwtProfile {
  id: string;
  email: string;
  nickname: string;
  isActive: boolean;
}

const JWT_PROFILE_TTL = 300_000; // 5 minutes

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private cacheService: CacheService,
    private cacheInvalidation: CacheInvalidationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const cacheKey = this.cacheInvalidation.jwtProfileKey(payload.sub);

    // Try cache first
    const cached = await this.cacheService.get<JwtProfile>(cacheKey);
    if (cached) {
      if (!cached.isActive) {
        throw new UnauthorizedException('User is not active');
      }
      return { id: cached.id, email: cached.email, nickname: cached.nickname };
    }

    // Cache miss — minimal DB query (no relations)
    const user = await this.userService.findByIdMinimal(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    // Store in cache
    const profile: JwtProfile = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isActive: user.isActive,
    };
    await this.cacheService.set(cacheKey, profile, JWT_PROFILE_TTL);

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    };
  }
}
