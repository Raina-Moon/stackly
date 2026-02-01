'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import LoginModal from '@/components/auth/LoginModal';
import {
  FriendsToolbar,
  FriendsEmptyState,
  FriendsListView,
  AddFriendModal,
  FriendRequestsModal,
  type FilterOption,
} from '@/components/friends';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  useContacts,
  useFriends,
  useCollaborators,
  useIncomingRequests,
  useSendFriendRequest,
  useRemoveFriend,
  type ContactUser,
} from '@/hooks/useFriends';
import { useBoards } from '@/hooks/useBoard';

function getInviteUrl(inviteCode: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/invite/${inviteCode}`;
  }
  return `/invite/${inviteCode}`;
}

export default function FriendsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Data hooks - fetch based on current filter
  const { data: allContacts, isLoading: contactsLoading } = useContacts();
  const { data: friends } = useFriends();
  const { data: collaborators } = useCollaborators();
  const { data: incomingRequests } = useIncomingRequests();
  const { data: boards } = useBoards();

  // Mutations
  const sendFriendRequest = useSendFriendRequest();
  const removeFriend = useRemoveFriend();

  // UI State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [inviteSelectUserId, setInviteSelectUserId] = useState<string | null>(null);

  // Get the appropriate data based on filter
  const contacts = useMemo(() => {
    switch (filter) {
      case 'friends':
        return friends || [];
      case 'collaborators':
        return collaborators || [];
      default:
        return allContacts || [];
    }
  }, [filter, allContacts, friends, collaborators]);

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.nickname.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.firstName.toLowerCase().includes(query) ||
        contact.lastName?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleAddFriendClick = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsAddFriendModalOpen(true);
  };

  const handleInviteToBoard = (userId: string) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!boards || boards.length === 0) {
      showToast('보드가 없습니다. 먼저 보드를 만들어주세요.', 'error');
      return;
    }

    setInviteSelectUserId(userId);
  };

  const handleSelectBoardForInvite = async (boardId: string) => {
    const board = boards?.find((b) => b.id === boardId);
    if (!board) return;

    try {
      const url = getInviteUrl(board.inviteCode);
      await navigator.clipboard.writeText(url);
      showToast('초대 링크가 복사되었습니다. 친구에게 공유해주세요!', 'success');
    } catch (error) {
      showToast('링크 복사에 실패했습니다', 'error');
    }
    setInviteSelectUserId(null);
  };

  const handleAddFriend = async (userId: string) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      await sendFriendRequest.mutateAsync(userId);
      showToast('친구 요청을 보냈습니다.', 'success');
    } catch (error: any) {
      showToast(error?.message || '친구 요청에 실패했습니다.', 'error');
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      await removeFriend.mutateAsync(userId);
      showToast('친구가 삭제되었습니다.', 'success');
    } catch (error: any) {
      showToast(error?.message || '친구 삭제에 실패했습니다.', 'error');
    }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <MainLayout>
        <FriendsEmptyState type="loading" />
      </MainLayout>
    );
  }

  // Determine which empty state to show
  const getEmptyStateType = () => {
    if (contactsLoading && isAuthenticated) return 'loading';
    if (!isAuthenticated) return 'unauthenticated';
    if (filteredContacts.length === 0) {
      return searchQuery || filter !== 'all' ? 'no-results' : 'no-contacts';
    }
    return null;
  };

  const emptyStateType = getEmptyStateType();
  const pendingRequestsCount = incomingRequests?.length || 0;

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">친구</h1>
        <p className="text-gray-500 mt-1">
          친구와 협업자를 관리하고 보드에 초대해보세요
        </p>
      </div>

      {/* Toolbar */}
      <FriendsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        onAddFriendClick={handleAddFriendClick}
        pendingRequestsCount={pendingRequestsCount}
        onRequestsClick={() => setIsRequestsModalOpen(true)}
      />

      {/* Stats */}
      {contacts.length > 0 && !emptyStateType && (
        <div className="flex gap-4 mb-6 text-sm text-gray-500">
          <span>전체 {allContacts?.length || 0}명</span>
          <span>친구 {friends?.length || 0}명</span>
          <span>협업자 {collaborators?.length || 0}명</span>
        </div>
      )}

      {/* Content */}
      {emptyStateType ? (
        <FriendsEmptyState
          type={emptyStateType}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onAddFriendClick={handleAddFriendClick}
        />
      ) : (
        <FriendsListView
          contacts={filteredContacts}
          onInviteToBoard={handleInviteToBoard}
          onAddFriend={handleAddFriend}
          onRemoveFriend={handleRemoveFriend}
        />
      )}

      {/* Board Selection Modal for Invite */}
      {inviteSelectUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">초대할 보드 선택</h2>
              <button
                onClick={() => setInviteSelectUserId(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {boards && boards.length > 0 ? (
                <div className="space-y-2">
                  {boards.filter(b => !b.isArchived).map((board) => (
                    <button
                      key={board.id}
                      onClick={() => handleSelectBoardForInvite(board.id)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <div
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: board.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{board.name}</p>
                        {board.description && (
                          <p className="text-sm text-gray-500 truncate">{board.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>보드가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      {/* Friend Requests Modal */}
      <FriendRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
        }}
      />
    </MainLayout>
  );
}
