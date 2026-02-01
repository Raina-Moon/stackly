'use client';

import type { Board } from '@/hooks/useBoard';

interface BoardsListViewProps {
  boards: Board[];
  currentUserId?: string;
  showArchived?: boolean;
  onBoardClick: (boardId: string) => void;
  onDeleteClick: (boardId: string) => void;
  onEditClick: (board: Board) => void;
  onArchiveClick: (boardId: string, archive: boolean) => void;
  onCopyLinkClick: (inviteCode: string) => void;
  onFavoriteClick: (boardId: string) => void;
  favoriteIds?: Set<string>;
}

export default function BoardsListView({
  boards,
  currentUserId,
  showArchived = false,
  onBoardClick,
  onDeleteClick,
  onEditClick,
  onArchiveClick,
  onCopyLinkClick,
  onFavoriteClick,
  favoriteIds = new Set(),
}: BoardsListViewProps) {
  return (
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
          {boards.map((board) => {
            const isOwner = board.ownerId === currentUserId;
            const isFavorite = favoriteIds.has(board.id);

            return (
              <tr
                key={board.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onBoardClick(board.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: board.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        {isFavorite && (
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        )}
                        <span className="font-medium text-gray-900">{board.name}</span>
                        {board.isArchived && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">보관됨</span>
                        )}
                        {board.isTemplate && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">템플릿</span>
                        )}
                        {board.ownerId !== currentUserId && (
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
                  <div className="flex justify-end gap-1">
                    {/* Favorite button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFavoriteClick(board.id);
                      }}
                      className="p-1.5 hover:bg-yellow-50 rounded-lg transition-colors"
                      title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                    >
                      {isFavorite ? (
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      )}
                    </button>

                    {/* Copy link button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyLinkClick(board.inviteCode);
                      }}
                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                      title="초대 링크 복사"
                    >
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>

                    {isOwner && (
                      <>
                        {/* Edit button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(board);
                          }}
                          className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Archive/Unarchive button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchiveClick(board.id, !board.isArchived);
                          }}
                          className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                          title={board.isArchived ? '보관 해제' : '보관'}
                        >
                          {board.isArchived ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4l2 2 4-4" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          )}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(board.id);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
