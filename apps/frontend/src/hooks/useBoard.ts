'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, publicApi } from '@/lib/api';

export interface Board {
  id: string;
  name: string;
  description?: string;
  color: string;
  isTemplate: boolean;
  isArchived: boolean;
  isPrivate: boolean;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  columns?: Column[];
  cards?: Card[];
  members?: BoardMember[];
  owner?: {
    id: string;
    nickname: string;
    email: string;
    avatar?: string;
  };
}

export interface Column {
  id: string;
  name: string;
  color: string;
  position: number;
  wipLimit?: number;
  isCollapsed: boolean;
  boardId: string;
  cards?: Card[];
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  color?: string;
  tags: string[];
  estimatedHours?: number;
  dueDate?: string;
  completedAt?: string;
  boardId: string;
  columnId: string;
  assigneeId?: string;
  assigneeIds?: string[];
  assignee?: {
    id: string;
    nickname: string;
    email: string;
    avatar?: string;
  } | null;
  schedules?: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    userId: string;
    cardId?: string | null;
  }>;
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  canEdit: boolean;
  canComment: boolean;
  joinedAt: string;
  user?: {
    id: string;
    nickname: string;
    email: string;
    avatar?: string;
  };
}

export interface CreateBoardDto {
  name: string;
  description?: string;
  color?: string;
  isTemplate?: boolean;
}

export interface UpdateBoardDto {
  name?: string;
  description?: string;
  color?: string;
  isTemplate?: boolean;
  isArchived?: boolean;
}

export interface BoardInviteInfo {
  id: string;
  name: string;
  description?: string;
  color: string;
  owner: {
    nickname: string;
  };
}

// Fetch all boards for the current user
export function useBoards(enabled = true) {
  return useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get<Board[]>('/boards'),
    enabled,
  });
}

// Fetch a single board by ID
export function useBoard(id: string) {
  return useQuery({
    queryKey: ['board', id],
    queryFn: async () => {
      const data = await api.get<Board>(`/boards/${id}`);
      console.log('[useBoard] fetched cards:', data.cards?.map(c => `${c.id.slice(0,8)}→col:${c.columnId.slice(0,8)}`));
      return data;
    },
    enabled: !!id,
  });
}

// Fetch board info by invite code (public)
export function useBoardByInviteCode(inviteCode: string) {
  return useQuery({
    queryKey: ['board-invite', inviteCode],
    queryFn: () => publicApi.get<BoardInviteInfo>(`/boards/invite/${inviteCode}`),
    enabled: !!inviteCode,
  });
}

// Create a new board
export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBoardDto) => api.post<Board>('/boards', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

// Update a board
export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBoardDto }) =>
      api.put<Board>(`/boards/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.id] });
    },
  });
}

// Delete a board
export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/boards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

// Join a board via invite code
export function useJoinBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) =>
      api.post<{ message: string; boardId: string }>(`/boards/join/${inviteCode}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

// Regenerate invite code
export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) =>
      api.post<{ inviteCode: string }>(`/boards/${boardId}/regenerate-invite`),
    onSuccess: (_, boardId) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

// Get invite code for a board
export function useGetInviteCode(boardId: string) {
  return useQuery({
    queryKey: ['board-invite-code', boardId],
    queryFn: () => api.get<{ inviteCode: string }>(`/boards/${boardId}/invite-code`),
    enabled: !!boardId,
  });
}

// Remove a member from a board
export function useRemoveBoardMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, userId }: { boardId: string; userId: string }) =>
      api.delete(`/boards/${boardId}/members/${userId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

// Toggle favorite status for a board
export function useFavoriteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) =>
      api.post<{ isFavorite: boolean }>(`/boards/${boardId}/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board-favorites'] });
    },
  });
}

// Get favorite board IDs
export function useGetFavorites(enabled = true) {
  return useQuery({
    queryKey: ['board-favorites'],
    queryFn: () => api.get<{ favoriteIds: string[] }>('/boards/user/favorites'),
    enabled,
  });
}
