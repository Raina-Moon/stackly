'use client';

import { api } from '@/lib/api';

interface WebPushConfigResponse {
  publicKey: string | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export async function syncWebPushSubscription(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (Notification.permission !== 'granted') return;

  const { publicKey } = await api.get<WebPushConfigResponse>('/notifications/web-push/config');
  if (!publicKey) return;

  const registration = await navigator.serviceWorker.register('/web-push-sw.js');
  const existing = await registration.pushManager.getSubscription();

  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await api.post('/notifications/web-push/subscriptions', {
    subscription: subscription.toJSON(),
    userAgent: navigator.userAgent,
  });
}
