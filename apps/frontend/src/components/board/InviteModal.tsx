'use client';

import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useRegenerateInviteCode } from '@/hooks/useBoard';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  boardName: string;
  inviteCode: string;
}

export default function InviteModal({
  isOpen,
  onClose,
  boardId,
  boardName,
  inviteCode,
}: InviteModalProps) {
  const { showToast } = useToast();
  const regenerateCode = useRegenerateInviteCode();
  const [currentCode, setCurrentCode] = useState(inviteCode);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/invite/${currentCode}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast('초대 링크가 복사되었습니다', 'success');
    } catch {
      showToast('링크 복사에 실패했습니다', 'error');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('초대 코드를 재생성하면 기존 링크는 더 이상 사용할 수 없습니다. 계속하시겠습니까?')) {
      return;
    }

    try {
      const result = await regenerateCode.mutateAsync(boardId);
      setCurrentCode(result.inviteCode);
      showToast('새로운 초대 코드가 생성되었습니다', 'success');
    } catch (error: any) {
      showToast(error.message || '초대 코드 재생성에 실패했습니다', 'error');
    }
  };

  useEscapeKey(onClose, isOpen && !regenerateCode.isPending);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">팀원 초대</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <p className="text-gray-600 text-sm mb-4">
              아래 링크를 공유하면 <span className="font-medium text-gray-900">{boardName}</span> 보드에 팀원을 초대할 수 있습니다.
            </p>

            {/* Invite URL */}
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 truncate">
                {inviteUrl}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                복사
              </button>
            </div>
          </div>

          {/* Regenerate button */}
          <div className="pt-4 border-t">
            <button
              onClick={handleRegenerate}
              disabled={regenerateCode.isPending}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {regenerateCode.isPending ? '재생성 중...' : '초대 코드 재생성'}
            </button>
            <p className="text-xs text-gray-400 mt-1">
              재생성하면 기존 초대 링크는 더 이상 사용할 수 없습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
