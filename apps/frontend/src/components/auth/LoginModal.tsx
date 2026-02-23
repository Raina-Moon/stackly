'use client';

import { useState } from 'react';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const router = useRouter();
  const t = useTranslations('auth');
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setIsLoading(false);
    setError('');
    setPassword('');
    onClose();
  };

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
      resetAndClose();
      onLoginSuccess?.();
      return;
    }

    setError(result.message);
    setIsLoading(false);
  };

  const handleRegister = () => {
    resetAndClose();
    router.push('/register');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={resetAndClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
          <Image src="/images/stackly_logo.png" alt="Stackly Logo" width={100} height={100} className='mx-auto'/>
        </div>

        {/* Close button */}
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <p className="text-center text-gray-600">
            {t('loginRequiredBody')}
          </p>

          <Input
            type="email"
            id="login-modal-email"
            label={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            disabled={isLoading}
          />

          <Input
            type="password"
            id="login-modal-password"
            label={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
          />

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isLoading}
            />
            {t('rememberMe')}
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('loggingIn') : t('loginButton')}
          </button>

          <button
            type="button"
            onClick={handleRegister}
            className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            {t('loginRequiredRegister')}
          </button>
        </form>

      </div>
    </div>
  );
}
