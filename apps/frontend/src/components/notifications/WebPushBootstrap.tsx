'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { syncWebPushSubscription } from '@/lib/webPush';

export function WebPushBootstrap() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    void syncWebPushSubscription().catch(() => {
      // Silent fail for now; settings page will expose explicit enable/diagnostics later.
    });
  }, [isAuthenticated, isLoading]);

  return null;
}
