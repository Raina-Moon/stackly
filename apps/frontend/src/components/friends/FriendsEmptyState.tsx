'use client';

type EmptyStateType = 'loading' | 'unauthenticated' | 'no-results' | 'no-contacts';

interface FriendsEmptyStateProps {
  type: EmptyStateType;
  onLoginClick?: () => void;
  onAddFriendClick?: () => void;
}

export default function FriendsEmptyState({
  type,
  onLoginClick,
  onAddFriendClick,
}: FriendsEmptyStateProps) {
  if (type === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (type === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="mb-4">연락처를 보려면 로그인해주세요</p>
        <button
          onClick={onLoginClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          로그인
        </button>
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-lg font-medium mb-2">검색 결과가 없습니다</p>
        <p>다른 검색어를 사용해보세요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p className="text-lg font-medium mb-2">아직 연락처가 없습니다</p>
      <p className="mb-4">친구를 추가하거나 보드를 공유해보세요</p>
      <button
        onClick={onAddFriendClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        첫 친구 추가하기
      </button>
    </div>
  );
}
