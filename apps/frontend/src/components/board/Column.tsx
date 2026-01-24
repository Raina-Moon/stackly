'use client';

import { Column as ColumnType, Card as CardType } from '@/hooks/useBoard';
import Card from './Card';

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  onCardClick?: (card: CardType) => void;
  onAddCard?: () => void;
}

export default function Column({ column, cards, onCardClick, onAddCard }: ColumnProps) {
  const columnCards = cards
    .filter((card) => card.columnId === column.id)
    .sort((a, b) => a.position - b.position);

  const isAtWipLimit = column.wipLimit && columnCards.length >= column.wipLimit;

  return (
    <div className="flex flex-col w-72 min-w-[288px] bg-gray-50 rounded-xl">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {column.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
          )}
          <h3 className="font-semibold text-gray-900 text-sm">{column.name}</h3>
          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
            {columnCards.length}
            {column.wipLimit && `/${column.wipLimit}`}
          </span>
        </div>

        <button
          onClick={onAddCard}
          disabled={!!isAtWipLimit}
          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
            isAtWipLimit ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={isAtWipLimit ? 'WIP 제한에 도달했습니다' : '카드 추가'}
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Cards container */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-200px)]">
        {columnCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onClick={() => onCardClick?.(card)}
          />
        ))}

        {columnCards.length === 0 && (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            카드가 없습니다
          </div>
        )}
      </div>

      {/* WIP limit warning */}
      {isAtWipLimit && (
        <div className="px-3 py-2 bg-yellow-50 border-t border-yellow-100 text-xs text-yellow-700">
          WIP 제한에 도달했습니다
        </div>
      )}
    </div>
  );
}
