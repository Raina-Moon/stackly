'use client';

import { useState } from 'react';
import { useCreateColumn } from '@/hooks/useColumn';
import { useToast } from '@/contexts/ToastContext';

interface CreateColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  existingColumnsCount: number;
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

export default function CreateColumnModal({
  isOpen,
  onClose,
  boardId,
  existingColumnsCount,
}: CreateColumnModalProps) {
  const { showToast } = useToast();
  const createColumn = useCreateColumn();

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>('#3B82F6');
  const [wipLimit, setWipLimit] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('컬럼 이름을 입력해주세요', 'error');
      return;
    }

    try {
      await createColumn.mutateAsync({
        name: name.trim(),
        color,
        position: existingColumnsCount,
        wipLimit: wipLimit ? Number(wipLimit) : undefined,
        boardId,
      });
      showToast('컬럼이 생성되었습니다', 'success');
      handleClose();
    } catch (error: any) {
      showToast(error.message || '컬럼 생성에 실패했습니다', 'error');
    }
  };

  const handleClose = () => {
    setName('');
    setColor('#3B82F6');
    setWipLimit('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">컬럼 추가</h2>
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
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                컬럼 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: To Do, In Progress, Done"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
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

            {/* WIP Limit */}
            <div>
              <label htmlFor="wipLimit" className="block text-sm font-medium text-gray-700 mb-1">
                WIP 제한
              </label>
              <input
                type="number"
                id="wipLimit"
                value={wipLimit}
                onChange={(e) => setWipLimit(e.target.value)}
                placeholder="제한 없음"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                이 컬럼에 허용할 최대 카드 수입니다. 비워두면 제한이 없습니다.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              type="button"
              onClick={handleClose}
              disabled={createColumn.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createColumn.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {createColumn.isPending ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
