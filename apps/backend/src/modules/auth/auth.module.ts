import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';
import { EmailService } from './email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'stackly-jwt-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController, AuthController],
  providers: [UserService, EmailService],
  exports: [UserService, EmailService, JwtModule],
})
export class AuthModule {}
