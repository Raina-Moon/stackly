import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController, AuthController],
  providers: [UserService, EmailService],
  exports: [UserService, EmailService],
})
export class AuthModule {}
