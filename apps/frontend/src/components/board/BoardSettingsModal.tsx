'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Board, BoardMember, useUpdateBoard, useDeleteBoard, useRemoveBoardMember } from '@/hooks/useBoard';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import DeleteConfirmModal from './DeleteConfirmModal';

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
}

type TabType = 'general' | 'members' | 'danger';

const colorOptions = [
  { value: '#3B82F6', name: '파랑' },
  { value: '#10B981', name: '초록' },
  { value: '#EF4444', name: '빨강' },
  { value: '#F59E0B', name: '주황' },
  { value: '#8B5CF6', name: '보라' },
  { value: '#EC4899', name: '핑크' },
  { value: '#6B7280', name: '회색' },
];

const roleLabels: Record<string, string> = {
  owner: '소유자',
  admin: '관리자',
  member: '멤버',
  viewer: '뷰어',
};

export default function BoardSettingsModal({
  isOpen,
  onClose,
  board,
}: BoardSettingsModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();
  const removeMember = useRemoveBoardMember();

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<BoardMember | null>(null);

  // Form state
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description || '');
  const [color, setColor] = useState(board.color);

  // Reset form when board changes
  useEffect(() => {
    setName(board.name);
    setDescription(board.description || '');
    setColor(board.color);
  }, [board]);

  const isOwner = board.ownerId === user?.id;

  const handleSaveGeneral = async () => {
    if (!name.trim()) {
      showToast('보드 이름을 입력해주세요', 'error');
      return;
    }

    try {
      await updateBoard.mutateAsync({
        id: board.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        },
      });
      showToast('보드가 수정되었습니다', 'success');
    } catch (error: any) {
      showToast(error.message || '보드 수정에 실패했습니다', 'error');
    }
  };

  const handleDeleteBoard = async () => {
    try {
      await deleteBoard.mutateAsync(board.id);
      showToast('보드가 삭제되었습니다', 'success');
      setIsDeleteModalOpen(false);
      onClose();
      router.push('/');
    } catch (error: any) {
      showToast(error.message || '보드 삭제에 실패했습니다', 'error');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMember.mutateAsync({
        boardId: board.id,
        userId: memberToRemove.userId,
      });
      showToast('멤버가 제거되었습니다', 'success');
      setMemberToRemove(null);
    } catch (error: any) {
      showToast(error.message || '멤버 제거에 실패했습니다', 'error');
    }
  };

  const handleClose = () => {
    setName(board.name);
    setDescription(board.description || '');
    setColor(board.color);
    setActiveTab('general');
    onClose();
  };

  useEscapeKey(handleClose, isOpen && !updateBoard.isPending && !deleteBoard.isPending && !removeMember.isPending);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">보드 설정</h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b px-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              일반
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              멤버
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab('danger')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'danger'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                위험 구역
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label htmlFor="board-name" className="block text-sm font-medium text-gray-700 mb-1">
                    보드 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="board-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="보드 이름을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={!isOwner}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="board-description" className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    id="board-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="보드 설명을 입력하세요"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    disabled={!isOwner}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    색상
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => isOwner && setColor(option.value)}
                        disabled={!isOwner}
                        className={`w-8 h-8 rounded-full transition-all ${
                          color === option.value
                            ? 'ring-2 ring-offset-1 ring-gray-400'
                            : ''
                        } ${!isOwner ? 'cursor-not-allowed opacity-60' : ''}`}
                        style={{ backgroundColor: option.value }}
                        title={option.name}
                      />
                    ))}
                  </div>
                </div>

                {isOwner && (
                  <div className="pt-4">
                    <button
                      onClick={handleSaveGeneral}
                      disabled={updateBoard.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {updateBoard.isPending ? '저장 중...' : '변경사항 저장'}
                    </button>
                  </div>
                )}

                {!isOwner && (
                  <p className="text-sm text-gray-500">
                    보드 소유자만 설정을 변경할 수 있습니다.
                  </p>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    멤버 ({board.members?.length || 1}명)
                  </h3>
                </div>

                <div className="space-y-2">
                  {/* Owner first */}
                  {board.owner && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {board.owner.nickname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{board.owner.nickname}</p>
                          <p className="text-sm text-gray-500">{board.owner.email}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {roleLabels['owner']}
                      </span>
                    </div>
                  )}

                  {/* Other members */}
                  {board.members
                    ?.filter((m) => m.userId !== board.ownerId)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {member.user?.nickname?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.user?.nickname || '알 수 없음'}
                            </p>
                            <p className="text-sm text-gray-500">{member.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            {roleLabels[member.role] || member.role}
                          </span>
                          {isOwner && (
                            <button
                              onClick={() => setMemberToRemove(member)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="멤버 제거"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                  {(!board.members || board.members.length === 0) && !board.owner && (
                    <div className="text-center py-8 text-gray-500">
                      <p>멤버가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && isOwner && (
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">보드 삭제</h3>
                  <p className="text-sm text-red-700 mb-4">
                    이 보드를 삭제하면 모든 컬럼, 카드 및 멤버 정보가 영구적으로 삭제됩니다.
                    이 작업은 되돌릴 수 없습니다.
                  </p>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    보드 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Board Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteBoard}
        title="보드 삭제"
        message={`"${board.name}" 보드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 컬럼과 카드가 영구적으로 삭제됩니다.`}
        isLoading={deleteBoard.isPending}
      />

      {/* Remove Member Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="멤버 제거"
        message={`"${memberToRemove?.user?.nickname || '이 멤버'}"를 보드에서 제거하시겠습니까?`}
        isLoading={removeMember.isPending}
      />
    </>
  );
}
