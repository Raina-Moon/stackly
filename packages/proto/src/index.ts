// Re-export generated protobuf types
export * from './generated/messages.js';

// Helper functions for encoding/decoding
import { stackly } from './generated/messages.js';

export const RealtimeMessage = stackly.RealtimeMessage;
export const CursorMove = stackly.CursorMove;
export const CursorUpdate = stackly.CursorUpdate;
export const DragStart = stackly.DragStart;
export const DragEnd = stackly.DragEnd;
export const DragStarted = stackly.DragStarted;
export const DragEnded = stackly.DragEnded;
export const CardMove = stackly.CardMove;
export const CardMoved = stackly.CardMoved;
export const CardUpdate = stackly.CardUpdate;
export const CardUpdated = stackly.CardUpdated;
export const ColumnReorder = stackly.ColumnReorder;
export const ColumnsReordered = stackly.ColumnsReordered;
export const AudioLevel = stackly.AudioLevel;
export const AudioLevelUpdate = stackly.AudioLevelUpdate;

// Type aliases for convenience
export type IRealtimeMessage = stackly.IRealtimeMessage;
export type ICursorMove = stackly.ICursorMove;
export type ICursorUpdate = stackly.ICursorUpdate;
export type IDragStart = stackly.IDragStart;
export type IDragEnd = stackly.IDragEnd;
export type ICardMove = stackly.ICardMove;
export type ICardMoved = stackly.ICardMoved;
export type IAudioLevel = stackly.IAudioLevel;

// Utility: Encode message to Uint8Array
export function encodeRealtimeMessage(message: stackly.IRealtimeMessage): Uint8Array {
  return stackly.RealtimeMessage.encode(
    stackly.RealtimeMessage.create(message)
  ).finish();
}

// Utility: Decode Uint8Array to message
export function decodeRealtimeMessage(buffer: Uint8Array): stackly.RealtimeMessage {
  return stackly.RealtimeMessage.decode(buffer);
}

// Utility: Create cursor move message
export function createCursorMove(boardId: string, x: number, y: number): Uint8Array {
  return encodeRealtimeMessage({
    cursorMove: {
      boardId,
      x,
      y,
      timestamp: Date.now(),
    },
  });
}

// Utility: Create drag start message
export function createDragStart(
  boardId: string,
  itemType: string,
  itemId: string
): Uint8Array {
  return encodeRealtimeMessage({
    dragStart: { boardId, itemType, itemId },
  });
}

// Utility: Create drag end message
export function createDragEnd(boardId: string): Uint8Array {
  return encodeRealtimeMessage({
    dragEnd: { boardId },
  });
}

// Utility: Create card move message
export function createCardMove(
  boardId: string,
  cardId: string,
  sourceColumnId: string,
  targetColumnId: string,
  position: number
): Uint8Array {
  return encodeRealtimeMessage({
    cardMove: { boardId, cardId, sourceColumnId, targetColumnId, position },
  });
}

// Utility: Create audio level message
export function createAudioLevel(boardId: string, level: number): Uint8Array {
  return encodeRealtimeMessage({
    audioLevel: { boardId, level },
  });
}
