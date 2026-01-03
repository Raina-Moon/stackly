'use client';

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  type: 'event' | 'deadline' | 'reminder';
}

// 데모 데이터
const demoSchedules: ScheduleItem[] = [
  { id: '1', title: '팀 회의', time: '10:00', type: 'event' },
  { id: '2', title: '프로젝트 A 마감', time: '14:00', type: 'deadline' },
  { id: '3', title: '코드 리뷰', time: '16:00', type: 'reminder' },
];

const typeStyles = {
  event: 'bg-blue-100 text-blue-600 border-blue-200',
  deadline: 'bg-red-100 text-red-600 border-red-200',
  reminder: 'bg-yellow-100 text-yellow-600 border-yellow-200',
};

const typeIcons = {
  event: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  deadline: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reminder: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
};

interface TodayScheduleProps {
  onItemClick?: (id: string) => void;
}

export default function TodaySchedule({ onItemClick }: TodayScheduleProps) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">오늘 일정</h2>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          전체 보기
        </button>
      </div>

      {demoSchedules.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>오늘 예정된 일정이 없습니다</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {demoSchedules.map((schedule) => (
            <li key={schedule.id}>
              <button
                onClick={() => onItemClick?.(schedule.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-gray-50 ${typeStyles[schedule.type]}`}
              >
                {typeIcons[schedule.type]}
                <span className="flex-1 text-left font-medium">{schedule.title}</span>
                <span className="text-sm opacity-75">{schedule.time}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add schedule button */}
      <button className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        일정 추가
      </button>
    </div>
  );
}
