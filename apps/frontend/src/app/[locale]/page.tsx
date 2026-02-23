'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/MainLayout';
import BoardCard from '@/components/dashboard/BoardCard';
import TodaySchedule from '@/components/dashboard/TodaySchedule';
import LoginModal from '@/components/auth/LoginModal';
import CreateBoardModal from '@/components/board/CreateBoardModal';
import { useAuth } from '@/contexts/AuthContext';
import { useBoards } from '@/hooks/useBoard';

export default function Home() {
  const router = useRouter();
  const t = useTranslations('home');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: boards, isLoading: boardsLoading } = useBoards(isAuthenticated && !authLoading);

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
          {isAuthenticated
            ? t('welcomeUser', { name: user?.nickname ?? '' })
            : t('welcomeGuest')}
        </h1>
        <p className="text-gray-500 mt-1">
          {isAuthenticated
            ? t('subtitleAuthed')
            : t('subtitleGuest')}
        </p>
      </div>

      {!isAuthenticated && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                {t('guestCtaBadge')}
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                {t('guestCtaTitle')}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-gray-600">
                {t('guestCtaDescription')}
              </p>
            </div>

            <button
              onClick={handleCreateBoard}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              {t('guestCtaButton')}
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Boards section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('myBoards')}</h2>
            {displayBoards.length > 0 && (
              <button
                onClick={() => handleProtectedAction('view-all-boards', () => router.push('/boards'))}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('viewAll')}
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
              {t('loginToCreate')}
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
