'use client';

import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Column as ColumnType, Card as CardType } from '@/hooks/useBoard';
import { createDndId } from '@/utils/dnd';
import Card from './Card';
import SortableCard from './SortableCard';
import type { DragHandleProps } from './SortableColumn';

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  onCardClick?: (card: CardType) => void;
  onAddCard?: () => void;
  onEditColumn?: () => void;
  onDeleteColumn?: () => void;
  dragHandleProps?: DragHandleProps;
}

export default function Column({
  column,
  cards,
  onCardClick,
  onAddCard,
  onEditColumn,
  onDeleteColumn,
  dragHandleProps,
}: ColumnProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const columnCards = cards
    .filter((card) => card.columnId === column.id)
    .sort((a, b) => a.position - b.position);

  const isAtWipLimit = column.wipLimit && columnCards.length >= column.wipLimit;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Droppable for cards
  const { setNodeRef, isOver } = useDroppable({
    id: createDndId('column', column.id),
    data: {
      type: 'column',
      column,
    },
  });

  // Card IDs for SortableContext
  const cardIds = columnCards.map((card) => createDndId('card', card.id));

  return (
    <div className="flex flex-col w-72 min-w-[288px] bg-gray-50 rounded-xl">
      {/* Column header */}
      <div
        ref={dragHandleProps?.ref as React.Ref<HTMLDivElement>}
        {...(dragHandleProps?.attributes || {})}
        {...(dragHandleProps?.listeners || {})}
        className="flex items-center justify-between px-3 py-2 border-b border-gray-200 cursor-grab"
      >
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

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddCard?.();
            }}
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

          {/* Column menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              title="컬럼 메뉴"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border py-1 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onEditColumn?.();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  수정
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onDeleteColumn?.();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-200px)] transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {columnCards.map((card) => (
            <SortableCard key={card.id} cardId={card.id}>
              <Card card={card} onClick={() => onCardClick?.(card)} />
            </SortableCard>
          ))}
        </SortableContext>

        {columnCards.length === 0 && (
          <div
            className={`flex items-center justify-center h-24 text-sm transition-colors ${
              isOver ? 'text-blue-500 bg-blue-100 rounded-lg' : 'text-gray-400'
            }`}
          >
            {isOver ? '여기에 놓으세요' : '카드가 없습니다'}
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
