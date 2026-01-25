'use client';

import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useSocket } from '@/contexts/SocketContext';
import { getUserColor, getUserInitials } from '@/hooks/usePresence';

interface VoiceChatProps {
  boardId: string;
}

export function VoiceChat({ boardId }: VoiceChatProps) {
  const {
    isInVoice,
    isMuted,
    isLoading,
    error,
    voiceParticipants,
    joinVoice,
    leaveVoice,
    toggleMute,
    clearError,
  } = useVoiceChat({ boardId });

  const { onlineUsers } = useSocket();

  // Get user info for voice participants
  const voiceUsersInfo = voiceParticipants
    .map((id) => onlineUsers.find((u) => u.id === id))
    .filter(Boolean);

  if (!isInVoice) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={joinVoice}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <MicrophoneIcon className="w-4 h-4" />
              <span>Join Voice</span>
            </>
          )}
        </button>
        {error && (
          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded max-w-[200px]">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="truncate" title={error}>{error}</span>
            <button
              onClick={clearError}
              className="ml-1 hover:text-red-800"
              title="Dismiss"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
      {/* Voice participants */}
      <div className="flex -space-x-1">
        {voiceUsersInfo.slice(0, 3).map((user) => (
          <div
            key={user!.id}
            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: getUserColor(user!.id) }}
            title={user!.nickname}
          >
            {getUserInitials(user!.nickname)}
          </div>
        ))}
        {voiceUsersInfo.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
            +{voiceUsersInfo.length - 3}
          </div>
        )}
      </div>

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className={`p-1.5 rounded-full transition-colors ${
          isMuted
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-green-100 text-green-600 hover:bg-green-200'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <MicrophoneOffIcon className="w-4 h-4" />
        ) : (
          <MicrophoneIcon className="w-4 h-4" />
        )}
      </button>

      {/* Leave voice */}
      <button
        onClick={leaveVoice}
        className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
        title="Leave Voice"
      >
        <PhoneOffIcon className="w-4 h-4" />
      </button>

      {/* Voice indicator */}
      <div className="flex items-center gap-1 text-xs text-green-700">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        <span>{voiceParticipants.length + 1} in voice</span>
      </div>
    </div>
  );
}

// Icons
function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );
}

function MicrophoneOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
      />
    </svg>
  );
}

function PhoneOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
      />
    </svg>
  );
}
