'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { Board, Card as CardType, Column as ColumnType } from '@/hooks/useBoard';
import { useReorderColumns, useDeleteColumn } from '@/hooks/useColumn';
import { useToast } from '@/contexts/ToastContext';
import { useSocket } from '@/contexts/SocketContext';
import { useMoveCard, useReorderCards } from '@/hooks/useCard';
import { useRealtimeBoard } from '@/hooks/useRealtimeBoard';
import { usePresence } from '@/hooks/usePresence';
import { parseDndId, createDndId, arrayMove } from '@/utils/dnd';
import Column from './Column';
import SortableColumn from './SortableColumn';
import DragOverlay from './DragOverlay';
import InviteModal from './InviteModal';
import CreateColumnModal from './CreateColumnModal';
import EditColumnModal from './EditColumnModal';
import CreateCardModal from './CreateCardModal';
import CardDetailModal from './CardDetailModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import BoardSettingsModal from './BoardSettingsModal';
import { OnlineUsers } from './OnlineUsers';
import { VoiceChat } from './VoiceChat';
import { RemoteCursors } from './RemoteCursor';

interface BoardViewProps {
  board: Board;
}

export default function BoardView({ board }: BoardViewProps) {
  const { showToast } = useToast();
  const {
    emitCardMove,
    emitCardUpdate,
    emitCardCreate,
    emitCardDelete,
    emitColumnCreate,
    emitColumnUpdate,
    emitColumnDelete,
    emitColumnReorder,
    emitDragStart,
    emitDragEnd,
  } = useSocket();

  // Real-time sync
  useRealtimeBoard(board.id);
  const { notifyDragStart, notifyDragEnd } = usePresence({ boardId: board.id });

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] = useState(false);
  const [isEditColumnModalOpen, setIsEditColumnModalOpen] = useState(false);
  const [isDeleteColumnModalOpen, setIsDeleteColumnModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<ColumnType | null>(null);
  const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);
  const [selectedColumnIdForCard, setSelectedColumnIdForCard] = useState<string | null>(null);
  const [isCardDetailModalOpen, setIsCardDetailModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);

  const queryClient = useQueryClient();
  const reorderColumns = useReorderColumns();
  const deleteColumn = useDeleteColumn();
  const moveCard = useMoveCard();
  const reorderCards = useReorderCards();

  const sortedColumns = useMemo(
    () => [...(board.columns || [])].sort((a, b) => a.position - b.position),
    [board.columns]
  );
  const cards = useMemo(() => board.cards || [], [board.cards]);

  // Column IDs for SortableContext
  const columnIds = sortedColumns.map((col) => createDndId('column', col.id));

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find card by ID
  const findCard = useCallback(
    (cardId: string) => cards.find((c) => c.id === cardId),
    [cards]
  );

  // Find column by ID
  const findColumn = useCallback(
    (columnId: string) => sortedColumns.find((c) => c.id === columnId),
    [sortedColumns]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { type, id } = parseDndId(event.active.id);

      if (type === 'card') {
        const card = findCard(id);
        if (card) {
          setActiveCard(card);
          notifyDragStart('card', id);
        }
      } else if (type === 'column') {
        const column = findColumn(id);
        if (column) {
          setActiveColumn(column);
          notifyDragStart('column', id);
        }
      }
    },
    [findCard, findColumn, notifyDragStart]
  );

  // Handle drag over (for real-time feedback when moving cards between columns)
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const { type: activeType, id: activeId } = parseDndId(active.id);
      const { type: overType, id: overId } = parseDndId(over.id);

      // Only handle card dragging
      if (activeType !== 'card') return;

      const activeCard = findCard(activeId);
      if (!activeCard) return;

      // Determine target column
      let targetColumnId: string | null = null;

      if (overType === 'column') {
        targetColumnId = overId;
      } else if (overType === 'card') {
        const overCard = findCard(overId);
        if (overCard) {
          targetColumnId = overCard.columnId;
        }
      }

      // If moving to a different column, update local state optimistically
      if (targetColumnId && targetColumnId !== activeCard.columnId) {
        // Check WIP limit
        const targetColumn = findColumn(targetColumnId);
        const targetColumnCards = cards.filter((c) => c.columnId === targetColumnId);

        if (targetColumn?.wipLimit && targetColumnCards.length >= targetColumn.wipLimit) {
          // WIP limit reached, don't allow drop
          return;
        }

        // Optimistic update for visual feedback
        queryClient.setQueryData<Board>(['board', board.id], (old) => {
          if (!old) return old;
          return {
            ...old,
            cards: old.cards?.map((c) =>
              c.id === activeId ? { ...c, columnId: targetColumnId! } : c
            ),
          };
        });
      }
    },
    [findCard, findColumn, cards, board.id, queryClient]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveCard(null);
      setActiveColumn(null);
      notifyDragEnd();

      if (!over) return;

      const { type: activeType, id: activeId } = parseDndId(active.id);
      const { type: overType, id: overId } = parseDndId(over.id);

      // Handle column reordering
      if (activeType === 'column') {
        if (activeId !== overId) {
          const oldIndex = sortedColumns.findIndex((c) => c.id === activeId);
          const newIndex = sortedColumns.findIndex((c) => c.id === overId);

          if (oldIndex !== -1 && newIndex !== -1) {
            const newColumns = arrayMove(sortedColumns, oldIndex, newIndex);

            // Optimistic update
            queryClient.setQueryData<Board>(['board', board.id], (old) => {
              if (!old) return old;
              return {
                ...old,
                columns: newColumns.map((col, index) => ({
                  ...col,
                  position: index,
                })),
              };
            });

            // API call
            reorderColumns.mutate({
              boardId: board.id,
              columnIds: newColumns.map((c) => c.id),
            });

            // Emit socket event
            emitColumnReorder({
              boardId: board.id,
              columnIds: newColumns.map((c) => c.id),
            });
          }
        }
        return;
      }

      // Handle card movement
      if (activeType === 'card') {
        const activeCard = findCard(activeId);
        if (!activeCard) return;

        // Determine target column and position
        let targetColumnId: string;
        let targetPosition: number;

        if (overType === 'column') {
          // Dropping on empty area of a column
          targetColumnId = overId;
          const columnCards = cards.filter((c) => c.columnId === overId);
          targetPosition = columnCards.length; // Add to end
        } else if (overType === 'card') {
          // Dropping on another card
          const overCard = findCard(overId);
          if (!overCard) return;

          targetColumnId = overCard.columnId;
          const columnCards = cards
            .filter((c) => c.columnId === targetColumnId)
            .sort((a, b) => a.position - b.position);

          const overIndex = columnCards.findIndex((c) => c.id === overId);
          targetPosition = overIndex;
        } else {
          return;
        }

        // Check WIP limit
        const targetColumn = findColumn(targetColumnId);
        if (targetColumnId !== activeCard.columnId) {
          const targetColumnCards = cards.filter((c) => c.columnId === targetColumnId);
          if (targetColumn?.wipLimit && targetColumnCards.length >= targetColumn.wipLimit) {
            // Revert optimistic update
            queryClient.invalidateQueries({ queryKey: ['board', board.id] });
            alert('WIP 제한에 도달하여 카드를 이동할 수 없습니다.');
            return;
          }
        }

        // Same column reordering
        if (targetColumnId === activeCard.columnId) {
          const columnCards = cards
            .filter((c) => c.columnId === targetColumnId)
            .sort((a, b) => a.position - b.position);

          const oldIndex = columnCards.findIndex((c) => c.id === activeId);
          const newIndex = columnCards.findIndex((c) => c.id === overId);

          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const newCards = arrayMove(columnCards, oldIndex, newIndex);

            // Optimistic update
            queryClient.setQueryData<Board>(['board', board.id], (old) => {
              if (!old) return old;
              const updatedCards = old.cards?.map((c) => {
                const newIndex = newCards.findIndex((nc) => nc.id === c.id);
                if (newIndex !== -1) {
                  return { ...c, position: newIndex };
                }
                return c;
              });
              return { ...old, cards: updatedCards };
            });

            // API call
            reorderCards.mutate({
              columnId: targetColumnId,
              boardId: board.id,
              cardIds: newCards.map((c) => c.id),
            });
          }
        } else {
          // Moving to different column
          // Optimistic update already done in handleDragOver

          // Update position within new column
          const targetColumnCards = cards
            .filter((c) => c.columnId === targetColumnId && c.id !== activeId)
            .sort((a, b) => a.position - b.position);

          // Insert at position
          const newCardIds = [
            ...targetColumnCards.slice(0, targetPosition).map((c) => c.id),
            activeId,
            ...targetColumnCards.slice(targetPosition).map((c) => c.id),
          ];

          queryClient.setQueryData<Board>(['board', board.id], (old) => {
            if (!old) return old;
            return {
              ...old,
              cards: old.cards?.map((c) => {
                if (c.id === activeId) {
                  return { ...c, columnId: targetColumnId, position: targetPosition };
                }
                const newIndex = newCardIds.indexOf(c.id);
                if (newIndex !== -1 && c.columnId === targetColumnId) {
                  return { ...c, position: newIndex };
                }
                return c;
              }),
            };
          });

          // API call
          moveCard.mutate({
            id: activeId,
            boardId: board.id,
            data: {
              columnId: targetColumnId,
              position: targetPosition,
            },
          });

          // Emit socket event
          emitCardMove({
            boardId: board.id,
            cardId: activeId,
            sourceColumnId: activeCard.columnId,
            targetColumnId,
            position: targetPosition,
          });
        }
      }
    },
    [
      sortedColumns,
      cards,
      board.id,
      findCard,
      findColumn,
      queryClient,
      reorderColumns,
      reorderCards,
      moveCard,
      notifyDragEnd,
      emitCardMove,
      emitColumnReorder,
    ]
  );

  const handleCardClick = (card: CardType) => {
    setSelectedCard(card);
    setIsCardDetailModalOpen(true);
  };

  const handleAddCard = (columnId: string) => {
    setSelectedColumnIdForCard(columnId);
    setIsCreateCardModalOpen(true);
  };

  const handleAddColumn = () => {
    setIsCreateColumnModalOpen(true);
  };

  const handleEditColumn = (column: ColumnType) => {
    setSelectedColumn(column);
    setIsEditColumnModalOpen(true);
  };

  const handleDeleteColumnClick = (column: ColumnType) => {
    setSelectedColumn(column);
    setIsDeleteColumnModalOpen(true);
  };

  const handleDeleteColumn = async () => {
    if (!selectedColumn) return;

    try {
      await deleteColumn.mutateAsync({
        id: selectedColumn.id,
        boardId: board.id,
      });
      showToast('컬럼이 삭제되었습니다', 'success');
      setIsDeleteColumnModalOpen(false);
      setSelectedColumn(null);
    } catch (error: any) {
      showToast(error.message || '컬럼 삭제에 실패했습니다', 'error');
    }
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
          {/* Online users */}
          <OnlineUsers boardId={board.id} />

          {/* Voice chat */}
          <VoiceChat boardId={board.id} />

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-2" />

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
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="보드 설정"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Columns container */}
      <div className="flex-1 overflow-x-auto bg-gray-100">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-6 min-h-full">
            {sortedColumns.length > 0 ? (
              <>
                <SortableContext
                  items={columnIds}
                  strategy={horizontalListSortingStrategy}
                >
                  {sortedColumns.map((column) => (
                    <SortableColumn key={column.id} columnId={column.id}>
                      {({ dragHandleProps }) => (
                        <Column
                          column={column}
                          cards={cards}
                          onCardClick={handleCardClick}
                          onAddCard={() => handleAddCard(column.id)}
                          onEditColumn={() => handleEditColumn(column)}
                          onDeleteColumn={() => handleDeleteColumnClick(column)}
                          dragHandleProps={dragHandleProps}
                        />
                      )}
                    </SortableColumn>
                  ))}
                </SortableContext>

                {/* Add column button */}
                <button
                  onClick={handleAddColumn}
                  className="flex items-center justify-center w-72 min-w-[288px] h-12 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors text-gray-600 font-medium"
                >
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
                <button
                  onClick={handleAddColumn}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  첫 번째 컬럼 만들기
                </button>
              </div>
            )}
          </div>

          {/* Drag overlay */}
          <DragOverlay
            activeCard={activeCard}
            activeColumn={activeColumn}
            cards={cards}
          />
        </DndContext>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        boardId={board.id}
        boardName={board.name}
        inviteCode={board.inviteCode}
      />

      {/* Create Column Modal */}
      <CreateColumnModal
        isOpen={isCreateColumnModalOpen}
        onClose={() => setIsCreateColumnModalOpen(false)}
        boardId={board.id}
        existingColumnsCount={sortedColumns.length}
      />

      {/* Edit Column Modal */}
      {selectedColumn && (
        <EditColumnModal
          isOpen={isEditColumnModalOpen}
          onClose={() => {
            setIsEditColumnModalOpen(false);
            setSelectedColumn(null);
          }}
          column={selectedColumn}
          boardId={board.id}
        />
      )}

      {/* Delete Column Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteColumnModalOpen}
        onClose={() => {
          setIsDeleteColumnModalOpen(false);
          setSelectedColumn(null);
        }}
        onConfirm={handleDeleteColumn}
        title="컬럼 삭제"
        message={`"${selectedColumn?.name}" 컬럼을 삭제하시겠습니까? 컬럼에 포함된 모든 카드도 함께 삭제됩니다.`}
        isLoading={deleteColumn.isPending}
      />

      {/* Create Card Modal */}
      {selectedColumnIdForCard && (
        <CreateCardModal
          isOpen={isCreateCardModalOpen}
          onClose={() => {
            setIsCreateCardModalOpen(false);
            setSelectedColumnIdForCard(null);
          }}
          boardId={board.id}
          columnId={selectedColumnIdForCard}
          existingCardsCount={
            cards.filter((c) => c.columnId === selectedColumnIdForCard).length
          }
        />
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          isOpen={isCardDetailModalOpen}
          onClose={() => {
            setIsCardDetailModalOpen(false);
            setSelectedCard(null);
          }}
          card={selectedCard}
          boardId={board.id}
        />
      )}

      {/* Board Settings Modal */}
      <BoardSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        board={board}
      />

      {/* Remote cursors overlay */}
      <RemoteCursors boardId={board.id} />
    </div>
  );
}
