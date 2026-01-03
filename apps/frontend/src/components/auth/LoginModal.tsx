'use client';

import { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RegisterStep = 'email' | 'verify' | 'profile';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setFirstName('');
    setLastName('');
    setRegisterStep('email');
    setError('');
    setCodeSent(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const switchMode = (toLogin: boolean) => {
    resetForm();
    setIsLoginMode(toLogin);
  };

  // 인증코드 발송
  const handleSendCode = async () => {
    if (!email) {
      setError('이메일을 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setCodeSent(true);
        setRegisterStep('verify');
      } else {
        setError(data.message);
      }
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 인증코드 확인
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('6자리 인증코드를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();

      if (data.success) {
        setRegisterStep('profile');
      } else {
        setError(data.message);
      }
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 완료
  const handleRegister = async () => {
    if (!firstName) {
      setError('이름을 입력해주세요');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await res.json();

      if (data.success) {
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        switchMode(true);
      } else {
        setError(data.message);
      }
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 로그인 API 연동
    console.log('Login', { email, password });
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="p-6 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="example@email.com"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
          required
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-600">
          <input type="checkbox" className="rounded border-gray-300" />
          로그인 상태 유지
        </label>
        <button type="button" className="text-blue-600 hover:text-blue-700">
          비밀번호 찾기
        </button>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        로그인
      </button>
    </form>
  );

  const renderRegisterStep = () => {
    switch (registerStep) {
      case 'email':
        return (
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                id="reg-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@email.com"
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={handleSendCode}
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

      case 'verify':
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
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleVerifyCode}
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '확인 중...' : '인증하기'}
            </button>

            <div className="flex justify-between text-sm">
              <button
                onClick={() => setRegisterStep('email')}
                className="text-gray-500 hover:text-gray-700"
              >
                이메일 변경
              </button>
              <button
                onClick={handleSendCode}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-700"
              >
                코드 재발송
              </button>
            </div>
          </div>
        );

      case 'profile':
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="홍"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 *
              </label>
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="6자 이상"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인 *
              </label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호 다시 입력"
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '가입 중...' : '회원가입 완료'}
            </button>
          </div>
        );
    }
  };

  const getHeaderText = () => {
    if (isLoginMode) {
      return { title: '계정에 로그인하세요', subtitle: '' };
    }
    switch (registerStep) {
      case 'email':
        return { title: '회원가입', subtitle: '이메일을 입력해주세요' };
      case 'verify':
        return { title: '이메일 인증', subtitle: '인증코드를 입력해주세요' };
      case 'profile':
        return { title: '프로필 설정', subtitle: '마지막 단계입니다' };
    }
  };

  const headerText = getHeaderText();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
          <h2 className="text-2xl font-bold">Stackly</h2>
          <p className="mt-2 opacity-90">{headerText.title}</p>
          {headerText.subtitle && (
            <p className="mt-1 text-sm opacity-75">{headerText.subtitle}</p>
          )}
        </div>

        {/* Progress indicator for registration */}
        {!isLoginMode && (
          <div className="flex justify-center gap-2 py-4 bg-gray-50">
            {['email', 'verify', 'profile'].map((step, index) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  ['email', 'verify', 'profile'].indexOf(registerStep) >= index
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        {isLoginMode ? renderLoginForm() : renderRegisterStep()}

        {/* Footer */}
        <div className="px-6 pb-6 text-center text-sm text-gray-600">
          {isLoginMode ? (
            <>
              계정이 없으신가요?{' '}
              <button
                type="button"
                onClick={() => switchMode(false)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                onClick={() => switchMode(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
