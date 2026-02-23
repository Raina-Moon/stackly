'use client';

import { useEffect, useState } from 'react';
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

const STORAGE_KEY = 'stackly_notification_prefs_draft_v1';

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
  const [prefs, setPrefs] = useState<NotificationPrefsDraft>({
    overdueFollowupEnabled: true,
    delayMinutes: 120,
    channels: {
      email: true,
      slack: false,
      webPush: true,
    },
  });
  const [permission, setPermission] = useState<BrowserPermissionState>('unknown');
  const [subscriptionCount, setSubscriptionCount] = useState<number>(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isSyncingBrowser, setIsSyncingBrowser] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

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
        setPrefs((prev) => ({
          overdueFollowupEnabled:
            typeof parsed.overdueFollowupEnabled === 'boolean'
              ? parsed.overdueFollowupEnabled
              : prev.overdueFollowupEnabled,
          delayMinutes:
            typeof parsed.delayMinutes === 'number' ? parsed.delayMinutes : prev.delayMinutes,
          channels: {
            email:
              typeof parsed.channels?.email === 'boolean'
                ? parsed.channels.email
                : prev.channels.email,
            slack:
              typeof parsed.channels?.slack === 'boolean'
                ? parsed.channels.slack
                : prev.channels.slack,
            webPush:
              typeof parsed.channels?.webPush === 'boolean'
                ? parsed.channels.webPush
                : prev.channels.webPush,
          },
        }));
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
          setPrefs((prev) => ({
            ...prev,
            ...res.preferences,
            channels: {
              ...prev.channels,
              ...res.preferences.channels,
            },
          }));
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
          disabled={!isHydrated || isSavingPrefs}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSavingPrefs ? t('actions.saving') : t('actions.save')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 xl:col-span-2">
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

        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <p className="text-sm font-semibold text-gray-900">{t('summary.title')}</p>
          <div className="mt-3 space-y-2 text-sm">
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
          <p className="mt-4 text-xs text-gray-500">
            {isLoadingPrefs ? t('summary.loading') : t('summary.note')}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {(['email', 'slack', 'webPush'] as NotificationChannelKey[]).map((channel) => (
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

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900">{t('browser.title')}</p>
            <p className="mt-1 text-sm text-blue-700">{t('browser.description')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
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
            <button
              type="button"
              onClick={() => {
                void refreshBrowserStatus();
              }}
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700"
            >
              {t('browser.actions.refresh')}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">{t('footer')}</p>
    </section>
  );
}
