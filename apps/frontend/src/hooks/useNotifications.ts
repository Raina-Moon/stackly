'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface NotificationHistoryItem {
  id: string;
  eventId: string;
  channel: 'email' | 'slack' | 'web_push';
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'skipped';
  attemptCount: number;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  sentAt?: string | null;
  readAt?: string | null;
  payload?: Record<string, unknown> | null;
  event?: {
    id: string;
    type: string;
    status: string;
    dedupKey: string;
    payload?: Record<string, unknown> | null;
    createdAt: string;
    processedAt?: string | null;
  } | null;
}

interface NotificationHistoryResponse {
  success: boolean;
  total: number;
  data: NotificationHistoryItem[];
}

interface NotificationSummaryResponse {
  success: boolean;
  unreadCount: number;
  hasUnread: boolean;
  latest: {
    id: string;
    createdAt: string;
    status: string;
    channel: string;
  } | null;
}

export function useNotificationSummary(enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: () => api.get<NotificationSummaryResponse>('/notifications/history/summary'),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useNotificationHistory(take = 50, skip = 0, enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'history', take, skip],
    queryFn: () =>
      api.get<NotificationHistoryResponse>(
        `/notifications/history?take=${encodeURIComponent(String(take))}&skip=${encodeURIComponent(String(skip))}`,
      ),
    enabled,
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<{ success: boolean; updated: number }>('/notifications/history/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<{ success: boolean; updated: number }>(`/notifications/history/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
