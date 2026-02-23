'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Card } from './useBoard';

// DTOs
export interface CreateCardDto {
  title: string;
  description?: string;
  position: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  color?: string;
  tags?: string[];
  estimatedHours?: number;
  dueDate?: string;
  columnId: string;
  assigneeId?: string;
  assigneeIds?: string[];
}

export interface UpdateCardDto {
  title?: string;
  description?: string;
  position?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  color?: string;
  tags?: string[];
  estimatedHours?: number;
  dueDate?: string;
  columnId?: string;
  assigneeId?: string;
  assigneeIds?: string[];
  completedAt?: string;
}

export interface MoveCardDto {
  columnId: string;
  position: number;
}

// Fetch all cards for a column
export function useCards(columnId: string) {
  return useQuery({
    queryKey: ['cards', columnId],
    queryFn: () => api.get<Card[]>(`/cards/column/${columnId}`),
    enabled: !!columnId,
  });
}

// Fetch all cards for a board
export function useCardsByBoard(boardId: string) {
  return useQuery({
    queryKey: ['cards', 'board', boardId],
    queryFn: () => api.get<Card[]>(`/cards/board/${boardId}`),
    enabled: !!boardId,
  });
}

// Fetch a single card by ID
export function useCard(id: string) {
  return useQuery({
    queryKey: ['card', id],
    queryFn: () => api.get<Card>(`/cards/${id}`),
    enabled: !!id,
  });
}

// Create a new card
export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: CreateCardDto }) =>
      api.post<Card>('/cards', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

// Update a card
export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      boardId,
      data,
    }: {
      id: string;
      boardId: string;
      data: UpdateCardDto;
    }) => api.put<Card>(`/cards/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

// Move a card to another column
export function useMoveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      boardId,
      data,
    }: {
      id: string;
      boardId: string;
      data: MoveCardDto;
    }) => api.put<Card>(`/cards/${id}/move`, data),
    onError: (_, variables) => {
      // Refetch to rollback the optimistic update applied in BoardView
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

// Reorder cards within a column
export function useReorderCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      columnId,
      boardId,
      cardIds,
    }: {
      columnId: string;
      boardId: string;
      cardIds: string[];
    }) => api.put<void>(`/cards/column/${columnId}/reorder`, { cardIds }),
    onError: (_, variables) => {
      // Refetch to rollback the optimistic update applied in BoardView
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

// Delete a card
export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, boardId }: { id: string; boardId: string }) =>
      api.delete(`/cards/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}
