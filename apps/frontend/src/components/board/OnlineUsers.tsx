'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePresence, getUserInitials, getUserColor } from '@/hooks/usePresence';
import type { UserPresence } from '@/lib/socket';
import { getAvatarImageSrc } from '@/lib/avatar';
import type { Board } from '@/hooks/useBoard';

interface OnlineUsersProps {
  boardId: string;
  board?: Board;
}

export function OnlineUsers({ boardId, board }: OnlineUsersProps) {
  const { onlineUsers, isConnected } = usePresence({ boardId, trackCursor: false });
  const [tooltip, setTooltip] = useState<{
    user: UserPresence;
    x: number;
    y: number;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserPresence | null>(null);

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
    <div className="relative z-[110] flex items-center gap-1">
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
            className="relative z-[110]"
            onMouseEnter={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setTooltip({
                user,
                x: rect.left + rect.width / 2,
                y: rect.top - 8,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <button
              type="button"
              onClick={() => setSelectedUser(user)}
              className="group rounded-full transition-transform duration-150 hover:-translate-y-0.5 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label={`${user.nickname} profile`}
            >
              <UserAvatar user={user} />
            </button>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
            +{remainingCount}
          </div>
        )}
      </div>

      <UserInfoModal
        user={selectedUser}
        board={board}
        onClose={() => setSelectedUser(null)}
      />

      {tooltip && typeof window !== 'undefined' && createPortal(
        <div
          className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.user.nickname}
          {tooltip.user.isInVoice && (
            <span className="ml-1 text-green-400">🎤</span>
          )}
          {tooltip.user.isDragging && (
            <span className="ml-1 text-yellow-400">✋</span>
          )}
        </div>,
        document.body
      )}
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

  // Stronger audio-reactive pulse so speaking is clearly visible.
  const audioLevel = user.audioLevel || 0;
  const speakingLevel = user.isInVoice ? Math.max(0, audioLevel - 0.02) : 0;
  const scale = user.isInVoice ? 1 + Math.min(0.4, speakingLevel * 0.55) : 1;
  const glowIntensity = speakingLevel * 28; // 0 to 28px blur
  const avatarSrc = getAvatarImageSrc(user.avatar, user.nickname);

  return (
    <div className="relative">
      {/* Audio-reactive glow ring */}
      {user.isInVoice && speakingLevel > 0.02 && (
        <div
          className="absolute inset-0 rounded-full transition-all duration-50"
          style={{
            backgroundColor: bgColor,
            transform: `scale(${scale + 0.2})`,
            opacity: Math.min(0.8, speakingLevel * 0.9),
            filter: `blur(${glowIntensity}px)`,
          }}
        />
      )}

      {/* Main avatar */}
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-white flex items-center justify-center font-medium text-white relative transition-transform duration-50`}
        style={{
          backgroundColor: bgColor,
          transform: `scale(${scale})`,
          boxShadow: user.isInVoice && speakingLevel > 0.03
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
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white flex items-center justify-center transition-transform duration-50"
            style={{
              transform: speakingLevel > 0.03 ? `scale(${1 + speakingLevel * 0.7})` : 'scale(1)',
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

interface UserInfoModalProps {
  user: UserPresence | null;
  board?: Board;
  onClose: () => void;
}

function UserInfoModal({ user, board, onClose }: UserInfoModalProps) {
  if (!user) return null;

  const avatarSrc = getAvatarImageSrc(user.avatar, user.nickname);
  const initials = getUserInitials(user.nickname);
  const bgColor = getUserColor(user.id);
  const isOwner = board?.ownerId === user.id;
  const member = board?.members?.find((m) => m.userId === user.id);
  const boardRole = isOwner ? 'owner' : member?.role;
  const isManager = boardRole === 'owner' || boardRole === 'admin';

  const roleLabel: Record<string, string> = {
    owner: '소유자',
    admin: '매니저',
    member: '멤버',
    viewer: '뷰어',
  };

  const assignedSchedules = (board?.cards || [])
    .flatMap((card) =>
      (card.schedules || [])
        .filter((schedule) => schedule.userId === user.id)
        .map((schedule) => ({
          id: schedule.id,
          title: schedule.title,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          cardTitle: card.title,
        }))
    )
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close profile modal"
      />

      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 h-8 w-8 rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 overflow-hidden rounded-full border-2 border-white text-white"
            style={{ backgroundColor: bgColor }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.nickname} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold">
                {initials}
              </div>
            )}
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900">{user.nickname}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="mt-5 space-y-2 text-sm text-gray-700">
          <p>
            Status: {user.isInVoice ? 'Voice chat on' : 'Online'}
          </p>
          <p>
            Activity: {user.isDragging ? 'Dragging a card/column' : 'Viewing board'}
          </p>
          <p>
            Board Role: {boardRole ? (roleLabel[boardRole] || boardRole) : '참여 정보 없음'}
          </p>
          <p>
            Manager: {isManager ? 'Yes' : 'No'}
          </p>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">담당 스케줄</h4>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {assignedSchedules.length}개
            </span>
          </div>

          {assignedSchedules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
              이 유저에게 배정된 스케줄이 없습니다.
            </div>
          ) : (
            <div className="max-h-64 overflow-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">스케줄</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">카드</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {assignedSchedules.map((schedule) => {
                    const start = new Date(schedule.startTime);
                    const end = new Date(schedule.endTime);
                    return (
                      <tr key={schedule.id}>
                        <td className="px-3 py-2 text-gray-900">{schedule.title}</td>
                        <td className="px-3 py-2 text-gray-700">{schedule.cardTitle}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
