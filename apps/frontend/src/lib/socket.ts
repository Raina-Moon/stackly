import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const token = getAccessToken();

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function updateSocketAuth(): void {
  if (socket) {
    const token = getAccessToken();
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect().connect();
    }
  }
}

// Socket event types
export interface UserPresence {
  id: string;
  nickname: string;
  email: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  isDragging?: boolean;
  dragItem?: { type: 'card' | 'column'; id: string };
  isInVoice?: boolean;
}

export interface BoardSyncData {
  users: UserPresence[];
  voiceUsers: string[];
}

export interface CardMovedEvent {
  cardId: string;
  sourceColumnId: string;
  targetColumnId: string;
  position: number;
  userId: string;
  boardId: string;
}

export interface CardUpdatedEvent {
  cardId: string;
  boardId: string;
  updates: Record<string, unknown>;
  userId: string;
}

export interface CardCreatedEvent {
  card: {
    id: string;
    title: string;
    columnId: string;
    position: number;
    [key: string]: unknown;
  };
  boardId: string;
  userId: string;
}

export interface CardDeletedEvent {
  cardId: string;
  boardId: string;
  columnId: string;
  userId: string;
}

export interface ColumnCreatedEvent {
  column: {
    id: string;
    name: string;
    boardId: string;
    position: number;
    [key: string]: unknown;
  };
  boardId: string;
  userId: string;
}

export interface ColumnUpdatedEvent {
  columnId: string;
  boardId: string;
  updates: Record<string, unknown>;
  userId: string;
}

export interface ColumnDeletedEvent {
  columnId: string;
  boardId: string;
  userId: string;
}

export interface ColumnsReorderedEvent {
  boardId: string;
  columnIds: string[];
  userId: string;
}

export interface CursorUpdatedEvent {
  userId: string;
  boardId: string;
  x: number;
  y: number;
}

export interface DragStartedEvent {
  userId: string;
  boardId: string;
  itemType: 'card' | 'column';
  itemId: string;
}

export interface DragEndedEvent {
  userId: string;
  boardId: string;
}

export interface VoiceUserEvent {
  userId: string;
  nickname?: string;
  boardId: string;
}

export interface VoiceOfferEvent {
  fromUserId: string;
  offer: RTCSessionDescriptionInit;
  boardId: string;
}

export interface VoiceAnswerEvent {
  fromUserId: string;
  answer: RTCSessionDescriptionInit;
  boardId: string;
}

export interface VoiceIceCandidateEvent {
  fromUserId: string;
  candidate: RTCIceCandidateInit;
  boardId: string;
}
