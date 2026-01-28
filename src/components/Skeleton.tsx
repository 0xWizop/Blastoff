'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-blastoff-border ${className}`}
    />
  );
}

export function CoinCardSkeleton() {
  return (
    <div className="border border-blastoff-border bg-blastoff-surface p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="mb-1 h-4 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="mb-2 h-2 w-full" />
      <div className="mb-4 flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-1 h-3 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
