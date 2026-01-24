'use client';

import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import type { Column as ColumnType, Card as CardType } from '@/hooks/useBoard';
import Card from './Card';

interface DragOverlayProps {
  activeCard: CardType | null;
  activeColumn: ColumnType | null;
  cards: CardType[];
}

export default function DragOverlay({
  activeCard,
  activeColumn,
  cards,
}: DragOverlayProps) {
  return (
    <DndDragOverlay dropAnimation={null}>
      {activeCard && (
        <div className="rotate-3 shadow-xl">
          <Card card={activeCard} />
        </div>
      )}

      {activeColumn && (
        <div className="rotate-2 shadow-xl opacity-90">
          <ColumnOverlay column={activeColumn} cards={cards} />
        </div>
      )}
    </DndDragOverlay>
  );
}

function ColumnOverlay({
  column,
  cards,
}: {
  column: ColumnType;
  cards: CardType[];
}) {
  const columnCards = cards
    .filter((card) => card.columnId === column.id)
    .sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col w-72 min-w-[288px] bg-gray-50 rounded-xl">
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
      </div>

      <div className="flex-1 p-2 space-y-2 min-h-[100px] max-h-[300px] overflow-hidden">
        {columnCards.slice(0, 3).map((card) => (
          <Card key={card.id} card={card} />
        ))}
        {columnCards.length > 3 && (
          <div className="text-center text-xs text-gray-400 py-2">
            +{columnCards.length - 3} more cards
          </div>
        )}
      </div>
    </div>
  );
}
