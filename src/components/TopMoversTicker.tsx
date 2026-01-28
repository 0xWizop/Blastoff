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
    <div className="mb-6 overflow-hidden border border-blastoff-border bg-blastoff-surface">
      <div className="flex items-center gap-3 border-b border-blastoff-border bg-blastoff-bg px-4 py-2">
        <span className="font-display text-sm text-blastoff-text">Top Movers</span>
        <span className="text-xs text-blastoff-text-muted">(24h)</span>
      </div>
      <div className="relative">
        <div className="flex w-max animate-[marquee_28s_linear_infinite] items-center gap-6 px-4 py-3">
          {movers.map((t) => (
            <Link key={t.address} href={`/token/${t.address}`} className="flex items-center gap-2">
              <span className="text-sm font-medium text-blastoff-text">{t.symbol}</span>
              <span className={`text-sm font-mono ${(t.priceChange24h || 0) >= 0 ? 'text-blastoff-success' : 'text-blastoff-error'}`}>
                {(t.priceChange24h || 0) >= 0 ? '+' : ''}{(t.priceChange24h || 0).toFixed(2)}%
              </span>
              <span className="text-xs text-blastoff-text-muted">VOL ${((t.volume24h || 0) / 1000).toFixed(0)}K</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
