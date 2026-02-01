'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ContactUser {
  id: string;
  email: string;
  nickname: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
  isFriend: boolean;
  isCollaborator: boolean;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    email: string;
    nickname: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface SearchUser {
  id: string;
  email: string;
  nickname: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
}

// Get all contacts (friends + collaborators combined)
export function useContacts() {
  return useQuery({
    queryKey: ['contacts', 'all'],
    queryFn: () => api.get<ContactUser[]>('/friends/all'),
  });
}

// Get only friends
export function useFriends() {
  return useQuery({
    queryKey: ['contacts', 'friends'],
    queryFn: () => api.get<ContactUser[]>('/friends'),
  });
}

// Get only collaborators
export function useCollaborators() {
  return useQuery({
    queryKey: ['contacts', 'collaborators'],
    queryFn: () => api.get<ContactUser[]>('/friends/collaborators'),
  });
}

// Get incoming friend requests
export function useIncomingRequests() {
  return useQuery({
    queryKey: ['friend-requests', 'incoming'],
    queryFn: () => api.get<FriendRequest[]>('/friends/requests/incoming'),
  });
}

// Send a friend request
export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addresseeId: string) =>
      api.post<{ message: string; request: FriendRequest }>('/friends/request', { addresseeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

// Accept a friend request
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      api.put<{ message: string; request: FriendRequest }>(`/friends/request/${requestId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

// Reject a friend request
export function useRejectFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      api.put<{ message: string; request: FriendRequest }>(`/friends/request/${requestId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

// Remove a friend
export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<{ message: string }>(`/friends/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

// Search users by nickname or email
export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ['user-search', query],
    queryFn: () => api.get<SearchUser[]>(`/users/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}
