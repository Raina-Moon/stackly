'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRegister } from '@/hooks/useRegister';
import EmailStep from '@/components/auth/register/EmailStep';
import VerifyStep from '@/components/auth/register/VerifyStep';
import ProfileStep from '@/components/auth/register/ProfileStep';

const STEP_INFO = {
  email: { title: '회원가입', subtitle: '이메일을 입력해주세요', num: 1 },
  verify: { title: '이메일 인증', subtitle: '인증코드를 입력해주세요', num: 2 },
  profile: { title: '프로필 설정', subtitle: '마지막 단계입니다', num: 3 },
};

export default function RegisterPage() {
  const {
    step, isLoading, error,
    email, setEmail,
    code, setCode,
    firstName, setFirstName,
    lastName, setLastName,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    sendCode, verifyCode, register, goBack,
  } = useRegister();

  const stepInfo = STEP_INFO[step];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/images/stackly_logo.png" alt="Stackly Logo" width={100} height={100} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
            <h2 className="text-2xl font-bold">{stepInfo.title}</h2>
            <p className="mt-2 opacity-90">{stepInfo.subtitle}</p>
          </div>

          {/* Progress */}
          <div className="flex justify-center gap-2 py-4 bg-gray-50">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`w-2 h-2 rounded-full transition-colors ${
                  stepInfo.num >= n ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Steps */}
          {step === 'email' && (
            <EmailStep
              email={email}
              setEmail={setEmail}
              onSubmit={sendCode}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === 'verify' && (
            <VerifyStep
              email={email}
              code={code}
              setCode={setCode}
              onSubmit={verifyCode}
              onResend={sendCode}
              onBack={goBack}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === 'profile' && (
            <ProfileStep
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              onSubmit={register}
              isLoading={isLoading}
              error={error}
            />
          )}

          {/* Footer */}
          <div className="px-6 pb-6 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
