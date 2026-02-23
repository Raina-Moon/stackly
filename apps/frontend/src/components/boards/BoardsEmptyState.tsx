'use client';

type EmptyStateType = 'loading' | 'unauthenticated' | 'no-results' | 'no-boards';

interface BoardsEmptyStateProps {
  type: EmptyStateType;
  onLoginClick?: () => void;
  onCreateClick?: () => void;
}

export default function BoardsEmptyState({
  type,
  onLoginClick,
  onCreateClick,
}: BoardsEmptyStateProps) {
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
        <p className="mb-4">보드를 보려면 로그인해주세요</p>
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
        <p>다른 검색어나 필터를 사용해보세요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
      <p className="text-lg font-medium mb-2">아직 보드가 없습니다</p>
      <p className="mb-4">새 보드를 만들어 시작해보세요</p>
      <button
        onClick={onCreateClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        첫 보드 만들기
      </button>
    </div>
  );
}
