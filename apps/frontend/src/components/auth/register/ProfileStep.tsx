'use client';

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
        <p className="text-gray-600">이메일 인증 완료!</p>
      </div>

      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
          닉네임 *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              nicknameAvailable === true
                ? 'border-green-500'
                : nicknameAvailable === false
                  ? 'border-red-500'
                  : 'border-gray-300'
            }`}
            placeholder="2~20자"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={checkNickname}
            disabled={isLoading || nickname.length < 2}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            중복확인
          </button>
        </div>
        {nicknameAvailable === true && (
          <p className="text-green-600 text-sm mt-1">사용 가능한 닉네임입니다</p>
        )}
        {nicknameAvailable === false && (
          <p className="text-red-500 text-sm mt-1">이미 사용 중인 닉네임입니다</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            이름 *
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="길동"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            성
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="홍"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호 *
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="6자 이상"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호 확인 *
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="비밀번호 다시 입력"
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

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
