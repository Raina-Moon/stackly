'use client';

import Input from '@/components/ui/Input';

interface EmailStepProps {
  email: string;
  setEmail: (email: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
}

export default function EmailStep({ email, setEmail, onSubmit, isLoading, error }: EmailStepProps) {
  return (
    <div className="p-6 space-y-4">
      <Input
        type="email"
        id="email"
        label="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="example@email.com"
        disabled={isLoading}
        error={error}
      />

      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '발송 중...' : '인증코드 받기'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--gray-500)' }}>
        입력한 이메일로 6자리 인증코드가 발송됩니다
      </p>
    </div>
  );
}
