'use client';

import { useMemo } from 'react';
import { useTokens } from '@/hooks/useTokens';

export function PlatformStats() {
  const { data: tokens } = useTokens({ status: 'ALL', sort: 'marketCap', search: '' });

  const stats = useMemo(() => {
    const list = tokens || [];
    const totalLaunches = list.length;
    const volume24h = list.reduce((sum, t) => sum + (t.volume24h || 0), 0);
    const totalMarketCap = list.reduce((sum, t) => sum + (t.marketCap || 0), 0);

    return {
      totalLaunches,
      volume24h,
      totalMarketCap,
    };
  }, [tokens]);

  return (
    <div className="mb-6 grid gap-4 border border-blastoff-border bg-blastoff-surface p-4 sm:grid-cols-3">
      <div className="bg-blastoff-bg p-4">
        <p className="text-xs text-blastoff-text-muted">Total Launches</p>
        <p className="font-mono text-xl font-semibold text-blastoff-text">{stats.totalLaunches}</p>
      </div>
      <div className="bg-blastoff-bg p-4">
        <p className="text-xs text-blastoff-text-muted">Platform Volume (24h)</p>
        <p className="font-mono text-xl font-semibold text-blastoff-text">${stats.volume24h.toLocaleString()}</p>
      </div>
      <div className="bg-blastoff-bg p-4">
        <p className="text-xs text-blastoff-text-muted">Total Market Cap</p>
        <p className="font-mono text-xl font-semibold text-blastoff-text">${stats.totalMarketCap.toLocaleString()}</p>
      </div>
    </div>
  );
}
