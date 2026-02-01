'use client';

import {
  useIncomingRequests,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  type FriendRequest,
} from '@/hooks/useFriends';
import { useToast } from '@/contexts/ToastContext';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FriendRequestsModal({ isOpen, onClose }: FriendRequestsModalProps) {
  const { data: requests, isLoading } = useIncomingRequests();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const { showToast } = useToast();

  const handleAccept = async (request: FriendRequest) => {
    try {
      await acceptRequest.mutateAsync(request.id);
      showToast(`${request.requester.nickname}님의 친구 요청을 수락했습니다.`, 'success');
    } catch (error: any) {
      showToast(error?.message || '요청 수락에 실패했습니다.', 'error');
    }
  };

  const handleReject = async (request: FriendRequest) => {
    try {
      await rejectRequest.mutateAsync(request.id);
      showToast('친구 요청을 거절했습니다.', 'success');
    } catch (error: any) {
      showToast(error?.message || '요청 거절에 실패했습니다.', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">받은 친구 요청</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {request.requester.avatar ? (
                      <img
                        src={request.requester.avatar}
                        alt={request.requester.nickname}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                        {(request.requester.firstName?.[0] || request.requester.nickname[0]).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.requester.firstName} {request.requester.lastName}
                      </p>
                      <p className="text-sm text-gray-500">@{request.requester.nickname}</p>
                      <p className="text-xs text-gray-400">{formatDate(request.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(request)}
                      disabled={acceptRequest.isPending || rejectRequest.isPending}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                      title="수락"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleReject(request)}
                      disabled={acceptRequest.isPending || rejectRequest.isPending}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      title="거절"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>받은 친구 요청이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
