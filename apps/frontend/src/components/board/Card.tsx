'use client';

import { BoardMember, Card as CardType } from '@/hooks/useBoard';
import { getAvatarImageSrc } from '@/lib/avatar';

interface CardProps {
  card: CardType;
  members?: BoardMember[];
  owner?: { id: string; nickname: string; email: string; avatar?: string };
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

export default function Card({ card, members, owner, onClick }: CardProps) {
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && !card.completedAt;
  const assignedIds = card.assigneeIds && card.assigneeIds.length > 0
    ? card.assigneeIds
    : (card.assigneeId ? [card.assigneeId] : []);

  const memberUsers = (members || [])
    .map((member) => member.user)
    .filter(Boolean) as Array<{ id: string; nickname: string; email: string; avatar?: string }>;

  const userMap = new Map(memberUsers.map((u) => [u.id, u]));
  if (owner) {
    userMap.set(owner.id, owner);
  }

  const assignees = assignedIds
    .map((id) => userMap.get(id))
    .filter(Boolean) as Array<{ id: string; nickname: string; email: string; avatar?: string }>;

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

      {/* Assignees */}
      {assignees.length > 0 && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((assignee) => {
              const avatarSrc = getAvatarImageSrc(assignee.avatar, assignee.nickname);
              return avatarSrc ? (
                <img
                  key={assignee.id}
                  src={avatarSrc}
                  alt={assignee.nickname}
                  title={assignee.nickname}
                  className="w-6 h-6 rounded-full object-cover border-2 border-white bg-white shadow-sm"
                />
              ) : (
                <div
                  key={assignee.id}
                  title={assignee.nickname}
                  className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center shadow-sm"
                >
                  {assignee.nickname.charAt(0).toUpperCase()}
                </div>
              );
            })}
            {assignees.length > 3 && (
              <div
                title={`외 ${assignees.length - 3}명`}
                className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 text-gray-700 text-[10px] font-semibold flex items-center justify-center shadow-sm"
              >
                +{assignees.length - 3}
              </div>
            )}
          </div>
          <span className="text-[11px] text-gray-400">
            담당 {assignees.length}명
          </span>
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
