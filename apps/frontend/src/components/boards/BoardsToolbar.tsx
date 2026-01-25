'use client';

import SearchBar from '@/components/ui/SearchBar';
import SortDropdown from '@/components/ui/SortDropdown';

export type SortOption = 'name' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';
export type FilterOption = 'all' | 'owned' | 'shared' | 'archived' | 'templates' | 'favorites';
export type ViewMode = 'grid' | 'list';

const sortOptions = [
  { value: 'updatedAt' as const, label: '최근 수정' },
  { value: 'createdAt' as const, label: '생성일' },
  { value: 'name' as const, label: '이름' },
];

interface BoardsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  sortDirection: SortDirection;
  onSortDirectionToggle: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateClick: () => void;
}

export default function BoardsToolbar({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionToggle,
  viewMode,
  onViewModeChange,
  onCreateClick,
}: BoardsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="보드 검색..."
      />

      {/* Filter */}
      <select
        value={filter}
        onChange={(e) => onFilterChange(e.target.value as FilterOption)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        <option value="all">모든 보드</option>
        <option value="favorites">즐겨찾기</option>
        <option value="owned">내가 만든 보드</option>
        <option value="shared">공유된 보드</option>
        <option value="archived">보관된 보드</option>
        <option value="templates">템플릿</option>
      </select>

      {/* Sort */}
      <SortDropdown
        options={sortOptions}
        value={sortBy}
        onChange={onSortByChange}
        direction={sortDirection}
        onDirectionToggle={onSortDirectionToggle}
      />

      {/* View Mode Toggle */}
      <div className="flex border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 transition-colors ${
            viewMode === 'grid'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          title="그리드 보기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 transition-colors ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          title="리스트 보기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Create Button */}
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        새 보드
      </button>
    </div>
  );
}
