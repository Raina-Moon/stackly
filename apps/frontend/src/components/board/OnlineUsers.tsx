'use client';

import { useState } from 'react';
import { usePresence, getUserInitials, getUserColor } from '@/hooks/usePresence';
import type { UserPresence } from '@/lib/socket';
import { getAvatarImageSrc } from '@/lib/avatar';

interface OnlineUsersProps {
  boardId: string;
}

export function OnlineUsers({ boardId }: OnlineUsersProps) {
  const { onlineUsers, isConnected } = usePresence({ boardId, trackCursor: false });
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span>Connecting...</span>
      </div>
    );
  }

  const displayUsers = onlineUsers.slice(0, 5);
  const remainingCount = onlineUsers.length - 5;

  return (
    <div className="flex items-center gap-1">
      {/* Connection status */}
      <div className="flex items-center gap-1 mr-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-gray-500">{onlineUsers.length} online</span>
      </div>

      {/* User avatars */}
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <div
            key={user.id}
            className="relative"
            onMouseEnter={() => setShowTooltip(user.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <UserAvatar user={user} />
            {showTooltip === user.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
                {user.nickname}
                {user.isInVoice && (
                  <span className="ml-1 text-green-400">🎤</span>
                )}
                {user.isDragging && (
                  <span className="ml-1 text-yellow-400">✋</span>
                )}
              </div>
            )}
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}

interface UserAvatarProps {
  user: UserPresence;
  size?: 'sm' | 'md' | 'lg';
}

export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const bgColor = getUserColor(user.id);
  const initials = getUserInitials(user.nickname);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  // Calculate audio-reactive scale (1.0 to 1.3 based on audio level)
  const audioLevel = user.audioLevel || 0;
  const scale = user.isInVoice ? 1 + audioLevel * 0.3 : 1;
  const glowIntensity = audioLevel * 20; // 0 to 20px blur
  const avatarSrc = getAvatarImageSrc(user.avatar, user.nickname);

  return (
    <div className="relative">
      {/* Audio-reactive glow ring */}
      {user.isInVoice && audioLevel > 0.05 && (
        <div
          className="absolute inset-0 rounded-full transition-all duration-75"
          style={{
            backgroundColor: bgColor,
            transform: `scale(${scale + 0.2})`,
            opacity: audioLevel * 0.6,
            filter: `blur(${glowIntensity}px)`,
          }}
        />
      )}

      {/* Main avatar */}
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-white flex items-center justify-center font-medium text-white relative transition-transform duration-75`}
        style={{
          backgroundColor: bgColor,
          transform: `scale(${scale})`,
          boxShadow: user.isInVoice && audioLevel > 0.1
            ? `0 0 ${glowIntensity}px ${bgColor}`
            : 'none',
        }}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={user.nickname}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}

        {/* Voice indicator */}
        {user.isInVoice && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white flex items-center justify-center transition-transform duration-75"
            style={{
              transform: audioLevel > 0.1 ? `scale(${1 + audioLevel * 0.5})` : 'scale(1)',
            }}
          >
            <svg
              className="w-2 h-2 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {/* Dragging indicator */}
        {user.isDragging && !user.isInVoice && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 rounded-full border border-white" />
        )}
      </div>
    </div>
  );
}
