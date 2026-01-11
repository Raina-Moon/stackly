'use client';

import Input from '@/components/ui/Input';

function validatePassword(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

function isPasswordValid(password: string) {
  const v = validatePassword(password);
  return v.minLength && v.hasUppercase && v.hasLowercase && v.hasNumber && v.hasSpecial;
}

function PasswordRequirements({ password }: { password: string }) {
  const validation = validatePassword(password);

  const requirements = [
    { key: 'minLength', label: '8자 이상', met: validation.minLength },
    { key: 'hasUppercase', label: '대문자 포함', met: validation.hasUppercase },
    { key: 'hasLowercase', label: '소문자 포함', met: validation.hasLowercase },
    { key: 'hasNumber', label: '숫자 포함', met: validation.hasNumber },
    { key: 'hasSpecial', label: '특수문자 포함', met: validation.hasSpecial },
  ];

  return (
    <div className="mt-2 grid grid-cols-2 gap-1">
      {requirements.map((req) => (
        <div key={req.key} className="flex items-center gap-1 text-xs">
          {req.met ? (
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" style={{ color: 'var(--gray-300)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span style={{ color: req.met ? '#16a34a' : 'var(--gray-400)' }}>{req.label}</span>
        </div>
      ))}
    </div>
  );
}

interface ProfileStepProps {
  nickname: string;
  setNickname: (nickname: string) => void;
  nicknameAvailable: boolean | null;
  checkNickname: () => void;
  firstName: string;
  setFirstName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
}

export default function ProfileStep({
  nickname,
  setNickname,
  nicknameAvailable,
  checkNickname,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  isLoading,
  error,
}: ProfileStepProps) {
  return (
    <div className="p-6 space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p style={{ color: 'var(--gray-600)' }}>이메일 인증 완료!</p>
      </div>

      <div>
        <label htmlFor="nickname" className="block text-sm font-medium mb-1" style={{ color: 'var(--gray-700)' }}>
          닉네임 *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={`flex-1 px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              nicknameAvailable === true
                ? 'border-green-500'
                : nicknameAvailable === false
                  ? 'border-red-500'
                  : 'border-gray-300'
            }`}
            style={{ color: 'var(--gray-900)' }}
            placeholder="2~20자"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={checkNickname}
            disabled={isLoading || nickname.length < 2}
            className="px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ backgroundColor: 'var(--gray-100)', color: 'var(--gray-700)' }}
          >
            중복확인
          </button>
        </div>
        {nicknameAvailable === true && (
          <p className="text-green-600 text-sm mt-1">사용 가능한 닉네임입니다</p>
        )}
        {nicknameAvailable === false && (
          <p className="text-sm mt-1" style={{ color: 'var(--red-500)' }}>이미 사용 중인 닉네임입니다</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="text"
          id="firstName"
          label="이름 *"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="길동"
          disabled={isLoading}
        />
        <Input
          type="text"
          id="lastName"
          label="성"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="홍"
          disabled={isLoading}
        />
      </div>

      <div>
        <Input
          type="password"
          id="password"
          label="비밀번호 *"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={password && !isPasswordValid(password) ? 'border-red-300' : ''}
          placeholder="8자 이상, 대소문자/숫자/특수문자 포함"
          disabled={isLoading}
        />
        {password && <PasswordRequirements password={password} />}
      </div>

      <Input
        type="password"
        id="confirmPassword"
        label="비밀번호 확인 *"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="비밀번호 다시 입력"
        disabled={isLoading}
      />

      {error && <p className="text-sm" style={{ color: 'var(--red-500)' }}>{error}</p>}

      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '가입 중...' : '회원가입 완료'}
      </button>
    </div>
  );
}
