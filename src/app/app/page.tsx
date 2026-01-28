'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTokens } from '@/hooks/useTokens';
import { FilterState, SortOption } from '@/types';
import { FilterBar } from '@/components/FilterBar';
import { CoinCard } from '@/components/CoinCard';
import { TrendingTokens } from '@/components/TrendingTokens';
import { TopMoversTicker } from '@/components/TopMoversTicker';
import { PlatformStats } from '@/components/PlatformStats';
import { CoinCardSkeleton, Skeleton } from '@/components/Skeleton';
import { InlineLoader } from '@/components/Spinner';

function CoinFeedContent() {
  const searchParams = useSearchParams();
  const sortParam = searchParams.get('sort');
  const safeSort =
    sortParam === 'marketCap' || sortParam === 'volume24h' || sortParam === 'newest'
      ? (sortParam as SortOption)
      : undefined;
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'ALL',
    sort: safeSort || 'marketCap',
    search: searchParams.get('search') || '',
  });

  const { data: tokens, isLoading } = useTokens(filters);

  return (
    <div className="container mx-auto px-4 py-8">
      <TopMoversTicker />
      <div className="mb-8">
        <h1 className="mb-2 font-display text-3xl font-bold text-blastoff-text">
          Fair Launches
        </h1>
        <p className="text-blastoff-text-secondary">
          Discover the latest fair launches on Base
        </p>
      </div>

      <PlatformStats />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <FilterBar filters={filters} onFilterChange={setFilters} />
          
          {isLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <CoinCardSkeleton key={i} />
              ))}
            </div>
          ) : tokens && tokens.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {tokens.map((token) => (
                <CoinCard key={token.address} token={token} />
              ))}
            </div>
          ) : (
            <div className="mt-6 flex h-64 items-center justify-center rounded-xl border border-blastoff-border bg-blastoff-surface">
              <div className="text-center">
                <p className="text-lg text-blastoff-text-secondary">No tokens found</p>
                <p className="text-sm text-blastoff-text-muted">
                  Try adjusting your filters
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <TrendingTokens />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-2 h-9 w-48 animate-pulse rounded bg-blastoff-border" />
          <div className="h-5 w-72 animate-pulse rounded bg-blastoff-border" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="h-16 animate-pulse rounded-xl bg-blastoff-border" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <CoinCardSkeleton key={i} />
              ))}
            </div>
          </div>
          <aside>
            <div className="h-80 animate-pulse rounded-xl bg-blastoff-border" />
          </aside>
        </div>
      </div>
    }>
      <CoinFeedContent />
    </Suspense>
  );
}
