'use client';

import Link from 'next/link';
import { useTrendingTokens } from '@/hooks/useTokens';
import { InlineLoader } from './Spinner';

interface TrendingTokensProps {
  variant?: 'default' | 'horizontal';
}

export function TrendingTokens({ variant = 'default' }: TrendingTokensProps) {
  const { data: tokens, isLoading } = useTrendingTokens();

  if (isLoading) {
    return (
      <div className="border border-blastoff-border bg-blastoff-surface p-4">
        <h2 className="mb-4 font-display text-base font-semibold text-blastoff-text sm:text-lg">
          Trending
        </h2>
        <div className="flex items-center justify-center py-6">
          <InlineLoader />
        </div>
      </div>
    );
  }

  // Horizontal variant for mobile
  if (variant === 'horizontal') {
    return (
      <div className="border border-blastoff-border bg-blastoff-surface p-3">
        <h2 className="mb-3 font-display text-base font-semibold text-blastoff-text">
          Trending
        </h2>
        <div className="-mx-3 overflow-x-auto px-3">
          <div className="flex gap-3">
            {tokens?.map((token, index) => (
              <Link
                key={token.address}
                href={`/token/${token.address}`}
                className="flex min-w-[140px] shrink-0 flex-col gap-1 border border-blastoff-border bg-blastoff-bg p-3 transition-all active:border-blastoff-orange"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center bg-blastoff-orange/20 text-[10px] font-bold text-blastoff-orange">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-blastoff-text">{token.symbol}</span>
                </div>
                <p className="font-mono text-xs text-blastoff-text-secondary">
                  ${(token.marketCap || 0).toLocaleString()}
                </p>
                <p className={`font-mono text-xs ${(token.priceChange24h || 0) >= 0 ? 'text-blastoff-success' : 'text-blastoff-error'}`}>
                  {(token.priceChange24h || 0) >= 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default vertical variant
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
              <p className="font-mono text-sm text-blastoff-text">
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
