'use client';

import { useState } from 'react';
import { useCreateCard } from '@/hooks/useCard';
import { useCreateSchedule } from '@/hooks/useSchedule';
import { Board } from '@/hooks/useBoard';
import { useToast } from '@/contexts/ToastContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  board: Board;
  columnId: string;
  existingCardsCount: number;
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

export default function CreateCardModal({
  isOpen,
  onClose,
  boardId,
  board,
  columnId,
  existingCardsCount,
}: CreateCardModalProps) {
  const { showToast } = useToast();
  const { emitCardCreate } = useSocket();
  const { user } = useAuth();
  const createCard = useCreateCard();
  const createSchedule = useCreateSchedule();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [createWorkBlock, setCreateWorkBlock] = useState(false);
  const [workDate, setWorkDate] = useState('');
  const [workStartTime, setWorkStartTime] = useState('');
  const [workEndTime, setWorkEndTime] = useState('');
  const [workTitle, setWorkTitle] = useState('');

  const assigneeOptions = [
    ...(board.owner ? [{
      id: board.owner.id,
      nickname: board.owner.nickname,
      email: board.owner.email,
      roleLabel: '소유자',
    }] : []),
    ...((board.members || [])
      .filter((member) => member.user && member.user.id !== board.ownerId)
      .map((member) => ({
        id: member.user!.id,
        nickname: member.user!.nickname,
        email: member.user!.email,
        roleLabel: member.role,
      }))),
  ];

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const buildDateTime = (date: string, time: string) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}:00`);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('제목을 입력해주세요', 'error');
      return;
    }

    try {
      const newCard = await createCard.mutateAsync({
        boardId,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          position: existingCardsCount,
          priority,
          color,
          tags: tags.length > 0 ? tags : undefined,
          dueDate: dueDate || undefined,
          estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
          assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
          columnId,
        },
      });

      if (createWorkBlock && workDate && workStartTime && workEndTime) {
        const start = buildDateTime(workDate, workStartTime);
        const end = buildDateTime(workDate, workEndTime);

        if (start && end && end > start) {
          const targetUserIds = assigneeIds.length > 0 ? assigneeIds : (user?.id ? [user.id] : []);
          if (targetUserIds.length === 0) {
            showToast('작업 시간 블록 생성 대상 사용자를 찾을 수 없어 카드만 생성되었습니다', 'error');
          } else {
            await Promise.all(
              targetUserIds.map((targetUserId) =>
                createSchedule.mutateAsync({
                  title: (workTitle || title).trim() || '작업 시간 블록',
                  startTime: start.toISOString(),
                  endTime: end.toISOString(),
                  userId: targetUserId,
                  cardId: newCard.id,
                  type: 'event',
                  color: color || board.color,
                })
              )
            );
          }
        } else {
          showToast('작업 시간 블록 시간 범위가 올바르지 않아 카드만 생성되었습니다', 'error');
        }
      }

      // Emit socket event for real-time sync
      emitCardCreate({ boardId, card: { ...newCard } as Record<string, unknown> });

      showToast('카드가 생성되었습니다', 'success');
      handleClose();
    } catch (error: any) {
      showToast(error.message || '카드 생성에 실패했습니다', 'error');
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setColor(undefined);
    setTagInput('');
    setTags([]);
    setDueDate('');
    setEstimatedHours('');
    setAssigneeIds([]);
    setCreateWorkBlock(false);
    setWorkDate('');
    setWorkStartTime('');
    setWorkEndTime('');
    setWorkTitle('');
    onClose();
  };

  useEscapeKey(handleClose, isOpen && !createCard.isPending);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">카드 추가</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="카드 제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                id="description"
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
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                태그
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="tags"
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
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  마감일
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                  예상 시간
                </label>
                <input
                  type="number"
                  id="estimatedHours"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="시간"
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자 (복수 선택 가능)
              </label>
              <div className="rounded-lg border border-gray-300 p-3 space-y-2 max-h-44 overflow-y-auto">
                {assigneeOptions.length === 0 ? (
                  <p className="text-sm text-gray-500">초대된 멤버가 없습니다</p>
                ) : (
                  assigneeOptions.map((option) => (
                    <label key={option.id} className="flex items-center justify-between gap-3 cursor-pointer rounded-md px-2 py-1.5 hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{option.nickname}</p>
                        <p className="text-xs text-gray-500 truncate">{option.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {option.roleLabel}
                        </span>
                        <input
                          type="checkbox"
                          checked={assigneeIds.includes(option.id)}
                          onChange={() => toggleAssignee(option.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    </label>
                  ))
                )}
              </div>
              {assigneeIds.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">선택됨: {assigneeIds.length}명</p>
              )}
            </div>

            {/* Optional work schedule block */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createWorkBlock}
                  onChange={(e) => setCreateWorkBlock(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-blue-900">
                  카드 생성과 동시에 작업 스케줄 시간 블록 만들기
                </span>
              </label>

              {createWorkBlock && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="workTitle" className="block text-xs font-medium text-gray-700 mb-1">
                      스케줄 제목 (비워두면 카드 제목 사용)
                    </label>
                    <input
                      id="workTitle"
                      type="text"
                      value={workTitle}
                      onChange={(e) => setWorkTitle(e.target.value)}
                      placeholder="예: 초안 작성 시간"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">날짜</label>
                      <input
                        type="date"
                        value={workDate}
                        onChange={(e) => setWorkDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">시작</label>
                      <input
                        type="time"
                        value={workStartTime}
                        onChange={(e) => setWorkStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">종료</label>
                      <input
                        type="time"
                        value={workEndTime}
                        onChange={(e) => setWorkEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    담당자를 여러 명 선택하면 같은 시간 블록이 각 담당자 스케줄에 생성됩니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 sticky bottom-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={createCard.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createCard.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {createCard.isPending ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
