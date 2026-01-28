'use client';

import Link from 'next/link';
import { useTrendingTokens } from '@/hooks/useTokens';
import { InlineLoader } from './Spinner';

export function TrendingTokens() {
  const { data: tokens, isLoading } = useTrendingTokens();

  if (isLoading) {
    return (
      <div className="border border-blastoff-border bg-blastoff-surface p-4">
        <h2 className="mb-4 font-display text-lg font-semibold text-blastoff-text">
          Trending
        </h2>
        <div className="flex items-center justify-center py-8">
          <InlineLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-blastoff-border bg-blastoff-surface p-4">
      <h2 className="mb-4 font-display text-lg font-semibold text-blastoff-text">
        Trending
      </h2>
      <div className="space-y-2">
        {tokens?.map((token, index) => (
          <Link
            key={token.address}
            href={`/token/${token.address}`}
            className="group flex items-center gap-3 p-2 transition-all hover:bg-blastoff-bg"
          >
            <span className="flex h-6 w-6 items-center justify-center bg-blastoff-orange/20 text-xs font-bold text-blastoff-orange">
              {index + 1}
            </span>
            <div className="flex h-8 w-8 items-center justify-center bg-blastoff-border text-sm font-bold text-blastoff-text">
              {token.symbol.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blastoff-text group-hover:text-blastoff-orange">
                {token.symbol}
              </p>
              <p className="text-xs text-blastoff-text-muted">{token.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-blastoff-text">
                ${(token.marketCap || 0).toLocaleString()}
              </p>
              <p className={`text-xs ${(token.priceChange24h || 0) >= 0 ? 'text-blastoff-success' : 'text-blastoff-error'}`}>
                {(token.priceChange24h || 0) >= 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
