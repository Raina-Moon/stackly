'use client';

import type { Board } from '@/hooks/useBoard';

interface BoardsListViewProps {
  boards: Board[];
  currentUserId?: string;
  onBoardClick: (boardId: string) => void;
  onDeleteClick: (boardId: string) => void;
}

export default function BoardsListView({
  boards,
  currentUserId,
  onBoardClick,
  onDeleteClick,
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
          {boards.map((board) => (
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
                {board.ownerId === currentUserId && (
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
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
