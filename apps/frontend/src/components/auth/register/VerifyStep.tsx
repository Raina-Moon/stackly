'use client';

import Input from '@/components/ui/Input';

interface VerifyStepProps {
  email: string;
  code: string;
  setCode: (code: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
}

export default function VerifyStep({
  email,
  code,
  setCode,
  onSubmit,
  onResend,
  onBack,
  isLoading,
  error,
}: VerifyStepProps) {
  return (
    <div className="p-6 space-y-4">
      <div className="text-center mb-4">
        <p style={{ color: 'var(--gray-600)' }}>
          <span className="font-medium" style={{ color: 'var(--gray-900)' }}>{email}</span>
          <br />으로 인증코드를 발송했습니다
        </p>
      </div>

      <Input
        type="text"
        id="code"
        label="인증코드"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="text-center text-2xl tracking-widest"
        placeholder="000000"
        maxLength={6}
        disabled={isLoading}
        error={error}
      />

      <button
        onClick={onSubmit}
        disabled={isLoading || code.length !== 6}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '확인 중...' : '인증하기'}
      </button>

      <div className="flex justify-between text-sm">
        <button onClick={onBack} className="hover:opacity-80" style={{ color: 'var(--gray-500)' }}>
          이메일 변경
        </button>
        <button onClick={onResend} disabled={isLoading} className="text-blue-600 hover:text-blue-700">
          코드 재발송
        </button>
      </div>
    </div>
  );
}
