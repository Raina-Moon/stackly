'use client';

import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const t = useTranslations('auth');

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    router.push('/login');
  };

  const handleRegister = () => {
    onClose();
    router.push('/register');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
          <Image src="/images/stackly_logo.png" alt="Stackly Logo" width={100} height={100} className='mx-auto'/>
          <p className="mt-2 opacity-90">{t('loginRequiredTitle')}</p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-center text-gray-600">
            {t('loginRequiredBody')}
          </p>

          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t('loginRequiredLogin')}
          </button>

          <button
            onClick={handleRegister}
            className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            {t('loginRequiredRegister')}
          </button>
        </div>

      </div>
    </div>
  );
}
