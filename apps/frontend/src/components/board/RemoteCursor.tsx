'use client';

import { useState, useEffect, useRef } from 'react';
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
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
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
  const [isIdle, setIsIdle] = useState(false);
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const lastUpdateRef = useRef<number>(Date.now());
  const animationRef = useRef<number>();

  const color = getUserColor(user.id);

  // Smooth cursor movement with spring-like animation
  useEffect(() => {
    if (!user.cursor) return;

    const targetX = user.cursor.x;
    const targetY = user.cursor.y;

    // Reset idle timer
    lastUpdateRef.current = Date.now();
    setIsIdle(false);

    // Animate to new position
    const animate = () => {
      setSmoothPosition((prev) => {
        const dx = targetX - prev.x;
        const dy = targetY - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If close enough, snap to target
        if (distance < 1) {
          return { x: targetX, y: targetY };
        }

        // Spring-like interpolation (faster than linear)
        const factor = 0.35;
        return {
          x: prev.x + dx * factor,
          y: prev.y + dy * factor,
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // We only want to re-run when x or y coordinates change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.cursor?.x, user.cursor?.y]);

  // Idle detection - fade out after 3 seconds of no movement
  useEffect(() => {
    const checkIdle = setInterval(() => {
      if (Date.now() - lastUpdateRef.current > 3000) {
        setIsIdle(true);
      }
    }, 1000);

    return () => clearInterval(checkIdle);
    // Only run once on mount - intentionally no dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize position on mount only
  useEffect(() => {
    if (user.cursor) {
      setSmoothPosition({ x: user.cursor.x, y: user.cursor.y });
    }
    // Only run once on mount to set initial position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user.cursor) return null;

  return (
    <div
      className="absolute will-change-transform"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${smoothPosition.x}px, ${smoothPosition.y}px)`,
        opacity: isIdle ? 0.4 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Cursor arrow - Figma-style */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="drop-shadow-md"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      >
        <path
          d="M4 4L16 10L10 11.5L8 17L4 4Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* User name label - Figma-style pill */}
      <div
        className="absolute left-3 top-4 px-2 py-1 rounded-full text-[11px] font-semibold text-white whitespace-nowrap shadow-lg"
        style={{
          backgroundColor: color,
          boxShadow: `0 2px 8px ${color}40`,
        }}
      >
        {user.nickname}
        {user.isDragging && user.dragItem && (
          <span className="ml-1.5 opacity-80 font-normal">
            moving {user.dragItem.type}
          </span>
        )}
      </div>

      {/* Active indicator pulse when not idle */}
      {!isIdle && (
        <div
          className="absolute -left-1 -top-1 w-3 h-3 rounded-full animate-ping opacity-40"
          style={{ backgroundColor: color }}
        />
      )}
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
