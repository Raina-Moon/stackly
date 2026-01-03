'use client';

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
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="example@email.com"
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '발송 중...' : '인증코드 받기'}
      </button>

      <p className="text-center text-sm text-gray-500">
        입력한 이메일로 6자리 인증코드가 발송됩니다
      </p>
    </div>
  );
}
