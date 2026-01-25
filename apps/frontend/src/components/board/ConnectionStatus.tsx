'use client';

import { useSocket, ConnectionState } from '@/contexts/SocketContext';

export function ConnectionStatus() {
  const { connectionState } = useSocket();

  if (connectionState === 'connected') {
    return null;
  }

  const statusConfig: Record<ConnectionState, { message: string; bgColor: string; icon: React.ReactNode }> = {
    disconnected: {
      message: 'Offline - Changes may not sync',
      bgColor: 'bg-red-500',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
      ),
    },
    connecting: {
      message: 'Connecting...',
      bgColor: 'bg-yellow-500',
      icon: (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ),
    },
    reconnecting: {
      message: 'Reconnecting...',
      bgColor: 'bg-yellow-500',
      icon: (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ),
    },
    connected: {
      message: '',
      bgColor: '',
      icon: null,
    },
  };

  const config = statusConfig[connectionState];

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${config.bgColor} text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-md`}>
      {config.icon}
      <span>{config.message}</span>
    </div>
  );
}
