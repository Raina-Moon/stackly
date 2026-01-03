import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailService } from '../email.service';
import { UserService } from '../services/user.service';

class SendCodeDto {
  email: string;
}

class VerifyCodeDto {
  email: string;
  code: string;
}

class RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {}

  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  async sendVerificationCode(@Body() dto: SendCodeDto) {
    // 이미 가입된 이메일인지 확인
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      return { success: false, message: '이미 가입된 이메일입니다' };
    }

    return this.emailService.sendVerificationCode(dto.email);
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.emailService.verifyCode(dto.email, dto.code);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    // 이메일 인증 여부 확인
    if (!this.emailService.isEmailVerified(dto.email)) {
      return { success: false, message: '이메일 인증이 필요합니다' };
    }

    // 사용자 생성
    try {
      const user = await this.userService.create({
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });

      // 인증 정보 삭제
      this.emailService.clearVerification(dto.email);

      return {
        success: true,
        message: '회원가입이 완료되었습니다',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      return { success: false, message: '회원가입에 실패했습니다' };
    }
  }
}
