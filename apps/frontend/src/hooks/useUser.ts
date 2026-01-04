import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  nickname: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

// 현재 사용자 정보 조회
export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.get<User>('/users/me'),
    enabled: isAuthenticated,
  });
}

// 프로필 업데이트
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: (data: UpdateProfileData) =>
      api.patch<{ success: boolean; user: User }>('/users/me', data),
    onSuccess: (response) => {
      if (response.success) {
        // React Query 캐시 업데이트
        queryClient.setQueryData(['user', 'me'], response.user);
        // AuthContext 업데이트
        updateUser(response.user);
      }
    },
  });
}

// 비밀번호 변경
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post<{ success: boolean; message: string }>('/users/me/change-password', data),
  });
}
