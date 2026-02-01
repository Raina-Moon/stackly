'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  UserPresence,
  BoardSyncData,
} from '@/lib/socket';
import {
  decodeRealtimeMessage,
  createCursorMove,
  createDragStart,
  createDragEnd,
  createCardMove,
  createAudioLevel,
  encodeRealtimeMessage,
} from '@stackly/proto';

const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionState: ConnectionState;
  currentBoardId: string | null;
  onlineUsers: UserPresence[];
  voiceUsers: string[];
  joinBoard: (boardId: string) => void;
  leaveBoard: (boardId: string) => void;
  emitCursorMove: (boardId: string, x: number, y: number) => void;
  emitDragStart: (boardId: string, itemType: 'card' | 'column', itemId: string) => void;
  emitDragEnd: (boardId: string) => void;
  emitCardMove: (data: {
    boardId: string;
    cardId: string;
    sourceColumnId: string;
    targetColumnId: string;
    position: number;
  }) => void;
  emitCardUpdate: (data: { boardId: string; cardId: string; updates: Record<string, unknown> }) => void;
  emitCardCreate: (data: { boardId: string; card: Record<string, unknown> }) => void;
  emitCardDelete: (data: { boardId: string; cardId: string; columnId: string }) => void;
  emitColumnCreate: (data: { boardId: string; column: Record<string, unknown> }) => void;
  emitColumnUpdate: (data: { boardId: string; columnId: string; updates: Record<string, unknown> }) => void;
  emitColumnDelete: (data: { boardId: string; columnId: string }) => void;
  emitColumnReorder: (data: { boardId: string; columnIds: string[] }) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [voiceUsers, setVoiceUsers] = useState<string[]>([]);
  const [wasConnected, setWasConnected] = useState(false);

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setConnectionState('connecting');
      const sock = connectSocket();
      setSocket(sock);

      sock.on('connect', () => {
        const wasReconnect = wasConnected;
        setIsConnected(true);
        setConnectionState('connected');
        setWasConnected(true);

        // Re-join current board room on reconnection
        if (wasReconnect && currentBoardId) {
          sock.emit('join_board', { boardId: currentBoardId });
        }
      });

      sock.on('disconnect', () => {
        setIsConnected(false);
        setConnectionState('disconnected');
      });

      sock.io.on('reconnect_attempt', () => {
        setConnectionState('reconnecting');
      });

      sock.io.on('reconnect_failed', () => {
        setConnectionState('disconnected');
      });

      // Board sync events
      sock.on('board_sync', (data: BoardSyncData) => {
        setOnlineUsers(data.users);
        setVoiceUsers(data.voiceUsers);
      });

      sock.on('user_joined', (data: { user: UserPresence; boardId: string }) => {
        setOnlineUsers((prev) => {
          if (prev.find((u) => u.id === data.user.id)) return prev;
          return [...prev, data.user];
        });
      });

      sock.on('user_left', (data: { userId: string; boardId: string }) => {
        setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId));
        setVoiceUsers((prev) => prev.filter((id) => id !== data.userId));
      });

      sock.on('cursor_updated', (data: { userId: string; x: number; y: number }) => {
        setOnlineUsers((prev) =>
          prev.map((u) =>
            u.id === data.userId ? { ...u, cursor: { x: data.x, y: data.y } } : u
          )
        );
      });

      sock.on('drag_started', (data: { userId: string; itemType: 'card' | 'column'; itemId: string }) => {
        setOnlineUsers((prev) =>
          prev.map((u) =>
            u.id === data.userId
              ? { ...u, isDragging: true, dragItem: { type: data.itemType, id: data.itemId } }
              : u
          )
        );
      });

      sock.on('drag_ended', (data: { userId: string }) => {
        setOnlineUsers((prev) =>
          prev.map((u) =>
            u.id === data.userId ? { ...u, isDragging: false, dragItem: undefined } : u
          )
        );
      });

      sock.on('voice_user_joined', (data: { userId: string }) => {
        setVoiceUsers((prev) => {
          if (prev.includes(data.userId)) return prev;
          return [...prev, data.userId];
        });
        setOnlineUsers((prev) =>
          prev.map((u) => (u.id === data.userId ? { ...u, isInVoice: true } : u))
        );
      });

      sock.on('voice_user_left', (data: { userId: string }) => {
        setVoiceUsers((prev) => prev.filter((id) => id !== data.userId));
        setOnlineUsers((prev) =>
          prev.map((u) => (u.id === data.userId ? { ...u, isInVoice: false, audioLevel: 0 } : u))
        );
      });

      // Voice audio level for reactive animations
      sock.on('voice_audio_level', (data: { userId: string; level: number }) => {
        setOnlineUsers((prev) =>
          prev.map((u) => (u.id === data.userId ? { ...u, audioLevel: data.level } : u))
        );
      });

      // Binary protobuf listeners (when feature flag is enabled)
      if (USE_PROTOBUF) {
        sock.on('cursor_updated:bin', (data: ArrayBuffer) => {
          const msg = decodeRealtimeMessage(new Uint8Array(data));
          const cursor = msg.cursorUpdate;
          if (!cursor?.userId) return;
          setOnlineUsers((prev) =>
            prev.map((u) =>
              u.id === cursor.userId
                ? { ...u, cursor: { x: cursor.x ?? 0, y: cursor.y ?? 0 } }
                : u
            )
          );
        });

        sock.on('drag_started:bin', (data: ArrayBuffer) => {
          const msg = decodeRealtimeMessage(new Uint8Array(data));
          const drag = msg.dragStarted;
          if (!drag?.userId) return;
          setOnlineUsers((prev) =>
            prev.map((u) =>
              u.id === drag.userId
                ? { ...u, isDragging: true, dragItem: { type: (drag.itemType as 'card' | 'column') ?? 'card', id: drag.itemId ?? '' } }
                : u
            )
          );
        });

        sock.on('drag_ended:bin', (data: ArrayBuffer) => {
          const msg = decodeRealtimeMessage(new Uint8Array(data));
          const drag = msg.dragEnded;
          if (!drag?.userId) return;
          setOnlineUsers((prev) =>
            prev.map((u) =>
              u.id === drag.userId ? { ...u, isDragging: false, dragItem: undefined } : u
            )
          );
        });

        sock.on('audio_level:bin', (data: ArrayBuffer) => {
          const msg = decodeRealtimeMessage(new Uint8Array(data));
          const audio = msg.audioLevelUpdate;
          if (!audio?.userId) return;
          setOnlineUsers((prev) =>
            prev.map((u) =>
              u.id === audio.userId ? { ...u, audioLevel: audio.level ?? 0 } : u
            )
          );
        });
      }

      return () => {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
        setConnectionState('disconnected');
        setWasConnected(false);
      };
    }
  }, [isAuthenticated, user, wasConnected, currentBoardId]);

  const joinBoard = useCallback(
    (boardId: string) => {
      const sock = getSocket();
      if (sock && isConnected) {
        sock.emit('join_board', { boardId });
        setCurrentBoardId(boardId);
      }
    },
    [isConnected]
  );

  const leaveBoard = useCallback(
    (boardId: string) => {
      const sock = getSocket();
      if (sock && isConnected) {
        sock.emit('leave_board', { boardId });
        setCurrentBoardId(null);
        setOnlineUsers([]);
        setVoiceUsers([]);
      }
    },
    [isConnected]
  );

  const emitCursorMove = useCallback(
    (boardId: string, x: number, y: number) => {
      const sock = getSocket();
      if (sock && isConnected) {
        if (USE_PROTOBUF) {
          sock.emit('cursor_move:bin', createCursorMove(boardId, x, y));
        } else {
          sock.emit('cursor_move', { boardId, x, y });
        }
      }
    },
    [isConnected]
  );

  const emitDragStart = useCallback(
    (boardId: string, itemType: 'card' | 'column', itemId: string) => {
      const sock = getSocket();
      if (sock && isConnected) {
        if (USE_PROTOBUF) {
          sock.emit('drag_start:bin', createDragStart(boardId, itemType, itemId));
        } else {
          sock.emit('drag_start', { boardId, itemType, itemId });
        }
      }
    },
    [isConnected]
  );

  const emitDragEnd = useCallback(
    (boardId: string) => {
      const sock = getSocket();
      if (sock && isConnected) {
        if (USE_PROTOBUF) {
          sock.emit('drag_end:bin', createDragEnd(boardId));
        } else {
          sock.emit('drag_end', { boardId });
        }
      }
    },
    [isConnected]
  );

  const emitCardMove = useCallback(
    (data: {
      boardId: string;
      cardId: string;
      sourceColumnId: string;
      targetColumnId: string;
      position: number;
    }) => {
      const sock = getSocket();
      if (sock && isConnected) {
        if (USE_PROTOBUF) {
          sock.emit('card_move:bin', createCardMove(
            data.boardId, data.cardId, data.sourceColumnId, data.targetColumnId, data.position
          ));
        } else {
          sock.emit('card_move', data);
        }
      }
    },
    [isConnected]
  );

  const emitCardUpdate = useCallback(
    (data: { boardId: string; cardId: string; updates: Record<string, unknown> }) => {
      const sock = getSocket();
      if (sock && isConnected) {
        sock.emit('card_update', data);
      }
    },
    [isConnected]
  );

  const emitCardCreate = useCallback(
    (data: { boardId: string; card: Record<string, unknown> }) => {
      const sock = getSocket();
      if (sock && isConnected) {
        sock.emit('card_create', data);
      }
    },
    [isConnected]
  );

  const emitCardDelete = useCallback(
    (data: { boardId: string; cardId: string; columnId: string }) => {
      const sock = getSocket();
      if (sock && isConnected) {
        sock.emit('card_delete', data);
      }
    },
    [isConnected]
  );

  const emitColumnCreate = useCallback(
    (data: { boardId: string; column: Record<string, unknown> }) => {
      const sock = getSocket();
      if (sock && isConnected) {
        sock.emit('column_create', data);
      }
    },
    [isConnected]
  );

  const emitColumnUpdate = useCallback(
    (data: { boardId: string; columnId: string; updates: Record<string, unknown> }) => {
      const sock = getSocket();
      if (sock && isConnected) {
        sock.emit('column_update', data);
      }
    },
    [isConnected]
  );

  const emitColumnDelete = useCallback(
    (data: { boardId: string; columnId: string }) => {
      const sock = getSocket();
      if (sock && isConnected) {
        sock.emit('column_delete', data);
      }
    },
    [isConnected]
  );

  const emitColumnReorder = useCallback(
    (data: { boardId: string; columnIds: string[] }) => {
      const sock = getSocket();
      if (sock && isConnected) {
        if (USE_PROTOBUF) {
          sock.emit('column_reorder:bin', encodeRealtimeMessage({
            columnReorder: { boardId: data.boardId, columnIds: data.columnIds },
          }));
        } else {
          sock.emit('column_reorder', data);
        }
      }
    },
    [isConnected]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionState,
        currentBoardId,
        onlineUsers,
        voiceUsers,
        joinBoard,
        leaveBoard,
        emitCursorMove,
        emitDragStart,
        emitDragEnd,
        emitCardMove,
        emitCardUpdate,
        emitCardCreate,
        emitCardDelete,
        emitColumnCreate,
        emitColumnUpdate,
        emitColumnDelete,
        emitColumnReorder,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
