import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RefreshToken } from '../../../entities/refresh-token.entity';
import { User } from '../../../entities/user.entity';

interface TokenPayload {
  sub: string;
  email: string;
  nickname: string;
}

interface TokenInfo {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  private readonly accessTokenExpiry = '15m'; // 15분
  private readonly refreshTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7일 (밀리초)

  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiry,
    });
  }

  async generateRefreshToken(user: User, tokenInfo?: TokenInfo): Promise<string> {
    // 랜덤 토큰 생성
    const token = crypto.randomBytes(64).toString('hex');

    // 만료 시간 설정
    const expiresAt = new Date(Date.now() + this.refreshTokenExpiry);

    // DB에 저장
    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId: user.id,
      expiresAt,
      userAgent: tokenInfo?.userAgent,
      ipAddress: tokenInfo?.ipAddress,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return token;
  }

  async generateTokens(user: User, tokenInfo?: TokenInfo): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user, tokenInfo);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15분 (초)
    };
  }

  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: {
        token,
        isRevoked: false,
      },
      relations: ['user'],
    });

    if (!refreshToken) {
      return null;
    }

    // 만료 확인
    if (new Date() > refreshToken.expiresAt) {
      // 만료된 토큰 삭제
      await this.refreshTokenRepository.remove(refreshToken);
      return null;
    }

    return refreshToken;
  }

  async revokeRefreshToken(token: string): Promise<boolean> {
    const result = await this.refreshTokenRepository.update(
      { token },
      { isRevoked: true },
    );

    return (result.affected ?? 0) > 0;
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch {
      return null;
    }
  }
}
