'use client';

import BoardCard from '@/components/dashboard/BoardCard';
import type { Board } from '@/hooks/useBoard';

interface BoardsGridViewProps {
  boards: Board[];
  currentUserId?: string;
  onBoardClick: (boardId: string) => void;
  onDeleteClick: (boardId: string) => void;
  onCreateClick: () => void;
}

export default function BoardsGridView({
  boards,
  currentUserId,
  onBoardClick,
  onDeleteClick,
  onCreateClick,
}: BoardsGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {boards.map((board) => (
        <div key={board.id} className="relative group">
          <BoardCard
            id={board.id}
            name={board.name}
            description={board.description}
            color={board.color}
            cardCount={board.cards?.length || 0}
            onClick={() => onBoardClick(board.id)}
          />
          {/* Actions overlay */}
          {board.ownerId === currentUserId && (
            <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(board.id);
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
            {board.ownerId !== currentUserId && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">공유됨</span>
            )}
          </div>
        </div>
      ))}
      {/* New board card */}
      <BoardCard name="" color="" isNew onClick={onCreateClick} />
    </div>
  );
}
