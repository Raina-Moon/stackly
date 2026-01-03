import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email.service';
import { UserService } from '../services/user.service';

class SendCodeDto {
  email: string;
}

class VerifyCodeDto {
  email: string;
  code: string;
}

class CheckNicknameDto {
  nickname: string;
}

class RegisterDto {
  email: string;
  password: string;
  nickname: string;
  firstName: string;
  lastName?: string;
}

class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly emailService: EmailService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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

  @Post('check-nickname')
  @HttpCode(HttpStatus.OK)
  async checkNickname(@Body() dto: CheckNicknameDto) {
    if (!dto.nickname || dto.nickname.length < 2 || dto.nickname.length > 20) {
      return { success: false, available: false, message: '닉네임은 2~20자여야 합니다' };
    }

    const existingUser = await this.userService.findByNickname(dto.nickname);
    if (existingUser) {
      return { success: true, available: false, message: '이미 사용 중인 닉네임입니다' };
    }

    return { success: true, available: true, message: '사용 가능한 닉네임입니다' };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    // 이메일 인증 여부 확인
    if (!this.emailService.isEmailVerified(dto.email)) {
      return { success: false, message: '이메일 인증이 필요합니다' };
    }

    // 닉네임 중복 검사
    const existingNickname = await this.userService.findByNickname(dto.nickname);
    if (existingNickname) {
      return { success: false, message: '이미 사용 중인 닉네임입니다' };
    }

    // 사용자 생성
    try {
      const user = await this.userService.create({
        email: dto.email,
        password: dto.password,
        nickname: dto.nickname,
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
          nickname: user.nickname,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      return { success: false, message: '회원가입에 실패했습니다' };
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    // 이메일로 사용자 찾기
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다' };
    }

    // 비밀번호 검증
    const isPasswordValid = await this.userService.validatePassword(dto.password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다' };
    }

    // 마지막 로그인 시간 업데이트
    await this.userService.updateLastLogin(user.id);

    // JWT 토큰 생성
    const payload = { sub: user.id, email: user.email, nickname: user.nickname };
    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: '로그인 성공',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    };
  }
}
