'use client';

import { useMemo, useState } from 'react';
import { Board, Card } from '@/hooks/useBoard';
import { useUpdateCard, useDeleteCard } from '@/hooks/useCard';
import {
  useCreateSchedule,
  useDeleteSchedule,
  useSchedulesByCard,
  useUpdateSchedule,
} from '@/hooks/useSchedule';
import { useToast } from '@/contexts/ToastContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import DeleteConfirmModal from './DeleteConfirmModal';

interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
  boardId: string;
  board: Board;
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
  board,
}: CardDetailModalProps) {
  const { showToast } = useToast();
  const { emitCardUpdate, emitCardDelete } = useSocket();
  const { user } = useAuth();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const { data: cardSchedules = [], isLoading: schedulesLoading } = useSchedulesByCard(card.id);
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

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
  const [assigneeIds, setAssigneeIds] = useState<string[]>(card.assigneeIds || (card.assigneeId ? [card.assigneeId] : []));
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [newScheduleStart, setNewScheduleStart] = useState('');
  const [newScheduleEnd, setNewScheduleEnd] = useState('');
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingScheduleTitle, setEditingScheduleTitle] = useState('');
  const [editingScheduleDate, setEditingScheduleDate] = useState('');
  const [editingScheduleStart, setEditingScheduleStart] = useState('');
  const [editingScheduleEnd, setEditingScheduleEnd] = useState('');

  const assigneeOptions = useMemo(() => [
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
  ], [board]);

  const selectedAssigneeIds = assigneeIds;
  const assignedUsers = assigneeOptions.filter((option) => selectedAssigneeIds.includes(option.id));

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const buildDateTimeIso = (date: string, time: string) => {
    if (!date || !time) return null;
    const dt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  };

  const splitScheduleDateTime = (iso: string) => {
    const date = new Date(iso);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
    };
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

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('제목을 입력해주세요', 'error');
      return;
    }

    const updates = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      color,
      tags: tags.length > 0 ? tags : [],
      dueDate: dueDate || undefined,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : [],
    };

    try {
      await updateCard.mutateAsync({
        id: card.id,
        boardId,
        data: updates,
      });

      // Emit socket event for real-time sync
      emitCardUpdate({ boardId, cardId: card.id, updates });

      showToast('카드가 수정되었습니다', 'success');
      setIsEditing(false);
    } catch (error: any) {
      showToast(error.message || '카드 수정에 실패했습니다', 'error');
    }
  };

  const handleToggleComplete = async () => {
    const updates = {
      completedAt: card.completedAt ? undefined : new Date().toISOString(),
    };

    try {
      await updateCard.mutateAsync({
        id: card.id,
        boardId,
        data: updates,
      });

      // Emit socket event for real-time sync
      emitCardUpdate({ boardId, cardId: card.id, updates });

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

      // Emit socket event for real-time sync
      emitCardDelete({ boardId, cardId: card.id, columnId: card.columnId });

      showToast('카드가 삭제되었습니다', 'success');
      setIsDeleteModalOpen(false);
      onClose();
    } catch (error: any) {
      showToast(error.message || '카드 삭제에 실패했습니다', 'error');
    }
  };

  const handleCreateScheduleBlock = async () => {
    const startIso = buildDateTimeIso(newScheduleDate, newScheduleStart);
    const endIso = buildDateTimeIso(newScheduleDate, newScheduleEnd);
    if (!startIso || !endIso) {
      showToast('스케줄 날짜와 시간을 입력해주세요', 'error');
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      showToast('종료 시간은 시작 시간보다 늦어야 합니다', 'error');
      return;
    }

    const targetUserIds = assigneeIds.length > 0 ? assigneeIds : (user?.id ? [user.id] : []);
    if (targetUserIds.length === 0) {
      showToast('담당자를 지정하거나 로그인 상태를 확인해주세요', 'error');
      return;
    }

    try {
      await Promise.all(
        targetUserIds.map((targetUserId) =>
          createSchedule.mutateAsync({
            title: (newScheduleTitle || card.title).trim(),
            startTime: startIso,
            endTime: endIso,
            userId: targetUserId,
            cardId: card.id,
            type: 'event',
            color: card.color,
          })
        )
      );
      showToast('카드 작업 스케줄이 생성되었습니다', 'success');
      setNewScheduleTitle('');
      setNewScheduleDate('');
      setNewScheduleStart('');
      setNewScheduleEnd('');
    } catch (error: any) {
      showToast(error?.message || '스케줄 생성에 실패했습니다', 'error');
    }
  };

  const beginEditSchedule = (schedule: { id: string; title: string; startTime: string; endTime: string }) => {
    const start = splitScheduleDateTime(schedule.startTime);
    const end = splitScheduleDateTime(schedule.endTime);
    setEditingScheduleId(schedule.id);
    setEditingScheduleTitle(schedule.title);
    setEditingScheduleDate(start.date);
    setEditingScheduleStart(start.time);
    setEditingScheduleEnd(end.time);
  };

  const handleSaveScheduleEdit = async (scheduleId: string) => {
    const startIso = buildDateTimeIso(editingScheduleDate, editingScheduleStart);
    const endIso = buildDateTimeIso(editingScheduleDate, editingScheduleEnd);
    if (!startIso || !endIso) {
      showToast('스케줄 날짜와 시간을 입력해주세요', 'error');
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      showToast('종료 시간은 시작 시간보다 늦어야 합니다', 'error');
      return;
    }

    try {
      await updateSchedule.mutateAsync({
        id: scheduleId,
        data: {
          title: editingScheduleTitle.trim() || card.title,
          startTime: startIso,
          endTime: endIso,
        },
      });
      showToast('스케줄이 수정되었습니다', 'success');
      setEditingScheduleId(null);
    } catch (error: any) {
      showToast(error?.message || '스케줄 수정에 실패했습니다', 'error');
    }
  };

  const handleDeleteScheduleBlock = async (scheduleId: string) => {
    try {
      await deleteSchedule.mutateAsync({ id: scheduleId, cardId: card.id });
      showToast('스케줄이 삭제되었습니다', 'success');
      if (editingScheduleId === scheduleId) {
        setEditingScheduleId(null);
      }
    } catch (error: any) {
      showToast(error?.message || '스케줄 삭제에 실패했습니다', 'error');
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
    setAssigneeIds(card.assigneeIds || (card.assigneeId ? [card.assigneeId] : []));
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

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">담당자</h4>
                    <span className="text-sm text-gray-600">
                      {assignedUsers.length > 0
                        ? assignedUsers.map((u) => u.nickname).join(', ')
                        : '미지정'}
                    </span>
                  </div>
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

            {/* Linked schedules / work blocks */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900">작업 스케줄 (시간 블록)</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    이 카드와 연결된 실제 수행 시간을 날짜/시간 단위로 관리합니다.
                  </p>
                </div>
                <span className="text-xs font-medium text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-100">
                  {cardSchedules.length}개
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {schedulesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-indigo-600" />
                  </div>
                ) : cardSchedules.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-indigo-200 bg-white/70 px-3 py-4 text-sm text-indigo-700">
                    아직 연결된 작업 스케줄이 없습니다. 아래에서 첫 시간 블록을 추가해보세요.
                  </div>
                ) : (
                  cardSchedules.map((schedule) => {
                    const start = new Date(schedule.startTime);
                    const end = new Date(schedule.endTime);
                    const isEditingSchedule = editingScheduleId === schedule.id;
                    const dateLabel = start.toLocaleDateString('ko-KR');
                    const timeLabel = `${start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;

                    return (
                      <div key={schedule.id} className="rounded-lg border border-indigo-100 bg-white p-3">
                        {isEditingSchedule ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingScheduleTitle}
                              onChange={(e) => setEditingScheduleTitle(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="스케줄 제목"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="date"
                                value={editingScheduleDate}
                                onChange={(e) => setEditingScheduleDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <input
                                type="time"
                                value={editingScheduleStart}
                                onChange={(e) => setEditingScheduleStart(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <input
                                type="time"
                                value={editingScheduleEnd}
                                onChange={(e) => setEditingScheduleEnd(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingScheduleId(null)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveScheduleEdit(schedule.id)}
                                disabled={updateSchedule.isPending}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                              >
                                저장
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{schedule.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{dateLabel}</p>
                              <p className="text-xs text-indigo-700 font-medium">{timeLabel}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => beginEditSchedule(schedule)}
                                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteScheduleBlock(schedule.id)}
                                disabled={deleteSchedule.isPending}
                                className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 rounded-lg border border-dashed border-indigo-200 bg-white/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">
                  새 시간 블록 추가
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newScheduleTitle}
                    onChange={(e) => setNewScheduleTitle(e.target.value)}
                    placeholder="스케줄 제목 (비우면 카드 제목 사용)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="date"
                      value={newScheduleDate}
                      onChange={(e) => setNewScheduleDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="time"
                      value={newScheduleStart}
                      onChange={(e) => setNewScheduleStart(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="time"
                      value={newScheduleEnd}
                      onChange={(e) => setNewScheduleEnd(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-600">
                      대상 사용자: {assignedUsers.length > 0
                        ? `${assignedUsers.length}명 담당자`
                        : user?.nickname || '없음'} (카드 담당자 우선)
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateScheduleBlock}
                      disabled={createSchedule.isPending}
                      className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {createSchedule.isPending ? '추가 중...' : '시간 블록 추가'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
