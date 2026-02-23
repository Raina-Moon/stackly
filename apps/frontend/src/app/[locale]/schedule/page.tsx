'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/MainLayout';
import LoginModal from '@/components/auth/LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Schedule,
  ScheduleStatus,
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
  status: ScheduleStatus;
}

type LinkedFilter = 'all' | 'linked' | 'manual';
type TypeFilter = 'all' | EditorState['type'];

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

function formatDurationMinutes(startIso: string, endIso: string) {
  const diff = Math.max(0, new Date(endIso).getTime() - new Date(startIso).getTime());
  const mins = Math.round(diff / (1000 * 60));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  return `${m}분`;
}

function defaultEditor(selectedDate: string): EditorState {
  return {
    title: '',
    date: selectedDate,
    start: '09:00',
    end: '10:00',
    description: '',
    type: 'event',
    status: 'pending',
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

const statusColors: Record<ScheduleStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
};

const statusCycle: ScheduleStatus[] = ['pending', 'in_progress', 'completed'];

export default function SchedulePage() {
  const t = useTranslations('schedule');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [editor, setEditor] = useState<EditorState>(() => defaultEditor(toDateInputValue(new Date())));
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkedFilter, setLinkedFilter] = useState<LinkedFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const rangeStart = `${selectedDate}T00:00:00.000Z`;
  const rangeEnd = `${selectedDate}T23:59:59.999Z`;

  const { data: schedules = [], isLoading } = useSchedulesByUserRange(
    user?.id || '',
    rangeStart,
    rangeEnd
  );

  const filteredSchedules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return schedules.filter((schedule) => {
      if (linkedFilter === 'linked' && !schedule.cardId) return false;
      if (linkedFilter === 'manual' && schedule.cardId) return false;
      if (typeFilter !== 'all' && schedule.type !== typeFilter) return false;
      if (!q) return true;
      return (
        schedule.title.toLowerCase().includes(q) ||
        (schedule.description || '').toLowerCase().includes(q) ||
        (schedule.card?.title || '').toLowerCase().includes(q)
      );
    });
  }, [schedules, searchQuery, linkedFilter, typeFilter]);

  const conflictIds = useMemo(() => {
    const sorted = [...filteredSchedules].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    const ids = new Set<string>();
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const currentEnd = new Date(sorted[i].endTime).getTime();
      const nextStart = new Date(sorted[i + 1].startTime).getTime();
      if (currentEnd > nextStart) {
        ids.add(sorted[i].id);
        ids.add(sorted[i + 1].id);
      }
    }
    return ids;
  }, [filteredSchedules]);

  const hourlyRows = useMemo(() => {
    const rows = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      items: [] as Schedule[],
    }));

    filteredSchedules.forEach((schedule) => {
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
  }, [filteredSchedules]);

  const sortedSchedules = useMemo(
    () =>
      [...filteredSchedules].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [filteredSchedules]
  );

  const scheduleStats = useMemo(() => {
    const linked = filteredSchedules.filter((s) => !!s.cardId).length;
    const manual = filteredSchedules.length - linked;
    const pending = filteredSchedules.filter((s) => (s.status || 'pending') === 'pending').length;
    const inProgress = filteredSchedules.filter((s) => (s.status || 'pending') === 'in_progress').length;
    const completed = filteredSchedules.filter((s) => (s.status || 'pending') === 'completed').length;
    const completionRate = filteredSchedules.length > 0
      ? Math.round((completed / filteredSchedules.length) * 100)
      : 0;
    return {
      total: filteredSchedules.length,
      linked,
      manual,
      pending,
      inProgress,
      completed,
      completionRate,
      conflicts: conflictIds.size,
    };
  }, [filteredSchedules, conflictIds]);

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

  const goToday = () => {
    const todayValue = toDateInputValue(new Date());
    setSelectedDate(todayValue);
    setEditor((prev) => ({ ...prev, date: todayValue }));
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
            status: editor.status,
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
          status: editor.status,
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
      status: schedule.status || 'pending',
    });
    setIsEditing(true);
  };

  const handleHourSlotClick = (hour: number) => {
    const start = `${pad(hour)}:00`;
    const nextHour = Math.min(hour + 1, 23);
    const end = hour === 23 ? '23:59' : `${pad(nextHour)}:00`;
    setEditor((prev) => ({
      ...prev,
      date: selectedDate,
      start,
      end,
      title: isEditing ? prev.title : prev.title,
    }));
    if (isEditing) {
      setIsEditing(false);
      setEditor((prev) => ({ ...defaultEditor(selectedDate), start, end }));
    }
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

  const handleQuickCycleStatus = async (schedule: Schedule) => {
    const currentStatus = (schedule.status || 'pending') as ScheduleStatus;
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    try {
      await updateSchedule.mutateAsync({
        id: schedule.id,
        data: { status: nextStatus },
      });
      showToast(t(`status.${nextStatus}`), 'success');

      if (editor.id === schedule.id) {
        setEditor((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (error: any) {
      showToast(error?.message || '상태 변경에 실패했습니다', 'error');
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
          <p className="text-sm text-gray-500">
            필터 결과 {sortedSchedules.length}개 일정 · 완료율 {scheduleStats.completionRate}%
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-8">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">전체</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{scheduleStats.total}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
            <p className="text-xs text-indigo-700">카드 연결</p>
            <p className="mt-1 text-lg font-semibold text-indigo-900">{scheduleStats.linked}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-600">직접 생성</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{scheduleStats.manual}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-xs text-red-700">시간 충돌</p>
            <p className="mt-1 text-lg font-semibold text-red-900">{scheduleStats.conflicts}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-xs text-gray-500">대기</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{scheduleStats.pending}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-700">진행</p>
            <p className="mt-1 text-lg font-semibold text-blue-900">{scheduleStats.inProgress}</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-3">
            <p className="text-xs text-green-700">완료</p>
            <p className="mt-1 text-lg font-semibold text-green-900">{scheduleStats.completed}</p>
          </div>
          <div className="col-span-2 lg:col-span-8 rounded-xl border border-gray-100 bg-white p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목/설명/카드 제목 검색"
                className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setLinkedFilter('all');
                  setTypeFilter('all');
                }}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                필터 초기화
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['all', 'linked', 'manual'] as LinkedFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setLinkedFilter(filter)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    linkedFilter === filter
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {filter === 'all' ? '전체' : filter === 'linked' ? '카드 연결만' : '직접 생성만'}
                </button>
              ))}
              {(['all', 'event', 'deadline', 'reminder', 'milestone'] as TypeFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTypeFilter(filter)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    typeFilter === filter
                      ? 'border-gray-300 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {filter === 'all' ? '유형 전체' : typeLabels[filter]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

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

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">상태</label>
              <div className="flex flex-wrap gap-2">
                {statusCycle.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setEditor((prev) => ({ ...prev, status }))}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
                      editor.status === status
                        ? statusColors[status]
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {t(`status.${status}`)}
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
                onClick={goToday}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100"
              >
                오늘
              </button>
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
                  <button
                    type="button"
                    onClick={() => handleHourSlotClick(row.hour)}
                    className={`bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 hover:bg-blue-50 ${
                      new Date().toDateString() === new Date(`${selectedDate}T00:00:00`).toDateString() &&
                      new Date().getHours() === row.hour ? 'text-blue-700 bg-blue-50' : ''
                    }`}
                  >
                    {pad(row.hour)}:00
                  </button>
                  <div className="min-h-14 px-3 py-2">
                    {row.items.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleHourSlotClick(row.hour)}
                        className="h-full w-full rounded-md border border-dashed border-gray-100 hover:border-blue-200 hover:bg-blue-50/40"
                      />
                    ) : (
                      <div className="space-y-2">
                        {row.items.map((schedule) => {
                          const start = new Date(schedule.startTime);
                          const end = new Date(schedule.endTime);
                          const linked = !!schedule.cardId;
                          const isConflict = conflictIds.has(schedule.id);
                          const status = schedule.status || 'pending';
                          const isCompleted = status === 'completed';
                          return (
                            <button
                              key={schedule.id}
                              type="button"
                              onClick={() => startEdit(schedule)}
                              className={`w-full rounded-lg border p-2 text-left transition ${
                                isConflict
                                  ? 'border-red-200 ring-1 ring-red-100'
                                  : 'border-gray-200'
                              } ${
                                isCompleted
                                  ? 'bg-gray-50/80 opacity-80 hover:bg-gray-100'
                                  : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className={`truncate text-sm font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                      {schedule.title}
                                    </p>
                                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${typeColors[schedule.type]}`}>
                                      {typeLabels[schedule.type as EditorState['type']]}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickCycleStatus(schedule);
                                      }}
                                      disabled={updateSchedule.isPending}
                                      title="클릭하여 상태 변경 (대기→진행→완료)"
                                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition hover:brightness-95 disabled:opacity-50 ${statusColors[status]}`}
                                    >
                                      {t(`status.${status}`)}
                                    </button>
                                    {linked && (
                                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                                        카드 연결
                                      </span>
                                    )}
                                    {isConflict && (
                                      <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                        시간 충돌
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {formatTime(start)} - {formatTime(end)}
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-400">
                                    소요 {formatDurationMinutes(schedule.startTime, schedule.endTime)}
                                  </p>
                                  {schedule.card?.title && (
                                    <p className="mt-1 text-xs text-indigo-700 truncate">
                                      연결 카드: {schedule.card.title}
                                    </p>
                                  )}
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
