'use client';

import { useState } from 'react';
import { Card } from '@/hooks/useBoard';
import { useUpdateCard, useDeleteCard } from '@/hooks/useCard';
import { useToast } from '@/contexts/ToastContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import DeleteConfirmModal from './DeleteConfirmModal';

interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
  boardId: string;
}

const colorOptions = [
  { value: '#3B82F6', name: '파랑' },
  { value: '#10B981', name: '초록' },
  { value: '#EF4444', name: '빨강' },
  { value: '#F59E0B', name: '주황' },
  { value: '#8B5CF6', name: '보라' },
  { value: '#EC4899', name: '핑크' },
  { value: '#6B7280', name: '회색' },
];

const priorityOptions = [
  { value: 'low', label: '낮음', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: '보통', color: 'bg-blue-100 text-blue-600' },
  { value: 'high', label: '높음', color: 'bg-orange-100 text-orange-600' },
  { value: 'urgent', label: '긴급', color: 'bg-red-100 text-red-600' },
] as const;

export default function CardDetailModal({
  isOpen,
  onClose,
  card,
  boardId,
}: CardDetailModalProps) {
  const { showToast } = useToast();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(card.priority);
  const [color, setColor] = useState<string | undefined>(card.color);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(card.tags || []);
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split('T')[0] : '');
  const [estimatedHours, setEstimatedHours] = useState<string>(
    card.estimatedHours?.toString() || ''
  );

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('제목을 입력해주세요', 'error');
      return;
    }

    try {
      await updateCard.mutateAsync({
        id: card.id,
        boardId,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          color,
          tags: tags.length > 0 ? tags : [],
          dueDate: dueDate || undefined,
          estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        },
      });
      showToast('카드가 수정되었습니다', 'success');
      setIsEditing(false);
    } catch (error: any) {
      showToast(error.message || '카드 수정에 실패했습니다', 'error');
    }
  };

  const handleToggleComplete = async () => {
    try {
      await updateCard.mutateAsync({
        id: card.id,
        boardId,
        data: {
          completedAt: card.completedAt ? undefined : new Date().toISOString(),
        },
      });
      showToast(
        card.completedAt ? '카드가 미완료 상태로 변경되었습니다' : '카드가 완료되었습니다',
        'success'
      );
    } catch (error: any) {
      showToast(error.message || '상태 변경에 실패했습니다', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCard.mutateAsync({ id: card.id, boardId });
      showToast('카드가 삭제되었습니다', 'success');
      setIsDeleteModalOpen(false);
      onClose();
    } catch (error: any) {
      showToast(error.message || '카드 삭제에 실패했습니다', 'error');
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setTitle(card.title);
    setDescription(card.description || '');
    setPriority(card.priority);
    setColor(card.color);
    setTags(card.tags || []);
    setDueDate(card.dueDate ? card.dueDate.split('T')[0] : '');
    setEstimatedHours(card.estimatedHours?.toString() || '');
    setIsEditing(false);
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  useEscapeKey(handleClose, isOpen && !updateCard.isPending && !deleteCard.isPending);

  const priorityInfo = priorityOptions.find((p) => p.value === card.priority);

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
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              {card.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: card.color }}
                />
              )}
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? '카드 수정' : '카드 상세'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={handleToggleComplete}
                    disabled={updateCard.isPending}
                    className={`p-1.5 rounded-lg transition-colors ${
                      card.completedAt
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                    title={card.completedAt ? '미완료로 변경' : '완료로 표시'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                    title="수정"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-500 hover:text-red-600"
                    title="삭제"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {isEditing ? (
              /* Edit Mode */
              <>
                {/* Title */}
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="카드 제목을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="카드 설명을 입력하세요"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    우선순위
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {priorityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPriority(option.value)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                          priority === option.value
                            ? `${option.color} ring-2 ring-offset-1 ring-gray-400`
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    색상
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setColor(undefined)}
                      className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                        color === undefined
                          ? 'border-gray-400 ring-2 ring-offset-1 ring-gray-400'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setColor(option.value)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          color === option.value
                            ? 'ring-2 ring-offset-1 ring-gray-400'
                            : ''
                        }`}
                        style={{ backgroundColor: option.value }}
                        title={option.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-1">
                    태그
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="edit-tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="태그 입력 후 Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      추가
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-blue-900"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Due Date & Estimated Hours */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                      마감일
                    </label>
                    <input
                      type="date"
                      id="edit-dueDate"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                      예상 시간
                    </label>
                    <input
                      type="number"
                      id="edit-estimatedHours"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      placeholder="시간"
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* View Mode */
              <>
                {/* Title */}
                <div>
                  <h3 className={`text-xl font-semibold text-gray-900 ${card.completedAt ? 'line-through text-gray-500' : ''}`}>
                    {card.title}
                  </h3>
                  {card.completedAt && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      완료됨
                    </span>
                  )}
                </div>

                {/* Description */}
                {card.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">설명</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{card.description}</p>
                  </div>
                )}

                {/* Priority & Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">우선순위</h4>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${priorityInfo?.color}`}>
                      {priorityInfo?.label}
                    </span>
                  </div>

                  {card.dueDate && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">마감일</h4>
                      <span className="text-sm text-gray-600">
                        {new Date(card.dueDate).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}

                  {card.estimatedHours && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">예상 시간</h4>
                      <span className="text-sm text-gray-600">{card.estimatedHours}시간</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {card.tags && card.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">태그</h4>
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer (only in edit mode) */}
          {isEditing && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 sticky bottom-0">
              <button
                type="button"
                onClick={handleCancel}
                disabled={updateCard.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateCard.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {updateCard.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="카드 삭제"
        message="이 카드를 삭제하시겠습니까? 삭제된 카드는 복구할 수 없습니다."
        isLoading={deleteCard.isPending}
      />
    </>
  );
}
