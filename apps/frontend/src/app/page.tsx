'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import BoardCard from '@/components/dashboard/BoardCard';
import TodaySchedule from '@/components/dashboard/TodaySchedule';
import LoginModal from '@/components/auth/LoginModal';
import { useAuth } from '@/contexts/AuthContext';

// 데모 보드 데이터
const demoBoards = [
  {
    id: '1',
    name: '프로젝트 A',
    description: '메인 프로젝트 관리 보드',
    color: '#3B82F6',
    cardCount: 12,
  },
  {
    id: '2',
    name: '마케팅 캠페인',
    description: '2024 마케팅 계획',
    color: '#10B981',
    cardCount: 8,
  },
  {
    id: '3',
    name: '버그 트래커',
    description: '버그 및 이슈 관리',
    color: '#EF4444',
    cardCount: 5,
  },
];

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleProtectedAction = (action: string) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    // 로그인된 경우 실제 동작 수행
    console.log('Performing action:', action);
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

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
            <button
              onClick={() => handleProtectedAction('view-all-boards')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              전체 보기
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {demoBoards.map((board) => (
              <BoardCard
                key={board.id}
                {...board}
                onClick={() => handleProtectedAction(`open-board-${board.id}`)}
              />
            ))}
            <BoardCard
              name=""
              color=""
              isNew
              onClick={() => handleProtectedAction('create-board')}
            />
          </div>
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
    </MainLayout>
  );
}
