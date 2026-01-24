'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Column } from './useBoard';

// DTOs
export interface CreateColumnDto {
  name: string;
  color?: string;
  position: number;
  wipLimit?: number;
  boardId: string;
}

export interface UpdateColumnDto {
  name?: string;
  color?: string;
  position?: number;
  wipLimit?: number;
  isCollapsed?: boolean;
}

// Fetch all columns for a board
export function useColumns(boardId: string) {
  return useQuery({
    queryKey: ['columns', boardId],
    queryFn: () => api.get<Column[]>(`/columns/board/${boardId}`),
    enabled: !!boardId,
  });
}

// Fetch a single column by ID
export function useColumn(id: string) {
  return useQuery({
    queryKey: ['column', id],
    queryFn: () => api.get<Column>(`/columns/${id}`),
    enabled: !!id,
  });
}

// Create a new column
export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateColumnDto) => api.post<Column>('/columns', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

// Update a column
export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      boardId,
      data,
    }: {
      id: string;
      boardId: string;
      data: UpdateColumnDto;
    }) => api.put<Column>(`/columns/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

// Reorder columns within a board
export function useReorderColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      columnIds,
    }: {
      boardId: string;
      columnIds: string[];
    }) => api.put<void>(`/columns/board/${boardId}/reorder`, { columnIds }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

// Delete a column
export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, boardId }: { id: string; boardId: string }) =>
      api.delete(`/columns/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}
