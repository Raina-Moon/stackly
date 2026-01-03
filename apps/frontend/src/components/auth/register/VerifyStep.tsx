'use client';

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
        <p className="text-gray-600">
          <span className="font-medium text-gray-900">{email}</span>
          <br />으로 인증코드를 발송했습니다
        </p>
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
          인증코드
        </label>
        <input
          type="text"
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="000000"
          maxLength={6}
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button
        onClick={onSubmit}
        disabled={isLoading || code.length !== 6}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '확인 중...' : '인증하기'}
      </button>

      <div className="flex justify-between text-sm">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          이메일 변경
        </button>
        <button onClick={onResend} disabled={isLoading} className="text-blue-600 hover:text-blue-700">
          코드 재발송
        </button>
      </div>
    </div>
  );
}
