'use client';

import { useTranslations } from 'next-intl';

interface BoardCardProps {
  id?: string;
  name: string;
  description?: string;
  color: string;
  cardCount?: number;
  isNew?: boolean;
  reserveTopSpace?: boolean;
  onClick?: () => void;
}

export default function BoardCard({
  name,
  description,
  color,
  cardCount = 0,
  isNew = false,
  reserveTopSpace = false,
  onClick,
}: BoardCardProps) {
  const t = useTranslations('boardCard');

  if (isNew) {
    return (
      <button
        onClick={onClick}
        className="w-full flex flex-col items-center justify-center h-40 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
      >
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
          <svg
            className="w-6 h-6 text-gray-400 group-hover:text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="mt-3 text-gray-500 group-hover:text-blue-600 font-medium">
          {t('createNew')}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col h-40 bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
    >
      {/* Color bar */}
      <div className="h-2" style={{ backgroundColor: color }} />

      {/* Content */}
      <div className={`flex-1 flex flex-col text-left ${reserveTopSpace ? 'px-4 pb-4 pt-10' : 'p-4'}`}>
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {name}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
        )}
        <div className="mt-auto flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>{t('cardCount', { count: cardCount })}</span>
        </div>
      </div>
    </button>
  );
}
