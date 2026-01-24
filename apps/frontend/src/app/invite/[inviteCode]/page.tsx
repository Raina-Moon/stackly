'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useBoardByInviteCode, useJoinBoard } from '@/hooks/useBoard';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.inviteCode as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { data: boardInfo, isLoading: boardLoading, error } = useBoardByInviteCode(inviteCode);
  const joinBoard = useJoinBoard();
  const [isJoining, setIsJoining] = useState(false);
  const hasJoinedRef = useRef(false);

  const handleJoin = useCallback(async () => {
    if (hasJoinedRef.current || joinBoard.isPending) return;
    hasJoinedRef.current = true;

    setIsJoining(true);
    try {
      const result = await joinBoard.mutateAsync(inviteCode);
      showToast('보드에 참여했습니다', 'success');
      router.push(`/board/${result.boardId}`);
    } catch (error: any) {
      if (error.message?.includes('이미')) {
        // Already a member, redirect to board
        showToast('이미 이 보드의 멤버입니다', 'info');
        router.push(`/board/${boardInfo?.id}`);
      } else {
        showToast(error.message || '보드 참여에 실패했습니다', 'error');
        setIsJoining(false);
        hasJoinedRef.current = false; // Reset on error to allow retry
      }
    }
  }, [inviteCode, joinBoard, showToast, router, boardInfo?.id]);

  // Auto-join when authenticated
  useEffect(() => {
    if (isAuthenticated && boardInfo && !joinBoard.isPending) {
      handleJoin();
    }
  }, [isAuthenticated, boardInfo, handleJoin, joinBoard.isPending]);

  const handleLogin = () => {
    // Store invite code to process after login
    sessionStorage.setItem('pendingInvite', inviteCode);
    router.push('/login');
  };

  const handleRegister = () => {
    sessionStorage.setItem('pendingInvite', inviteCode);
    router.push('/register');
  };

  if (authLoading || boardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-gray-600">초대 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !boardInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            유효하지 않은 초대 링크
          </h1>
          <p className="text-gray-500 mb-8">
            이 초대 링크는 만료되었거나 유효하지 않습니다. 보드 관리자에게 새로운 초대 링크를 요청하세요.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  // If authenticated and joining
  if (isAuthenticated && (isJoining || joinBoard.isPending)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-gray-600">보드에 참여하는 중...</p>
        </div>
      </div>
    );
  }

  // Show invite page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        {/* Board color header */}
        <div className="h-3" style={{ backgroundColor: boardInfo.color }} />

        <div className="p-8">
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>

          {/* Board info */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              보드에 초대되었습니다
            </h1>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-800">
                {boardInfo.name}
              </p>
              {boardInfo.description && (
                <p className="text-gray-500 text-sm">
                  {boardInfo.description}
                </p>
              )}
              <p className="text-sm text-gray-400">
                {boardInfo.owner.nickname}님이 초대했습니다
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              로그인하여 참여하기
            </button>
            <button
              onClick={handleRegister}
              className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              회원가입하기
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            로그인 또는 회원가입 후 자동으로 보드에 참여합니다
          </p>
        </div>
      </div>
    </div>
  );
}
