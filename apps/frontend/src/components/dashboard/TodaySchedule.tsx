'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSchedulesByUserRange } from '@/hooks/useSchedule';

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  type: 'event' | 'deadline' | 'reminder' | 'milestone';
  isLinkedCard?: boolean;
}

const typeStyles = {
  event:
    'bg-blue-100 text-blue-600 border-blue-200 shadow-[0_4px_10px_rgba(73,136,196,0.10)]',
  deadline:
    'bg-red-100 text-red-600 border-red-200 shadow-[0_4px_10px_rgba(239,68,68,0.08)]',
  reminder:
    'bg-yellow-100 text-yellow-600 border-yellow-200 shadow-[0_4px_10px_rgba(234,179,8,0.10)]',
  milestone:
    'bg-purple-100 text-purple-600 border-purple-200 shadow-[0_4px_10px_rgba(139,92,246,0.10)]',
};

const typeIcons = {
  event: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  deadline: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reminder: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  milestone: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
};

interface TodayScheduleProps {
  onItemClick?: (id: string) => void;
}

export default function TodaySchedule({ onItemClick }: TodayScheduleProps) {
  const t = useTranslations('schedule');
  const locale = useLocale();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: todaySchedules = [], isLoading } = useSchedulesByUserRange(
    user?.id || '',
    startOfDay.toISOString(),
    endOfDay.toISOString()
  );

  const schedules = useMemo<ScheduleItem[]>(() => {
    if (!isAuthenticated) {
      return [
        { id: '1', title: t('demoMeeting'), time: '10:00', type: 'event' },
        { id: '2', title: t('demoDeadline'), time: '14:00', type: 'deadline' },
        { id: '3', title: t('demoReview'), time: '16:00', type: 'reminder' },
      ];
    }

    return [...todaySchedules]
      .filter((schedule) => schedule.userId === user?.id && !!schedule.cardId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 6)
      .map((schedule) => {
        const start = new Date(schedule.startTime);
        const time = start.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        return {
          id: schedule.id,
          title: schedule.title,
          time,
          type: schedule.type,
          isLinkedCard: !!schedule.cardId,
        };
      });
  }, [isAuthenticated, todaySchedules, user?.id, locale, t]);

  const formattedDate = today.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
        <button
          onClick={() => router.push('/schedule')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {t('viewAll')}
        </button>
      </div>

      {isAuthenticated && isLoading ? (
        <div className="py-8 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>{t('empty')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {schedules.map((schedule) => (
            <li key={schedule.id}>
              <button
                onClick={() => onItemClick?.(schedule.id)}
                className={`group relative w-full overflow-hidden rounded-xl border p-3 transition-all duration-150 ease-out hover:-translate-y-px active:translate-y-0 ${typeStyles[schedule.type]}`}
              >
                <span className="pointer-events-none absolute inset-x-3 top-1 h-1/3 rounded-full bg-white/25 blur-sm" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-black/[0.02]" />

                <span className="relative z-10">
                  {typeIcons[schedule.type]}
                </span>
                <span className="relative z-10 min-w-0 flex-1 text-left">
                  <span className="block truncate font-medium">
                    {schedule.title}
                  </span>
                  {schedule.isLinkedCard && (
                    <span className="mt-1 inline-flex rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
                      카드 연결
                    </span>
                  )}
                </span>
                <span className="relative z-10 text-sm opacity-75">{schedule.time}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add schedule button */}
      <button className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {t('add')}
      </button>
    </div>
  );
}
