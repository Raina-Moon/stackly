'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(email, password, rememberMe);

    if (result.success) {
      showToast('로그인 성공!', 'success');
      router.push('/');
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--gray-100)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: 'var(--gray-100)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-blue-600">Stackly</h1>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
            <h2 className="text-2xl font-bold">로그인</h2>
            <p className="mt-2 opacity-90">계정에 로그인하세요</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <Input
              type="email"
              id="email"
              label="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              disabled={isLoading}
            />

            <Input
              type="password"
              id="password"
              label="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--gray-600)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                로그인 상태 유지
              </label>
              <button type="button" className="text-blue-600 hover:text-blue-700">
                비밀번호 찾기
              </button>
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--red-500)' }}>{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 pb-6 text-center text-sm" style={{ color: 'var(--gray-600)' }}>
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              회원가입
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm hover:opacity-80" style={{ color: 'var(--gray-500)' }}>
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
