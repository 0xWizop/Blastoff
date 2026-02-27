'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FilterState, SortOption } from '@/types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'marketCap', label: 'Market Cap' },
  { value: 'volume24h', label: '24h Volume' },
  { value: 'priceChange24h', label: '24h Change' },
];

const SEARCH_URL_DEBOUNCE_MS = 400;

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchUrlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushUrl = useCallback(
    (updated: FilterState) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updated.sort !== 'newest') {
        params.set('sort', updated.sort);
      } else {
        params.delete('sort');
      }
      if (updated.search.trim()) {
        params.set('search', updated.search.trim());
      } else {
        params.delete('search');
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    return () => {
      if (searchUrlTimeoutRef.current) clearTimeout(searchUrlTimeoutRef.current);
    };
  }, []);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    onFilterChange(updated);

    const searchChanged = newFilters.search !== undefined;
    if (searchChanged) {
      if (searchUrlTimeoutRef.current) clearTimeout(searchUrlTimeoutRef.current);
      searchUrlTimeoutRef.current = setTimeout(() => {
        searchUrlTimeoutRef.current = null;
        pushUrl(updated);
      }, SEARCH_URL_DEBOUNCE_MS);
    } else {
      pushUrl(updated);
    }
  };

  const hasActiveFilters = filters.search.trim() !== '' || filters.sort !== 'newest';

  const clearFilters = () => {
    updateFilters({ search: '', sort: 'newest' });
  };

  const sortCellClass =
    'flex h-10 items-center justify-center px-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/90 transition-colors';
  const sortActiveClass = 'bg-blastoff-orange text-white';
  const sortInactiveClass = 'hover:bg-blastoff-orange';

  return (
    <div className="border border-blastoff-separator bg-blastoff-surface">
      {/* Search row - divide-x so only one line between input and Clear */}
      <div className="flex divide-x divide-blastoff-separator">
        <div className="relative flex min-w-0 flex-1">
          <input
            type="text"
            placeholder="Search tokens..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full border-0 bg-transparent px-4 py-3 pr-10 text-sm text-blastoff-text placeholder-blastoff-text-muted outline-none transition-colors focus:bg-blastoff-bg/50 focus:ring-0"
          />
          <svg
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blastoff-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex shrink-0 items-center px-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/90 transition-colors hover:bg-blastoff-orange"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sort row - full width, equal cells */}
      <div className="flex divide-x divide-blastoff-separator border-t border-blastoff-separator">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => updateFilters({ sort: option.value })}
            className={`${sortCellClass} min-w-0 flex-1 ${filters.sort === option.value ? sortActiveClass : sortInactiveClass}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
