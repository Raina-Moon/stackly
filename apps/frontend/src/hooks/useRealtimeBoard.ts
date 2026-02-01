import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket, ConnectionState } from '@/contexts/SocketContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { getSocket } from '@/lib/socket';
import type {
  CardMovedEvent,
  CardUpdatedEvent,
  CardCreatedEvent,
  CardDeletedEvent,
  ColumnCreatedEvent,
  ColumnUpdatedEvent,
  ColumnDeletedEvent,
  ColumnsReorderedEvent,
} from '@/lib/socket';
import type { Board, Card, Column } from '@/hooks/useBoard';
import { decodeRealtimeMessage } from '@stackly/proto';

const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

export function useRealtimeBoard(boardId: string | undefined) {
  const queryClient = useQueryClient();
  const { joinBoard, leaveBoard, isConnected, connectionState, onlineUsers } = useSocket();
  const { showToast } = useToast();
  const { user } = useAuth();
  const prevConnectionState = useRef<ConnectionState>(connectionState);

  // Helper to get user nickname from online users
  const getUserNickname = useCallback((userId: string): string => {
    const foundUser = onlineUsers.find((u) => u.id === userId);
    return foundUser?.nickname || 'Someone';
  }, [onlineUsers]);

  // Join/leave board room
  useEffect(() => {
    if (boardId && isConnected) {
      joinBoard(boardId);
      return () => {
        leaveBoard(boardId);
      };
    }
  }, [boardId, isConnected, joinBoard, leaveBoard]);

  // Handle reconnection - invalidate queries to refetch data
  useEffect(() => {
    const wasReconnecting = prevConnectionState.current === 'reconnecting';
    const isNowConnected = connectionState === 'connected';

    if (wasReconnecting && isNowConnected && boardId) {
      // Invalidate board query to refetch fresh data after reconnection
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    }

    prevConnectionState.current = connectionState;
  }, [connectionState, boardId, queryClient]);

  // Handle realtime events
  useEffect(() => {
    if (!boardId || !isConnected) return;

    const socket = getSocket();
    if (!socket) return;

    // Card moved by another user
    const handleCardMoved = (event: CardMovedEvent) => {
      if (event.boardId !== boardId) return;
      if (event.userId === user?.id) return; // Ignore own events

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old;

        const cards = [...(old.cards || [])];
        const cardIndex = cards.findIndex((c) => c.id === event.cardId);
        if (cardIndex === -1) return old;

        const card = { ...cards[cardIndex] };
        card.columnId = event.targetColumnId;
        card.position = event.position;
        cards[cardIndex] = card;

        return { ...old, cards };
      });
    };

    // Card updated by another user
    const handleCardUpdated = (event: CardUpdatedEvent) => {
      if (event.boardId !== boardId) return;
      if (event.userId === user?.id) return; // Ignore own events

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old;

        const cards = (old.cards || []).map((c) =>
          c.id === event.cardId ? { ...c, ...event.updates } : c
        );

        return { ...old, cards };
      });

      const nickname = getUserNickname(event.userId);
      showToast(`${nickname} updated a card`, 'info');
    };

    // Card created by another user
    const handleCardCreated = (event: CardCreatedEvent) => {
      if (event.boardId !== boardId) return;
      if (event.userId === user?.id) return; // Ignore own events

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old;

        const newCard = event.card as unknown as Card;
        const cards = [...(old.cards || []), newCard];
        return { ...old, cards };
      });

      const nickname = getUserNickname(event.userId);
      showToast(`${nickname} created a new card`, 'info');
    };

    // Card deleted by another user
    const handleCardDeleted = (event: CardDeletedEvent) => {
      if (event.boardId !== boardId) return;
      if (event.userId === user?.id) return; // Ignore own events

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old;

        const cards = (old.cards || []).filter((c) => c.id !== event.cardId);
        return { ...old, cards };
      });

      const nickname = getUserNickname(event.userId);
      showToast(`${nickname} deleted a card`, 'info');
    };

    // Column created by another user
    const handleColumnCreated = (event: ColumnCreatedEvent) => {
      if (event.boardId !== boardId) return;
      if (event.userId === user?.id) return; // Ignore own events

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old;

        const newColumn = event.column as unknown as Column;
        const columns = [...(old.columns || []), newColumn];
        return { ...old, columns };
      });

      const nickname = getUserNickname(event.userId);
      showToast(`${nickname} created a new column`, 'info');
    };

    // Column updated by another user
    const handleColumnUpdated = (event: ColumnUpdatedEvent) => {
      if (event.boardId !== boardId) return;
      if (event.userId === user?.id) return; // Ignore own events

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old;

        const columns = (old.columns || []).map((c) =>
          c.id === event.columnId ? { ...c, ...event.updates } : c
        );

        return { ...old, columns };
      });

      const nickname = getUserNickname(event.userId);
      showToast(`${nickname} updated a column`, 'info');
    };

    // Column deleted by another user
    const handleColumnDeleted = (event: ColumnDeletedEvent) => {
      if (event.boardId !== boardId) return;
      if (event.userId === user?.id) return; // Ignore own events

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old;

        const columns = (old.columns || []).filter((c) => c.id !== event.columnId);
        const cards = (old.cards || []).filter((c) => c.columnId !== event.columnId);

        return { ...old, columns, cards };
      });

      const nickname = getUserNickname(event.userId);
      showToast(`${nickname} deleted a column`, 'info');
    };

    // Columns reordered by another user
    const handleColumnsReordered = (event: ColumnsReorderedEvent) => {
      if (event.boardId !== boardId) return;
      if (event.userId === user?.id) return; // Ignore own events

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old;

        const columns = event.columnIds
          .map((id, index) => {
            const col = (old.columns || []).find((c) => c.id === id);
            return col ? { ...col, position: index } : null;
          })
          .filter(Boolean) as Column[];

        return { ...old, columns };
      });
    };

    socket.on('card_moved', handleCardMoved);
    socket.on('card_updated', handleCardUpdated);
    socket.on('card_created', handleCardCreated);
    socket.on('card_deleted', handleCardDeleted);
    socket.on('column_created', handleColumnCreated);
    socket.on('column_updated', handleColumnUpdated);
    socket.on('column_deleted', handleColumnDeleted);
    socket.on('columns_reordered', handleColumnsReordered);

    // Binary protobuf listeners
    const handleCardMovedBin = (data: ArrayBuffer) => {
      const msg = decodeRealtimeMessage(new Uint8Array(data));
      const card = msg.cardMoved;
      if (!card?.boardId || !card.cardId) return;
      handleCardMoved({
        boardId: card.boardId,
        cardId: card.cardId,
        sourceColumnId: card.sourceColumnId ?? '',
        targetColumnId: card.targetColumnId ?? '',
        position: card.position ?? 0,
        userId: card.userId ?? '',
      });
    };

    const handleColumnsReorderedBin = (data: ArrayBuffer) => {
      const msg = decodeRealtimeMessage(new Uint8Array(data));
      const reorder = msg.columnsReordered;
      if (!reorder?.boardId) return;
      handleColumnsReordered({
        boardId: reorder.boardId,
        columnIds: reorder.columnIds ?? [],
        userId: reorder.userId ?? '',
      });
    };

    if (USE_PROTOBUF) {
      socket.on('card_moved:bin', handleCardMovedBin);
      socket.on('columns_reordered:bin', handleColumnsReorderedBin);
    }

    return () => {
      socket.off('card_moved', handleCardMoved);
      socket.off('card_updated', handleCardUpdated);
      socket.off('card_created', handleCardCreated);
      socket.off('card_deleted', handleCardDeleted);
      socket.off('column_created', handleColumnCreated);
      socket.off('column_updated', handleColumnUpdated);
      socket.off('column_deleted', handleColumnDeleted);
      socket.off('columns_reordered', handleColumnsReordered);
      if (USE_PROTOBUF) {
        socket.off('card_moved:bin', handleCardMovedBin);
        socket.off('columns_reordered:bin', handleColumnsReorderedBin);
      }
    };
  }, [boardId, isConnected, queryClient, user?.id, getUserNickname, showToast]);
}
