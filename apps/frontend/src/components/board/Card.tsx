'use client';

import { Card as CardType } from '@/hooks/useBoard';

interface CardProps {
  card: CardType;
  onClick?: () => void;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

const priorityLabels = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
};

export default function Card({ card, onClick }: CardProps) {
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && !card.completedAt;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group"
    >
      {/* Color indicator */}
      {card.color && (
        <div
          className="w-full h-1 rounded-full mb-2"
          style={{ backgroundColor: card.color }}
        />
      )}

      {/* Title */}
      <h4 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
        {card.title}
      </h4>

      {/* Description preview */}
      {card.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {card.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{card.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        {/* Priority */}
        <span className={`px-1.5 py-0.5 text-xs rounded ${priorityColors[card.priority]}`}>
          {priorityLabels[card.priority]}
        </span>

        {/* Due date */}
        {card.dueDate && (
          <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {new Date(card.dueDate).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  );
}
