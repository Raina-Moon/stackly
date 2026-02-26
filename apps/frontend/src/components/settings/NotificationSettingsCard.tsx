'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { syncWebPushSubscription } from '@/lib/webPush';
import { useToast } from '@/contexts/ToastContext';

type NotificationChannelKey = 'email' | 'slack' | 'webPush';
type BrowserPermissionState = NotificationPermission | 'unsupported' | 'unknown';

interface NotificationPrefsDraft {
  overdueFollowupEnabled: boolean;
  delayMinutes: number;
  channels: Record<NotificationChannelKey, boolean>;
}

interface WebPushSubscriptionsResponse {
  subscriptions: Array<{ id: string; endpoint: string }>;
}

interface NotificationPreferencesResponse {
  success: boolean;
  preferences: NotificationPrefsDraft;
}

interface NotificationTestResponse {
  success: boolean;
  message: string;
  event?: {
    id: string;
    status: string;
    channels: string[];
  };
}

const STORAGE_KEY = 'stackly_notification_prefs_draft_v1';
const DEFAULT_NOTIFICATION_PREFS: NotificationPrefsDraft = {
  overdueFollowupEnabled: true,
  delayMinutes: 120,
  channels: {
    email: true,
    slack: false,
    webPush: true,
  },
};

function normalizePrefs(
  input?: Partial<NotificationPrefsDraft> | null,
  base: NotificationPrefsDraft = DEFAULT_NOTIFICATION_PREFS,
): NotificationPrefsDraft {
  return {
    overdueFollowupEnabled:
      typeof input?.overdueFollowupEnabled === 'boolean'
        ? input.overdueFollowupEnabled
        : base.overdueFollowupEnabled,
    delayMinutes:
      typeof input?.delayMinutes === 'number' ? input.delayMinutes : base.delayMinutes,
    channels: {
      email:
        typeof input?.channels?.email === 'boolean' ? input.channels.email : base.channels.email,
      slack:
        typeof input?.channels?.slack === 'boolean' ? input.channels.slack : base.channels.slack,
      webPush:
        typeof input?.channels?.webPush === 'boolean'
          ? input.channels.webPush
          : base.channels.webPush,
    },
  };
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function NotificationSettingsCard() {
  const t = useTranslations('settings.notificationCenter');
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefsDraft>(DEFAULT_NOTIFICATION_PREFS);
  const [permission, setPermission] = useState<BrowserPermissionState>('unknown');
  const [subscriptionCount, setSubscriptionCount] = useState<number>(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSyncingBrowser, setIsSyncingBrowser] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [lastSyncedPrefs, setLastSyncedPrefs] = useState<NotificationPrefsDraft>(DEFAULT_NOTIFICATION_PREFS);

  const refreshBrowserStatus = async () => {
    const permissionState: BrowserPermissionState =
      typeof window === 'undefined'
        ? 'unknown'
        : !('Notification' in window)
          ? 'unsupported'
          : Notification.permission;
    setPermission(permissionState);

    if (
      typeof window === 'undefined' ||
      permissionState !== 'granted' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      setSubscriptionCount(0);
      return;
    }

    try {
      const data = await api.get<WebPushSubscriptionsResponse>('/notifications/web-push/subscriptions');
      setSubscriptionCount(Array.isArray(data.subscriptions) ? data.subscriptions.length : 0);
    } catch {
      setSubscriptionCount(0);
    }
  };

  useEffect(() => {
    setIsHydrated(true);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<NotificationPrefsDraft>;
        const nextFromDraft = normalizePrefs(parsed);
        setPrefs(nextFromDraft);
        setLastSyncedPrefs(nextFromDraft);
      }
    } catch {
      // ignore malformed draft
    }

    void refreshBrowserStatus();

    setIsLoadingPrefs(true);
    void api
      .get<NotificationPreferencesResponse>('/users/me/notification-preferences')
      .then((res) => {
        if (res?.preferences) {
          const merged = normalizePrefs(res.preferences);
          setPrefs(merged);
          setLastSyncedPrefs(merged);
        }
      })
      .catch(() => {
        // fallback to local draft only
      })
      .finally(() => {
        setIsLoadingPrefs(false);
      });
  }, []);

  const savePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      await api.patch<NotificationPreferencesResponse>('/users/me/notification-preferences', prefs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setLastSyncedPrefs(prefs);
      showToast(t('toast.saved'), 'success');
    } catch {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      } catch {
        // ignore fallback write failure
      }
      showToast(t('toast.failed'), 'error');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const requestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast(t('toast.browserUnsupported'), 'warning');
      return;
    }

    setIsRequestingPermission(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await syncBrowserSubscription();
        showToast(t('toast.permissionGranted'), 'success');
      } else if (result === 'denied') {
        showToast(t('toast.permissionDenied'), 'warning');
      } else {
        showToast(t('toast.permissionDismissed'), 'info');
      }
    } catch {
      showToast(t('toast.permissionFailed'), 'error');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const sendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      const res = await api.post<NotificationTestResponse>('/notifications/test/schedule-followup');
      const channelCount = Array.isArray(res?.event?.channels) ? res.event!.channels.length : 0;
      showToast(
        channelCount > 0
          ? t('toast.testQueuedWithChannels', { count: channelCount })
          : t('toast.testQueued'),
        'success',
      );
      await refreshBrowserStatus();
    } catch (error: any) {
      showToast(error?.message || t('toast.testFailed'), 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const syncBrowserSubscription = async () => {
    setIsSyncingBrowser(true);
    try {
      await syncWebPushSubscription();
      await refreshBrowserStatus();
      showToast(t('toast.browserSynced'), 'success');
    } catch (error: any) {
      showToast(error?.message || t('toast.browserSyncFailed'), 'error');
    } finally {
      setIsSyncingBrowser(false);
    }
  };

  const permissionLabel =
    permission === 'granted'
      ? t('browser.permission.granted')
      : permission === 'denied'
        ? t('browser.permission.denied')
        : permission === 'default'
          ? t('browser.permission.default')
          : permission === 'unsupported'
            ? t('browser.permission.unsupported')
            : t('browser.permission.unknown');

  const visibleChannels: NotificationChannelKey[] = ['email', 'webPush'];
  const isDirty = useMemo(() => {
    return JSON.stringify(prefs) !== JSON.stringify(lastSyncedPrefs);
  }, [prefs, lastSyncedPrefs]);

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              {t('badge')}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
        </div>
        <button
          type="button"
          onClick={savePreferences}
          disabled={!isHydrated || isSavingPrefs || !isDirty}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSavingPrefs ? t('actions.saving') : t('actions.save')}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{t('overdue.title')}</p>
              <p className="mt-1 text-sm text-gray-500">{t('overdue.description')}</p>
            </div>
            <Toggle
              checked={prefs.overdueFollowupEnabled}
              onChange={(checked) =>
                setPrefs((prev) => ({ ...prev, overdueFollowupEnabled: checked }))
              }
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('overdue.delayLabel')}
              </span>
              <select
                value={prefs.delayMinutes}
                onChange={(e) =>
                  setPrefs((prev) => ({ ...prev, delayMinutes: Number(e.target.value) }))
                }
                disabled={!prefs.overdueFollowupEnabled}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {[30, 60, 90, 120, 180, 240].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {t('overdue.delayOption', { minutes })}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {t('overdue.previewLabel')}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-800">
                {t('overdue.previewValue', { minutes: prefs.delayMinutes })}
              </p>
            </div>
          </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {visibleChannels.map((channel) => (
          <div key={channel} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {t(`channels.${channel}.label`)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t(`channels.${channel}.description`)}
                </p>
              </div>
              <Toggle
                checked={prefs.channels[channel]}
                onChange={(checked) =>
                  setPrefs((prev) => ({
                    ...prev,
                    channels: { ...prev.channels, [channel]: checked },
                  }))
                }
              />
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                  prefs.channels[channel]
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-100 text-gray-600'
                }`}
              >
                {prefs.channels[channel] ? t('channels.enabled') : t('channels.disabled')}
              </span>
            </div>
          </div>
        ))}
      </div>

      <details className="mt-4 group rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-900">{t('browser.title')}</p>
            <p className="mt-1 text-sm text-blue-700">{t('browser.description')}</p>
          </div>
          <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700">
            Advanced
          </span>
        </summary>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-white/80 bg-white/70 p-3">
            <p className="text-sm font-semibold text-emerald-900">{t('test.title')}</p>
            <p className="mt-1 text-sm text-emerald-700">{t('test.description')}</p>
            <button
              type="button"
              onClick={sendTestNotification}
              disabled={isSendingTest}
              className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isSendingTest ? t('test.actions.sending') : t('test.actions.send')}
            </button>
          </div>

          <div className="rounded-lg border border-white/80 bg-white/70 p-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">{t('summary.browserPermission')}</span>
                <span className="font-medium text-gray-900">{permissionLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">{t('summary.browserSubscriptions')}</span>
                <span className="font-medium text-gray-900">{subscriptionCount}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">{t('summary.activeChannels')}</span>
                <span className="font-medium text-gray-900">
                  {Object.values(prefs.channels).filter(Boolean).length}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {isLoadingPrefs ? t('summary.loading') : t('summary.note')}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={requestBrowserPermission}
                disabled={isRequestingPermission || permission === 'unsupported'}
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRequestingPermission ? t('browser.actions.requesting') : t('browser.actions.request')}
              </button>
              <button
                type="button"
                onClick={syncBrowserSubscription}
                disabled={isSyncingBrowser || permission !== 'granted'}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSyncingBrowser ? t('browser.actions.syncing') : t('browser.actions.sync')}
              </button>
            </div>
          </div>
        </div>
      </details>

      <p className="mt-4 text-xs text-gray-500">{t('footer')}</p>
    </section>
  );
}
