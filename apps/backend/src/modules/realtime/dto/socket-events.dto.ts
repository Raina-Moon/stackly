// Socket event DTOs for real-time collaboration

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
}

// Room management
export interface JoinBoardDto {
  boardId: string;
}

export interface LeaveBoardDto {
  boardId: string;
}

// Card events
export interface CardMoveDto {
  cardId: string;
  sourceColumnId: string;
  targetColumnId: string;
  position: number;
}

export interface CardUpdateDto {
  cardId: string;
  boardId: string;
  updates: Record<string, any>;
}

export interface CardCreateDto {
  card: {
    id: string;
    title: string;
    columnId: string;
    position: number;
    [key: string]: any;
  };
  boardId: string;
}

export interface CardDeleteDto {
  cardId: string;
  boardId: string;
  columnId: string;
}

// Column events
export interface ColumnCreateDto {
  column: {
    id: string;
    name: string;
    boardId: string;
    position: number;
    [key: string]: any;
  };
  boardId: string;
}

export interface ColumnUpdateDto {
  columnId: string;
  boardId: string;
  updates: Record<string, any>;
}

export interface ColumnDeleteDto {
  columnId: string;
  boardId: string;
}

export interface ColumnReorderDto {
  boardId: string;
  columnIds: string[];
}

export interface CardReorderDto {
  boardId: string;
  columnId: string;
  cardIds: string[];
}

// Presence events
export interface CursorMoveDto {
  boardId: string;
  x: number;
  y: number;
}

export interface DragStartDto {
  boardId: string;
  itemType: 'card' | 'column';
  itemId: string;
}

export interface DragEndDto {
  boardId: string;
}

// Voice chat events
export interface VoiceJoinDto {
  boardId: string;
}

export interface VoiceLeaveDto {
  boardId: string;
}

export interface VoiceOfferDto {
  boardId: string;
  targetUserId: string;
  offer: RTCSessionDescriptionInit;
}

export interface VoiceAnswerDto {
  boardId: string;
  targetUserId: string;
  answer: RTCSessionDescriptionInit;
}

export interface VoiceIceCandidateDto {
  boardId: string;
  targetUserId: string;
  candidate: RTCIceCandidateInit;
}

// Server -> Client events
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

export interface BoardSyncDto {
  users: UserPresence[];
  voiceUsers: string[]; // user IDs in voice chat
}

export interface UserJoinedDto {
  user: UserPresence;
  boardId: string;
}

export interface UserLeftDto {
  userId: string;
  boardId: string;
}

export interface CursorUpdatedDto {
  userId: string;
  boardId: string;
  x: number;
  y: number;
}

export interface VoiceUserJoinedDto {
  userId: string;
  nickname: string;
  boardId: string;
}

export interface VoiceUserLeftDto {
  userId: string;
  boardId: string;
}
