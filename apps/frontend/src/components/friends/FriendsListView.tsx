'use client';

import type { ContactUser } from '@/hooks/useFriends';
import FriendCard from './FriendCard';

interface FriendsListViewProps {
  contacts: ContactUser[];
  onInviteToBoard: (userId: string) => void;
  onAddFriend: (userId: string) => void;
  onRemoveFriend: (userId: string) => void;
}

export default function FriendsListView({
  contacts,
  onInviteToBoard,
  onAddFriend,
  onRemoveFriend,
}: FriendsListViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contacts.map((contact) => (
        <FriendCard
          key={contact.id}
          contact={contact}
          onInviteToBoard={onInviteToBoard}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
      ))}
    </div>
  );
}
