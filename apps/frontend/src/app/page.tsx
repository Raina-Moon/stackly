'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import BoardCard from '@/components/dashboard/BoardCard';
import TodaySchedule from '@/components/dashboard/TodaySchedule';
import LoginModal from '@/components/auth/LoginModal';
import CreateBoardModal from '@/components/board/CreateBoardModal';
import { useAuth } from '@/contexts/AuthContext';
import { useBoards } from '@/hooks/useBoard';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: boards, isLoading: boardsLoading } = useBoards();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleProtectedAction = (action: string, callback?: () => void) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    callback?.();
  };

  const handleBoardClick = (boardId: string) => {
    handleProtectedAction(`open-board-${boardId}`, () => {
      router.push(`/board/${boardId}`);
    });
  };

  const handleCreateBoard = () => {
    handleProtectedAction('create-board', () => {
      setIsCreateModalOpen(true);
    });
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  const displayBoards = boards || [];

  return (
    <MainLayout>
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAuthenticated ? `안녕하세요, ${user?.nickname}님!` : '환영합니다!'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isAuthenticated
            ? '오늘도 생산적인 하루 되세요'
            : '로그인하여 보드를 관리하세요'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Boards section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">내 보드</h2>
            {displayBoards.length > 0 && (
              <button
                onClick={() => handleProtectedAction('view-all-boards', () => router.push('/boards'))}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                전체 보기
              </button>
            )}
          </div>

          {boardsLoading && isAuthenticated ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayBoards.map((board) => (
                <BoardCard
                  key={board.id}
                  id={board.id}
                  name={board.name}
                  description={board.description}
                  color={board.color}
                  cardCount={board.cards?.length || 0}
                  onClick={() => handleBoardClick(board.id)}
                />
              ))}
              <BoardCard
                name=""
                color=""
                isNew
                onClick={handleCreateBoard}
              />
            </div>
          )}

          {!isAuthenticated && (
            <p className="text-center text-gray-500 mt-4">
              로그인하면 보드를 만들고 관리할 수 있습니다
            </p>
          )}
        </div>

        {/* Schedule section */}
        <div className="lg:col-span-1">
          <TodaySchedule
            onItemClick={(id) => handleProtectedAction(`open-schedule-${id}`)}
          />
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          router.refresh();
        }}
      />

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </MainLayout>
  );
}
