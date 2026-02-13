'use client';

import { useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTokensPaginated } from '@/hooks/useTokens';
import { FilterState, SortOption } from '@/types';
import { FilterBar } from '@/components/FilterBar';
import { CoinCard } from '@/components/CoinCard';
import { TrendingTokens } from '@/components/TrendingTokens';
import { TopMoversTicker } from '@/components/TopMoversTicker';
import { PlatformStats } from '@/components/PlatformStats';
import { CoinCardSkeleton, Skeleton } from '@/components/Skeleton';
import { PullToRefresh } from '@/components/PullToRefresh';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CoinFeedContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const sortParam = searchParams.get('sort');
  const safeSort =
    sortParam === 'marketCap' || sortParam === 'volume24h' || sortParam === 'newest'
      ? (sortParam as SortOption)
      : undefined;
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'ALL',
    sort: safeSort || 'newest',
    search: searchParams.get('search') || '',
  });

  const [currentPage, setCurrentPage] = useState(1);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useTokensPaginated(filters, currentPage);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['tokensPaginated'] });
    await queryClient.invalidateQueries({ queryKey: ['trendingTokens'] });
    toast.success('Feed refreshed!');
  }, [queryClient]);

  const tokens = data?.tokens ?? [];
  const totalTokens = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      // Show all pages if there aren't many
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      
      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <TopMoversTicker />
        
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-1 font-display text-2xl font-bold text-blastoff-text sm:mb-2 sm:text-3xl">
            Fair Launches
          </h1>
          <p className="text-sm text-blastoff-text-secondary sm:text-base">
            Discover the latest fair launches on Base—Uniswap & Aerodrome. No presales.
          </p>
        </div>

        <PlatformStats />

        {/* Trending - Shows horizontally on mobile, sidebar on desktop */}
        <div className="mb-6 lg:hidden">
          <Suspense fallback={<Skeleton className="h-32" />}>
            <TrendingTokens variant="horizontal" />
          </Suspense>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:gap-8">
          <div>
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />
            
            {isLoading ? (
              <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <CoinCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="mt-4 flex h-48 flex-col items-center justify-center border border-red-500/30 bg-red-500/5 sm:mt-6 sm:h-64">
                <svg className="mb-3 h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-base text-red-400">Failed to load tokens</p>
                <p className="mb-3 text-xs text-blastoff-text-muted">
                  {error instanceof Error ? error.message : 'Please try again'}
                </p>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['tokensPaginated'] })}
                  className="border border-blastoff-border bg-blastoff-bg px-4 py-2 text-sm text-blastoff-text-secondary hover:text-blastoff-text"
                >
                  Retry
                </button>
              </div>
            ) : tokens.length > 0 ? (
              <>
                {/* Token count and page info */}
                <div className="mt-4 mb-3 flex items-center justify-between text-xs text-blastoff-text-muted sm:mt-6">
                  <span>
                    Showing {(currentPage - 1) * 12 + 1}-{Math.min(currentPage * 12, totalTokens)} of {totalTokens} tokens
                  </span>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>
                
                {/* Token grid with loading overlay when fetching */}
                <div className={`relative ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    {tokens.map((token) => (
                      <CoinCard key={token.address} token={token} />
                    ))}
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-1 sm:gap-2">
                    {/* Previous button */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex h-9 w-9 items-center justify-center border border-blastoff-border bg-blastoff-surface text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-blastoff-border disabled:hover:text-blastoff-text-secondary sm:h-10 sm:w-10"
                      aria-label="Previous page"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, idx) => 
                        page === 'ellipsis' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-blastoff-text-muted">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`flex h-9 w-9 items-center justify-center border text-sm font-medium transition-all sm:h-10 sm:w-10 ${
                              currentPage === page
                                ? 'border-blastoff-orange bg-blastoff-orange text-white'
                                : 'border-blastoff-border bg-blastoff-surface text-blastoff-text-secondary hover:border-blastoff-orange hover:text-blastoff-text'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    {/* Next button */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex h-9 w-9 items-center justify-center border border-blastoff-border bg-blastoff-surface text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-blastoff-border disabled:hover:text-blastoff-text-secondary sm:h-10 sm:w-10"
                      aria-label="Next page"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4 flex h-48 items-center justify-center border border-blastoff-border bg-blastoff-surface sm:mt-6 sm:h-64">
                <div className="text-center">
                  <svg className="mx-auto mb-3 h-10 w-10 text-blastoff-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-base text-blastoff-text-secondary sm:text-lg">No tokens found</p>
                  <p className="text-xs text-blastoff-text-muted sm:text-sm">
                    {filters.search ? 'Try a different search term' : 'Check back soon for new launches'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Trending sidebar - Desktop only */}
          <aside className="hidden space-y-6 lg:block">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <TrendingTokens />
            </Suspense>
          </aside>
        </div>
      </div>
    </PullToRefresh>
  );
}

export default function AppPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="mb-1 h-7 w-40 animate-pulse rounded bg-blastoff-border sm:mb-2 sm:h-9 sm:w-48" />
            <div className="h-4 w-56 animate-pulse rounded bg-blastoff-border sm:h-5 sm:w-72" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:gap-8">
            <div>
              <div className="h-24 animate-pulse bg-blastoff-border sm:h-16" />
              <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <CoinCardSkeleton key={i} />
                ))}
              </div>
            </div>
            <aside className="hidden lg:block">
              <div className="h-80 animate-pulse bg-blastoff-border" />
            </aside>
          </div>
        </div>
      }>
        <CoinFeedContent />
      </Suspense>
    </ErrorBoundary>
  );
}
