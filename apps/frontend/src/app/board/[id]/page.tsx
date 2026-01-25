'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBoard } from '@/hooks/useBoard';
import BoardView from '@/components/board/BoardView';
import BoardSkeleton from '@/components/board/BoardSkeleton';

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: board, isLoading: boardLoading, error } = useBoard(boardId);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/board/${boardId}`);
    }
  }, [authLoading, isAuthenticated, boardId, router]);

  if (authLoading || boardLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Top navigation skeleton */}
        <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-12 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
        </nav>

        {/* Board skeleton */}
        <div className="flex-1 overflow-hidden">
          <BoardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">보드에 접근할 수 없습니다</h2>
          <p className="text-gray-500 mb-6">
            이 보드에 대한 접근 권한이 없거나 보드가 존재하지 않습니다.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top navigation */}
      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">뒤로</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {board.owner?.nickname}님의 보드
          </span>
        </div>
      </nav>

      {/* Board content */}
      <div className="flex-1 overflow-hidden">
        <BoardView board={board} />
      </div>
    </div>
  );
}
