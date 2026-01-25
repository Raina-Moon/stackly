'use client';

import { usePresence, getUserColor } from '@/hooks/usePresence';
import type { UserPresence } from '@/lib/socket';

interface RemoteCursorsProps {
  boardId: string;
}

export function RemoteCursors({ boardId }: RemoteCursorsProps) {
  const { otherUsers } = usePresence({ boardId, trackCursor: true });

  // Only show users that have cursor positions
  const usersWithCursors = otherUsers.filter((u) => u.cursor);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {usersWithCursors.map((user) => (
        <RemoteCursor key={user.id} user={user} />
      ))}
    </div>
  );
}

interface RemoteCursorProps {
  user: UserPresence;
}

function RemoteCursor({ user }: RemoteCursorProps) {
  if (!user.cursor) return null;

  const color = getUserColor(user.id);

  return (
    <div
      className="absolute transition-all duration-75 ease-out"
      style={{
        left: user.cursor.x,
        top: user.cursor.y,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* User name label */}
      <div
        className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {user.nickname}
        {user.isDragging && (
          <span className="ml-1 opacity-75">
            (dragging {user.dragItem?.type})
          </span>
        )}
      </div>
    </div>
  );
}

// Smaller version for inline display
interface CursorIndicatorProps {
  user: UserPresence;
}

export function CursorIndicator({ user }: CursorIndicatorProps) {
  const color = getUserColor(user.id);

  return (
    <div className="inline-flex items-center gap-1">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-600">{user.nickname}</span>
    </div>
  );
}
