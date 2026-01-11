'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const icons: Record<ToastType, JSX.Element> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const styles: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: 'bg-green-50',
    icon: 'text-green-500',
    border: 'border-green-200',
  },
  error: {
    bg: 'bg-red-50',
    icon: 'text-red-500',
    border: 'border-red-200',
  },
  info: {
    bg: 'bg-blue-50',
    icon: 'text-blue-500',
    border: 'border-blue-200',
  },
  warning: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-500',
    border: 'border-yellow-200',
  },
};

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const style = styles[type];

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        isVisible && !isLeaving
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border ${style.bg} ${style.border}`}
        style={{ minWidth: '300px', maxWidth: '90vw' }}
      >
        <div className={`flex-shrink-0 ${style.icon}`}>{icons[type]}</div>
        <p className="flex-1 text-sm font-medium" style={{ color: 'var(--gray-800)' }}>
          {message}
        </p>
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: 'var(--gray-400)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
