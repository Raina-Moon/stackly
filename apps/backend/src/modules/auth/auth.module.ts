import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';
import { EmailService } from './email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'stackly-jwt-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController, AuthController],
  providers: [UserService, AuthService, EmailService],
  exports: [UserService, AuthService, EmailService, JwtModule],
})
export class AuthModule {}
