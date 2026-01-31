'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTokens } from '@/hooks/useTokens';

export function TopMoversTicker() {
  const { data: tokens } = useTokens({ status: 'ALL', sort: 'marketCap', search: '' });

  const movers = useMemo(() => {
    const list = (tokens || []).slice();
    list.sort((a, b) => Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0));
    return list.slice(0, 10);
  }, [tokens]);

  return (
    <div className="mb-4 overflow-hidden border border-blastoff-border bg-blastoff-surface sm:mb-6">
      <div className="flex items-center gap-2 border-b border-blastoff-border bg-blastoff-bg px-3 py-1.5 sm:gap-3 sm:px-4 sm:py-2">
        <span className="font-display text-xs text-blastoff-text sm:text-sm">Top Movers</span>
        <span className="text-[10px] text-blastoff-text-muted sm:text-xs">(24h)</span>
      </div>
      <div className="relative">
        <div className="flex w-max animate-[marquee_28s_linear_infinite] items-center gap-4 px-3 py-2 sm:gap-6 sm:px-4 sm:py-3">
          {movers.map((t) => (
            <Link key={t.address} href={`/token/${t.address}`} className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-medium text-blastoff-text sm:text-sm">{t.symbol}</span>
              <span className={`font-mono text-xs sm:text-sm ${(t.priceChange24h || 0) >= 0 ? 'text-blastoff-success' : 'text-blastoff-error'}`}>
                {(t.priceChange24h || 0) >= 0 ? '+' : ''}{(t.priceChange24h || 0).toFixed(2)}%
              </span>
              <span className="hidden text-[10px] text-blastoff-text-muted sm:inline sm:text-xs">VOL ${((t.volume24h || 0) / 1000).toFixed(0)}K</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
