'use client';

import { FormEvent, useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import LoginModal from '@/components/auth/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Schedule,
  useCreateSchedule,
  useDeleteSchedule,
  useSchedulesByUserRange,
  useUpdateSchedule,
} from '@/hooks/useSchedule';

interface EditorState {
  id?: string;
  title: string;
  date: string;
  start: string;
  end: string;
  description: string;
  type: 'event' | 'deadline' | 'reminder' | 'milestone';
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoLocal(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function defaultEditor(selectedDate: string): EditorState {
  return {
    title: '',
    date: selectedDate,
    start: '09:00',
    end: '10:00',
    description: '',
    type: 'event',
  };
}

const typeLabels: Record<EditorState['type'], string> = {
  event: '업무',
  deadline: '마감',
  reminder: '리마인더',
  milestone: '마일스톤',
};

const typeColors: Record<string, string> = {
  event: 'bg-blue-100 text-blue-700 border-blue-200',
  deadline: 'bg-red-100 text-red-700 border-red-200',
  reminder: 'bg-amber-100 text-amber-700 border-amber-200',
  milestone: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function SchedulePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [editor, setEditor] = useState<EditorState>(() => defaultEditor(toDateInputValue(new Date())));
  const [isEditing, setIsEditing] = useState(false);

  const rangeStart = `${selectedDate}T00:00:00.000Z`;
  const rangeEnd = `${selectedDate}T23:59:59.999Z`;

  const { data: schedules = [], isLoading } = useSchedulesByUserRange(
    user?.id || '',
    rangeStart,
    rangeEnd
  );

  const hourlyRows = useMemo(() => {
    const rows = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      items: [] as Schedule[],
    }));

    schedules.forEach((schedule) => {
      const start = new Date(schedule.startTime);
      const hour = start.getHours();
      if (rows[hour]) rows[hour].items.push(schedule);
    });

    rows.forEach((row) => {
      row.items.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return rows;
  }, [schedules]);

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [schedules]
  );

  const selectedDateLabel = useMemo(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  }, [selectedDate]);

  const resetEditor = (date = selectedDate) => {
    setEditor(defaultEditor(date));
    setIsEditing(false);
  };

  const goDate = (delta: number) => {
    const base = new Date(`${selectedDate}T00:00:00`);
    base.setDate(base.getDate() + delta);
    const next = toDateInputValue(base);
    setSelectedDate(next);
    setEditor((prev) => ({ ...prev, date: next }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!editor.title.trim()) {
      showToast('일정 제목을 입력해주세요', 'error');
      return;
    }

    const startIso = toIsoLocal(editor.date, editor.start);
    const endIso = toIsoLocal(editor.date, editor.end);
    if (new Date(endIso) <= new Date(startIso)) {
      showToast('종료 시간은 시작 시간보다 늦어야 합니다', 'error');
      return;
    }

    try {
      if (isEditing && editor.id) {
        await updateSchedule.mutateAsync({
          id: editor.id,
          data: {
            title: editor.title.trim(),
            description: editor.description.trim() || undefined,
            type: editor.type,
            startTime: startIso,
            endTime: endIso,
          },
        });
        showToast('일정이 수정되었습니다', 'success');
      } else {
        await createSchedule.mutateAsync({
          title: editor.title.trim(),
          description: editor.description.trim() || undefined,
          type: editor.type,
          startTime: startIso,
          endTime: endIso,
          userId: user.id,
        });
        showToast('일정이 생성되었습니다', 'success');
      }

      resetEditor(editor.date);
    } catch (error: any) {
      showToast(error?.message || '일정 저장에 실패했습니다', 'error');
    }
  };

  const startEdit = (schedule: Schedule) => {
    const start = new Date(schedule.startTime);
    const end = new Date(schedule.endTime);
    setEditor({
      id: schedule.id,
      title: schedule.title,
      date: toDateInputValue(start),
      start: formatTime(start),
      end: formatTime(end),
      description: schedule.description || '',
      type: schedule.type,
    });
    setIsEditing(true);
  };

  const handleDelete = async (schedule: Schedule) => {
    if (!window.confirm(`"${schedule.title}" 일정을 삭제할까요?`)) return;

    try {
      await deleteSchedule.mutateAsync({ id: schedule.id, cardId: schedule.cardId });
      showToast('일정이 삭제되었습니다', 'success');
      if (editor.id === schedule.id) {
        resetEditor(selectedDate);
      }
    } catch (error: any) {
      showToast(error?.message || '일정 삭제에 실패했습니다', 'error');
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">스케줄 보기</h1>
          <p className="mt-2 text-gray-600">
            일정은 사용자별 데이터입니다. 로그인 후 카드와 연결된 작업 시간까지 한 화면에서 관리할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            로그인하고 스케줄 보기
          </button>
        </div>
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">스케줄</h1>
          <p className="mt-1 text-gray-500">
            날짜별 시간표로 일정을 관리하고, 카드와 연결된 작업 시간 블록도 함께 확인하세요.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">선택 날짜</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{selectedDateLabel}</p>
          <p className="text-sm text-gray-500">총 {sortedSchedules.length}개 일정</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1.4fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? '일정 수정' : '새 일정 생성'}
            </h2>
            {isEditing && (
              <button
                type="button"
                onClick={() => resetEditor(selectedDate)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                새로 작성
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">제목</label>
              <input
                type="text"
                value={editor.title}
                onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="예: API 문서 정리 / 디자인 리뷰"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">유형</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(typeLabels) as EditorState['type'][]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEditor((prev) => ({ ...prev, type }))}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
                      editor.type === type
                        ? typeColors[type]
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {typeLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">날짜</label>
                <input
                  type="date"
                  value={editor.date}
                  onChange={(e) => setEditor((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">시작</label>
                <input
                  type="time"
                  value={editor.start}
                  onChange={(e) => setEditor((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">종료</label>
                <input
                  type="time"
                  value={editor.end}
                  onChange={(e) => setEditor((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">설명 (선택)</label>
              <textarea
                rows={3}
                value={editor.description}
                onChange={(e) => setEditor((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="어떻게 진행할지, 준비물, 체크 포인트 등을 남겨두세요"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => resetEditor(selectedDate)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                초기화
              </button>
              <button
                type="submit"
                disabled={createSchedule.isPending || updateSchedule.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createSchedule.isPending || updateSchedule.isPending
                  ? '저장 중...'
                  : isEditing
                    ? '일정 저장'
                    : '일정 추가'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">일간 시간표</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goDate(-1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                이전날
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setEditor((prev) => ({ ...prev, date: e.target.value }));
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => goDate(1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                다음날
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-56 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="max-h-[560px] overflow-y-auto rounded-xl border border-gray-100">
              {hourlyRows.map((row) => (
                <div key={row.hour} className="grid grid-cols-[68px_1fr] border-b border-gray-100 last:border-b-0">
                  <div className="bg-gray-50 px-3 py-3 text-xs font-medium text-gray-500">
                    {pad(row.hour)}:00
                  </div>
                  <div className="min-h-14 px-3 py-2">
                    {row.items.length === 0 ? (
                      <div className="h-full rounded-md border border-dashed border-gray-100" />
                    ) : (
                      <div className="space-y-2">
                        {row.items.map((schedule) => {
                          const start = new Date(schedule.startTime);
                          const end = new Date(schedule.endTime);
                          const linked = !!schedule.cardId;
                          return (
                            <button
                              key={schedule.id}
                              type="button"
                              onClick={() => startEdit(schedule)}
                              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-left hover:bg-gray-50"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                      {schedule.title}
                                    </p>
                                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${typeColors[schedule.type]}`}>
                                      {typeLabels[schedule.type as EditorState['type']]}
                                    </span>
                                    {linked && (
                                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                                        카드 연결
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {formatTime(start)} - {formatTime(end)}
                                  </p>
                                  {schedule.description && (
                                    <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                                      {schedule.description}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(schedule);
                                  }}
                                  className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                  title="삭제"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
