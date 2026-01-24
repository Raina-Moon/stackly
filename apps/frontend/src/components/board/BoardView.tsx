'use client';

import { useState } from 'react';
import { Board, Card as CardType } from '@/hooks/useBoard';
import Column from './Column';
import InviteModal from './InviteModal';

interface BoardViewProps {
  board: Board;
}

export default function BoardView({ board }: BoardViewProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const sortedColumns = [...(board.columns || [])].sort((a, b) => a.position - b.position);
  const cards = board.cards || [];

  const handleCardClick = (card: CardType) => {
    // TODO: Open card detail modal
    console.log('Card clicked:', card);
  };

  const handleAddCard = (columnId: string) => {
    // TODO: Open create card modal
    console.log('Add card to column:', columnId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: board.color }}
          />
          <h1 className="text-xl font-bold text-gray-900">{board.name}</h1>
          {board.description && (
            <span className="text-gray-500 text-sm hidden sm:inline">
              - {board.description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Members count */}
          <div className="flex items-center gap-1 text-sm text-gray-500 mr-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{board.members?.length || 1}명</span>
          </div>

          {/* Invite button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            초대
          </button>

          {/* Settings button */}
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Columns container */}
      <div className="flex-1 overflow-x-auto bg-gray-100">
        <div className="flex gap-4 p-6 min-h-full">
          {sortedColumns.length > 0 ? (
            <>
              {sortedColumns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  cards={cards}
                  onCardClick={handleCardClick}
                  onAddCard={() => handleAddCard(column.id)}
                />
              ))}

              {/* Add column button */}
              <button className="flex items-center justify-center w-72 min-w-[288px] h-12 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors text-gray-600 font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                컬럼 추가
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center w-full py-12 text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <p className="text-lg font-medium mb-2">아직 컬럼이 없습니다</p>
              <p className="text-sm mb-4">컬럼을 추가하여 카드를 정리하세요</p>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                첫 번째 컬럼 만들기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        boardId={board.id}
        boardName={board.name}
        inviteCode={board.inviteCode}
      />
    </div>
  );
}
