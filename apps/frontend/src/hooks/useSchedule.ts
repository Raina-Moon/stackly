'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ScheduleType = 'event' | 'deadline' | 'reminder' | 'milestone';
export type ScheduleStatus = 'pending' | 'in_progress' | 'completed';

export interface Schedule {
  id: string;
  title: string;
  description?: string;
  type: ScheduleType;
  status: ScheduleStatus;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
  color?: string;
  userId: string;
  cardId?: string | null;
  card?: {
    id: string;
    title: string;
    assigneeId?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleDto {
  title: string;
  description?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  startTime: string;
  endTime: string;
  userId: string;
  cardId?: string;
  isAllDay?: boolean;
  color?: string;
}

export interface UpdateScheduleDto {
  title?: string;
  description?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  startTime?: string;
  endTime?: string;
  cardId?: string;
  isAllDay?: boolean;
  color?: string;
}

export function useSchedulesByCard(cardId: string) {
  return useQuery({
    queryKey: ['schedules', 'card', cardId],
    queryFn: () => api.get<Schedule[]>(`/schedules/card/${cardId}`),
    enabled: !!cardId,
  });
}

export function useSchedulesByUserRange(userId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['schedules', 'user', userId, 'range', startDate, endDate],
    queryFn: () =>
      api.get<Schedule[]>(
        `/schedules/user/${userId}/range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      ),
    enabled: !!userId && !!startDate && !!endDate,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduleDto) => api.post<Schedule>('/schedules', data),
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      if (schedule.cardId) {
        queryClient.invalidateQueries({ queryKey: ['schedules', 'card', schedule.cardId] });
        queryClient.invalidateQueries({ queryKey: ['card', schedule.cardId] });
      }
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleDto }) =>
      api.put<Schedule>(`/schedules/${id}`, data),
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      if (schedule.cardId) {
        queryClient.invalidateQueries({ queryKey: ['schedules', 'card', schedule.cardId] });
        queryClient.invalidateQueries({ queryKey: ['card', schedule.cardId] });
      }
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cardId }: { id: string; cardId?: string | null }) =>
      api.delete<{ message: string }>(`/schedules/${id}`).then((res) => ({ ...res, cardId })),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      if (result.cardId) {
        queryClient.invalidateQueries({ queryKey: ['schedules', 'card', result.cardId] });
        queryClient.invalidateQueries({ queryKey: ['card', result.cardId] });
      }
    },
  });
}
