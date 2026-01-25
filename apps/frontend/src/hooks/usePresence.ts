import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import type { UserPresence } from '@/lib/socket';

interface UsePresenceOptions {
  boardId: string | undefined;
  trackCursor?: boolean;
  throttleMs?: number;
}

export function usePresence({ boardId, trackCursor = true, throttleMs = 50 }: UsePresenceOptions) {
  const { onlineUsers, voiceUsers, emitCursorMove, emitDragStart, emitDragEnd, isConnected } = useSocket();
  const { user } = useAuth();
  const lastEmitRef = useRef<number>(0);

  // Filter out current user from online users
  const otherUsers = onlineUsers.filter((u) => u.id !== user?.id);

  // Track cursor movement
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!boardId || !isConnected || !trackCursor) return;

      const now = Date.now();
      if (now - lastEmitRef.current < throttleMs) return;
      lastEmitRef.current = now;

      emitCursorMove(boardId, event.clientX, event.clientY);
    },
    [boardId, isConnected, trackCursor, throttleMs, emitCursorMove]
  );

  // Set up cursor tracking
  useEffect(() => {
    if (!trackCursor) return;

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove, trackCursor]);

  // Notify drag start
  const notifyDragStart = useCallback(
    (itemType: 'card' | 'column', itemId: string) => {
      if (!boardId || !isConnected) return;
      emitDragStart(boardId, itemType, itemId);
    },
    [boardId, isConnected, emitDragStart]
  );

  // Notify drag end
  const notifyDragEnd = useCallback(() => {
    if (!boardId || !isConnected) return;
    emitDragEnd(boardId);
  }, [boardId, isConnected, emitDragEnd]);

  return {
    onlineUsers,
    otherUsers,
    voiceUsers,
    isConnected,
    notifyDragStart,
    notifyDragEnd,
  };
}

// Helper to get user initials
export function getUserInitials(nickname: string): string {
  return nickname
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper to generate a consistent color for a user
export function getUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
