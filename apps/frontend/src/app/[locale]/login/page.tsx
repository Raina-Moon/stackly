'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Check for pending invite
      const pendingInvite = sessionStorage.getItem('pendingInvite');
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite');
        router.push(`/invite/${pendingInvite}`);
        return;
      }

      // Check for redirect URL
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        router.push(redirect);
        return;
      }

      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError(t('loginMissingFields'));
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(email, password, rememberMe);

    if (result.success) {
      showToast(t('loginSuccess'), 'success');

      // Check for pending invite
      const pendingInvite = sessionStorage.getItem('pendingInvite');
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite');
        router.push(`/invite/${pendingInvite}`);
        return;
      }

      // Check for redirect URL
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      router.push(redirect || '/');
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
            <h2 className="text-2xl font-bold">{t('loginTitle')}</h2>
            <p className="mt-2 opacity-90">{t('loginSubtitle')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <Input
              type="email"
              id="email"
              label={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              disabled={isLoading}
            />

            <Input
              type="password"
              id="password"
              label={t('password')}
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
                {t('rememberMe')}
              </label>
              <button type="button" className="text-blue-600 hover:text-blue-700">
                {t('forgotPassword')}
              </button>
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--red-500)' }}>{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('loggingIn') : t('loginButton')}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 pb-6 text-center text-sm" style={{ color: 'var(--gray-600)' }}>
            {t('noAccount')}{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('register')}
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm hover:opacity-80" style={{ color: 'var(--gray-500)' }}>
            ← {t('backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
