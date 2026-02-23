'use client';

import { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationHistory,
} from '@/hooks/useNotifications';
import { useTranslations } from 'next-intl';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function NotificationsPage() {
  const t = useTranslations('notificationsPage');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const historyQuery = useNotificationHistory(100, 0, isAuthenticated);
  const markAllRead = useMarkAllNotificationsRead();
  const markOneRead = useMarkNotificationRead();

  useEffect(() => {
    if (!isAuthenticated) return;
    void markAllRead.mutateAsync().catch(() => {
      // ignore auto-read failure; manual actions still available
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">{t('loginRequiredTitle')}</h1>
          <p className="mt-2 text-sm text-gray-500">{t('loginRequiredDescription')}</p>
        </div>
      </MainLayout>
    );
  }

  const items = historyQuery.data?.data || [];
  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
            {t('unread', { count: unreadCount })}
          </span>
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {markAllRead.isPending ? t('actions.markingAll') : t('actions.markAllRead')}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {historyQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">{t('loading')}</div>
        ) : historyQuery.isError ? (
          <div className="p-8 text-center text-sm text-red-600">{t('loadFailed')}</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">{t('empty')}</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => {
              const title =
                (item.payload?.scheduleTitle as string | undefined) ||
                (item.event?.payload?.scheduleTitle as string | undefined) ||
                t('fallbackTitle');
              const body =
                (item.payload?.messageKo as string | undefined) ||
                (item.event?.payload?.messageKo as string | undefined) ||
                (item.payload?.messageEn as string | undefined) ||
                t('fallbackBody');

              return (
                <li
                  key={item.id}
                  className={`p-4 transition-colors ${item.readAt ? 'bg-white' : 'bg-blue-50/40'}`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.channel === 'email'
                              ? 'bg-indigo-50 text-indigo-700'
                              : item.channel === 'web_push'
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-violet-50 text-violet-700'
                          }`}
                        >
                          {t(`channels.${item.channel}`)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.status === 'sent'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.status === 'failed'
                                ? 'bg-red-50 text-red-700'
                                : item.status === 'skipped'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {t(`status.${item.status}`)}
                        </span>
                        {!item.readAt && (
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" aria-label={t('new')} />
                        )}
                      </div>

                      <p className={`mt-2 text-sm ${item.readAt ? 'text-gray-700' : 'font-medium text-gray-900'}`}>
                        {title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{body}</p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{t('createdAt')}: {formatDateTime(item.createdAt)}</span>
                        <span>{t('sentAt')}: {formatDateTime(item.sentAt)}</span>
                        {item.errorMessage && <span className="text-red-600">{t('error')}: {item.errorMessage}</span>}
                      </div>
                    </div>

                    {!item.readAt && (
                      <button
                        type="button"
                        onClick={() => markOneRead.mutate(item.id)}
                        disabled={markOneRead.isPending}
                        className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {t('actions.markRead')}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MainLayout>
  );
}
