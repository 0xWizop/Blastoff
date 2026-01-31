'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FilterState, SortOption } from '@/types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'marketCap', label: 'Market Cap' },
  { value: 'volume24h', label: '24h Volume' },
  { value: 'newest', label: 'Newest' },
];

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    onFilterChange(updated);

    const params = new URLSearchParams(searchParams.toString());
    if (updated.sort !== 'marketCap') {
      params.set('sort', updated.sort);
    } else {
      params.delete('sort');
    }

    if (updated.search) {
      params.set('search', updated.search);
    } else {
      params.delete('search');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="border border-blastoff-border bg-blastoff-surface p-3 sm:p-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search tokens..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="w-full border border-blastoff-border bg-blastoff-bg px-4 py-2.5 pr-10 text-sm text-blastoff-text placeholder-blastoff-text-muted outline-none transition-all focus:border-blastoff-orange focus:ring-1 focus:ring-blastoff-orange sm:py-2"
        />
        <svg
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blastoff-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Sort Options - Horizontal scroll on mobile */}
      <div className="-mx-3 mt-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilters({ sort: option.value })}
              className={`shrink-0 px-4 py-2 text-sm font-medium transition-all ${
                filters.sort === option.value
                  ? 'bg-blastoff-orange text-white'
                  : 'bg-blastoff-bg text-blastoff-text-secondary active:bg-blastoff-border sm:hover:bg-blastoff-border sm:hover:text-blastoff-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
