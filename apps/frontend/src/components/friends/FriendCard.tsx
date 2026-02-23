'use client';

import type { ContactUser } from '@/hooks/useFriends';
import { getAvatarImageSrc } from '@/lib/avatar';

interface FriendCardProps {
  contact: ContactUser;
  onInviteToBoard: (userId: string) => void;
  onAddFriend: (userId: string) => void;
  onRemoveFriend: (userId: string) => void;
}

export default function FriendCard({
  contact,
  onInviteToBoard,
  onAddFriend,
  onRemoveFriend,
}: FriendCardProps) {
  const getInitials = (firstName: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  const getDisplayName = (contact: ContactUser) => {
    if (contact.lastName) {
      return `${contact.firstName} ${contact.lastName}`;
    }
    return contact.firstName || contact.nickname;
  };

  const avatarSrc = getAvatarImageSrc(contact.avatar, contact.nickname);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={contact.nickname}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
              {getInitials(contact.firstName, contact.lastName)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900 truncate">
              {getDisplayName(contact)}
            </h3>
            {contact.isFriend && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                친구
              </span>
            )}
            {contact.isCollaborator && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                협업자
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">@{contact.nickname}</p>
          <p className="text-sm text-gray-400 truncate">{contact.email}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Invite to board */}
          <button
            onClick={() => onInviteToBoard(contact.id)}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
            title="보드에 초대"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {/* Add/Remove friend */}
          {contact.isFriend ? (
            <button
              onClick={() => onRemoveFriend(contact.id)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
              title="친구 삭제"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => onAddFriend(contact.id)}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
              title="친구 추가"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
