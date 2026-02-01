'use client';

import SearchBar from '@/components/ui/SearchBar';

export type FilterOption = 'all' | 'friends' | 'collaborators';

interface FriendsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  onAddFriendClick: () => void;
  pendingRequestsCount?: number;
  onRequestsClick?: () => void;
}

export default function FriendsToolbar({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  onAddFriendClick,
  pendingRequestsCount = 0,
  onRequestsClick,
}: FriendsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="연락처 검색..."
      />

      {/* Filter Tabs */}
      <div className="flex border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => onFilterChange('friends')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
            filter === 'friends'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          친구
        </button>
        <button
          onClick={() => onFilterChange('collaborators')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
            filter === 'collaborators'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          협업자
        </button>
      </div>

      {/* Pending Requests Button */}
      {pendingRequestsCount > 0 && (
        <button
          onClick={onRequestsClick}
          className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          대기 중인 요청
          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
            {pendingRequestsCount}
          </span>
        </button>
      )}

      {/* Add Friend Button */}
      <button
        onClick={onAddFriendClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        친구 추가
      </button>
    </div>
  );
}
