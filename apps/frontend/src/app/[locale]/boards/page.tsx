'use client';

import { useState, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import MainLayout from '@/components/layout/MainLayout';
import CreateBoardModal from '@/components/board/CreateBoardModal';
import LoginModal from '@/components/auth/LoginModal';
import {
  BoardsToolbar,
  BoardsEmptyState,
  BoardsGridView,
  BoardsListView,
  DeleteBoardModal,
  EditBoardModal,
  type SortOption,
  type SortDirection,
  type FilterOption,
  type ViewMode,
} from '@/components/boards';
import { useAuth } from '@/contexts/AuthContext';
import { useBoards, useDeleteBoard, useUpdateBoard, useFavoriteBoard, useGetFavorites, type Board } from '@/hooks/useBoard';
import { useToast } from '@/contexts/ToastContext';

function getInviteUrl(inviteCode: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/invite/${inviteCode}`;
  }
  return `/invite/${inviteCode}`;
}

export default function BoardsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: boards, isLoading: boardsLoading } = useBoards();
  const { data: favoritesData } = useGetFavorites();
  const deleteBoard = useDeleteBoard();
  const updateBoard = useUpdateBoard();
  const favoriteBoard = useFavoriteBoard();
  const { showToast } = useToast();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editBoard, setEditBoard] = useState<Board | null>(null);

  // Create a Set of favorite IDs for quick lookup
  const favoriteIds = useMemo(() => {
    return new Set(favoritesData?.favoriteIds || []);
  }, [favoritesData?.favoriteIds]);

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
      case 'favorites':
        result = result.filter((board) => favoriteIds.has(board.id));
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
      // Always sort favorites to top in non-favorites filter
      if (filter !== 'favorites') {
        const aFav = favoriteIds.has(a.id);
        const bFav = favoriteIds.has(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
      }

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
  }, [boards, filter, searchQuery, sortBy, sortDirection, user?.id, favoriteIds]);

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

  const handleDeleteBoard = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteBoard.mutateAsync(deleteConfirmId);
      showToast('보드가 삭제되었습니다', 'success');
      setDeleteConfirmId(null);
    } catch (error: any) {
      showToast(error.message || '보드 삭제에 실패했습니다', 'error');
    }
  };

  const handleArchiveBoard = async (boardId: string, archive: boolean) => {
    try {
      await updateBoard.mutateAsync({
        id: boardId,
        data: { isArchived: archive },
      });
      showToast(archive ? '보드가 보관되었습니다' : '보드가 보관 해제되었습니다', 'success');
    } catch (error: any) {
      showToast(error.message || '보드 상태 변경에 실패했습니다', 'error');
    }
  };

  const handleCopyLink = async (inviteCode: string) => {
    try {
      const url = getInviteUrl(inviteCode);
      await navigator.clipboard.writeText(url);
      showToast('초대 링크가 복사되었습니다', 'success');
    } catch (error) {
      showToast('링크 복사에 실패했습니다', 'error');
    }
  };

  const handleFavoriteBoard = async (boardId: string) => {
    try {
      await favoriteBoard.mutateAsync(boardId);
    } catch (error: any) {
      showToast(error.message || '즐겨찾기 변경에 실패했습니다', 'error');
    }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <MainLayout>
        <BoardsEmptyState type="loading" />
      </MainLayout>
    );
  }

  // Determine which empty state to show
  const getEmptyStateType = () => {
    if (boardsLoading && isAuthenticated) return 'loading';
    if (!isAuthenticated) return 'unauthenticated';
    if (filteredBoards.length === 0) {
      return searchQuery || filter !== 'all' ? 'no-results' : 'no-boards';
    }
    return null;
  };

  const emptyStateType = getEmptyStateType();

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
      <BoardsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDirection={sortDirection}
        onSortDirectionToggle={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateClick={handleCreateBoard}
      />

      {/* Stats */}
      {boards && boards.length > 0 && !emptyStateType && (
        <div className="flex gap-4 mb-6 text-sm text-gray-500">
          <span>전체 {boards.length}개</span>
          {filter !== 'all' && <span>필터 결과 {filteredBoards.length}개</span>}
        </div>
      )}

      {/* Content */}
      {emptyStateType ? (
        <BoardsEmptyState
          type={emptyStateType}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onCreateClick={handleCreateBoard}
        />
      ) : viewMode === 'grid' ? (
        <BoardsGridView
          boards={filteredBoards}
          currentUserId={user?.id}
          showArchived={filter === 'archived'}
          onBoardClick={handleBoardClick}
          onDeleteClick={setDeleteConfirmId}
          onEditClick={setEditBoard}
          onArchiveClick={handleArchiveBoard}
          onCopyLinkClick={handleCopyLink}
          onFavoriteClick={handleFavoriteBoard}
          onCreateClick={handleCreateBoard}
          favoriteIds={favoriteIds}
        />
      ) : (
        <BoardsListView
          boards={filteredBoards}
          currentUserId={user?.id}
          showArchived={filter === 'archived'}
          onBoardClick={handleBoardClick}
          onDeleteClick={setDeleteConfirmId}
          onEditClick={setEditBoard}
          onArchiveClick={handleArchiveBoard}
          onCopyLinkClick={handleCopyLink}
          onFavoriteClick={handleFavoriteBoard}
          favoriteIds={favoriteIds}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteBoardModal
        isOpen={!!deleteConfirmId}
        isDeleting={deleteBoard.isPending}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteBoard}
      />

      {/* Edit Board Modal */}
      <EditBoardModal
        isOpen={!!editBoard}
        board={editBoard}
        onClose={() => setEditBoard(null)}
      />

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
