import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface VerificationCode {
  code: string;
  expiresAt: Date;
  verified: boolean;
}

@Injectable()
export class EmailService {
  private resend: Resend;
  private verificationCodes: Map<string, VerificationCode> = new Map();

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    console.log(`[EmailService] sendVerificationCode called for: ${email}`);

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    // 인증코드 저장
    this.verificationCodes.set(email, {
      code,
      expiresAt,
      verified: false,
    });

    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    console.log(`[EmailService] API Key exists: ${!!apiKey}`);

    // API 키가 없으면 개발 모드로 콘솔 출력
    if (!apiKey) {
      console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
      return { success: true, message: '인증코드가 발송되었습니다 (개발 모드: 콘솔 확인)' };
    }

    try {
      console.log(`[EmailService] Sending email via Resend to: ${email}`);
      const result = await this.resend.emails.send({
        from: 'Stackly <onboarding@resend.dev>',
        to: email,
        subject: '[Stackly] 이메일 인증코드',
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #3B82F6; font-size: 32px; margin: 0;">Stackly</h1>
            </div>
            <div style="background: #F8FAFC; border-radius: 12px; padding: 40px; text-align: center;">
              <h2 style="color: #1E293B; font-size: 24px; margin: 0 0 16px;">이메일 인증</h2>
              <p style="color: #64748B; font-size: 16px; margin: 0 0 32px;">
                아래 인증코드를 입력하여 이메일을 인증해주세요.
              </p>
              <div style="background: #FFFFFF; border: 2px solid #E2E8F0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3B82F6;">${code}</span>
              </div>
              <p style="color: #94A3B8; font-size: 14px; margin: 0;">
                이 코드는 10분 후에 만료됩니다.
              </p>
            </div>
            <div style="text-align: center; margin-top: 32px; color: #94A3B8; font-size: 12px;">
              본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.
            </div>
          </div>
        `,
      });

      console.log(`[EmailService] Resend API response:`, result);
      console.log(`[EmailService] Verification code: ${code}`);
      return { success: true, message: '인증코드가 발송되었습니다' };
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      console.log(`[EmailService] Falling back - Verification code for ${email}: ${code}`);
      return { success: false, message: '이메일 발송에 실패했습니다' };
    }
  }

  verifyCode(email: string, code: string): { success: boolean; message: string } {
    const stored = this.verificationCodes.get(email);

    if (!stored) {
      return { success: false, message: '인증코드를 먼저 요청해주세요' };
    }

    if (new Date() > stored.expiresAt) {
      this.verificationCodes.delete(email);
      return { success: false, message: '인증코드가 만료되었습니다' };
    }

    if (stored.code !== code) {
      return { success: false, message: '인증코드가 일치하지 않습니다' };
    }

    // 인증 성공
    stored.verified = true;
    this.verificationCodes.set(email, stored);

    return { success: true, message: '이메일 인증이 완료되었습니다' };
  }

  isEmailVerified(email: string): boolean {
    const stored = this.verificationCodes.get(email);
    return stored?.verified === true && new Date() <= stored.expiresAt;
  }

  clearVerification(email: string): void {
    this.verificationCodes.delete(email);
  }
}
