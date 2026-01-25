'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import BoardCard from '@/components/dashboard/BoardCard';
import CreateBoardModal from '@/components/board/CreateBoardModal';
import LoginModal from '@/components/auth/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { useBoards, useDeleteBoard, Board } from '@/hooks/useBoard';
import { useToast } from '@/contexts/ToastContext';

type SortOption = 'name' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';
type FilterOption = 'all' | 'owned' | 'shared' | 'archived' | 'templates';
type ViewMode = 'grid' | 'list';

export default function BoardsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: boards, isLoading: boardsLoading } = useBoards();
  const deleteBoard = useDeleteBoard();
  const { showToast } = useToast();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter and sort boards
  const filteredBoards = useMemo(() => {
    if (!boards) return [];

    let result = [...boards];

    // Apply filter
    switch (filter) {
      case 'owned':
        result = result.filter((board) => board.ownerId === user?.id);
        break;
      case 'shared':
        result = result.filter((board) => board.ownerId !== user?.id);
        break;
      case 'archived':
        result = result.filter((board) => board.isArchived);
        break;
      case 'templates':
        result = result.filter((board) => board.isTemplate);
        break;
      default:
        result = result.filter((board) => !board.isArchived);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (board) =>
          board.name.toLowerCase().includes(query) ||
          board.description?.toLowerCase().includes(query)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [boards, filter, searchQuery, sortBy, sortDirection, user?.id]);

  const handleBoardClick = (boardId: string) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    router.push(`/board/${boardId}`);
  };

  const handleCreateBoard = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await deleteBoard.mutateAsync(boardId);
      showToast('보드가 삭제되었습니다', 'success');
      setDeleteConfirmId(null);
    } catch (error: any) {
      showToast(error.message || '보드 삭제에 실패했습니다', 'error');
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
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

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">내 보드</h1>
        <p className="text-gray-500 mt-1">
          모든 보드를 관리하고 새 보드를 만들어보세요
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="보드 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="all">모든 보드</option>
          <option value="owned">내가 만든 보드</option>
          <option value="shared">공유된 보드</option>
          <option value="archived">보관된 보드</option>
          <option value="templates">템플릿</option>
        </select>

        {/* Sort */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="updatedAt">최근 수정</option>
            <option value="createdAt">생성일</option>
            <option value="name">이름</option>
          </select>
          <button
            onClick={toggleSortDirection}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={sortDirection === 'asc' ? '오름차순' : '내림차순'}
          >
            {sortDirection === 'asc' ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            )}
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="그리드 보기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="리스트 보기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateBoard}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 보드
        </button>
      </div>

      {/* Stats */}
      {boards && boards.length > 0 && (
        <div className="flex gap-4 mb-6 text-sm text-gray-500">
          <span>전체 {boards.length}개</span>
          {filter !== 'all' && <span>필터 결과 {filteredBoards.length}개</span>}
        </div>
      )}

      {/* Board List */}
      {boardsLoading && isAuthenticated ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : !isAuthenticated ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-lg font-medium mb-2">로그인이 필요합니다</p>
          <p className="mb-4">보드를 보려면 로그인해주세요</p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            로그인
          </button>
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          {searchQuery || filter !== 'all' ? (
            <>
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium mb-2">검색 결과가 없습니다</p>
              <p>다른 검색어나 필터를 사용해보세요</p>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <p className="text-lg font-medium mb-2">아직 보드가 없습니다</p>
              <p className="mb-4">새 보드를 만들어 시작해보세요</p>
              <button
                onClick={handleCreateBoard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                첫 보드 만들기
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBoards.map((board) => (
            <div key={board.id} className="relative group">
              <BoardCard
                id={board.id}
                name={board.name}
                description={board.description}
                color={board.color}
                cardCount={board.cards?.length || 0}
                onClick={() => handleBoardClick(board.id)}
              />
              {/* Actions overlay */}
              {board.ownerId === user?.id && (
                <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(board.id);
                    }}
                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                    title="삭제"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-1">
                {board.isArchived && (
                  <span className="px-2 py-0.5 bg-gray-600 text-white text-xs rounded-full">보관됨</span>
                )}
                {board.isTemplate && (
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">템플릿</span>
                )}
                {board.ownerId !== user?.id && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">공유됨</span>
                )}
              </div>
            </div>
          ))}
          {/* New board card */}
          <BoardCard name="" color="" isNew onClick={handleCreateBoard} />
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">보드</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden md:table-cell">카드</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden lg:table-cell">생성일</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 hidden lg:table-cell">수정일</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBoards.map((board) => (
                <tr
                  key={board.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleBoardClick(board.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: board.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{board.name}</span>
                          {board.isArchived && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">보관됨</span>
                          )}
                          {board.isTemplate && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">템플릿</span>
                          )}
                          {board.ownerId !== user?.id && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">공유됨</span>
                          )}
                        </div>
                        {board.description && (
                          <p className="text-sm text-gray-500 truncate max-w-md">{board.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {board.cards?.length || 0}개
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm hidden lg:table-cell">
                    {new Date(board.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm hidden lg:table-cell">
                    {new Date(board.updatedAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {board.ownerId === user?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(board.id);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">보드 삭제</h3>
            <p className="text-gray-500 mb-6">
              이 보드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 카드와 컬럼이 함께 삭제됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteBoard(deleteConfirmId)}
                disabled={deleteBoard.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {deleteBoard.isPending ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

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
