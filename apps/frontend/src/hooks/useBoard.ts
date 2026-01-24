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
  };
}

export interface CreateBoardDto {
  name: string;
  description?: string;
  color?: string;
  isTemplate?: boolean;
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
export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get<Board[]>('/boards'),
  });
}

// Fetch a single board by ID
export function useBoard(id: string) {
  return useQuery({
    queryKey: ['board', id],
    queryFn: () => api.get<Board>(`/boards/${id}`),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBoardDto> }) =>
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
