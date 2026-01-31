'use client';

import { useState, useEffect } from 'react';
import { Spinner } from './Spinner';

interface Holder {
  address: string;
  balance: number;
  percentage: number;
  label?: string; // 'Creator', 'LP', 'Whale', etc.
}

interface HolderDistributionProps {
  tokenAddress: string;
  tokenSymbol: string;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}

function shortenAddress(address: string): string {
  if (address === 'Others' || address.includes('...')) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const COLORS = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-cyan-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-gray-500',
];

export function HolderDistribution({ tokenAddress, tokenSymbol }: HolderDistributionProps) {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalHolders, setTotalHolders] = useState(0);

  useEffect(() => {
    const loadHolders = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/tokens/${tokenAddress}/holders`);
        if (!response.ok) {
          throw new Error('Failed to fetch holders');
        }
        const data = await response.json();
        setHolders(data.holders || []);
        setTotalHolders(data.totalHolders || 0);
      } catch (err) {
        // API not implemented yet
        setError('Holder data requires backend integration');
        setHolders([]);
        setTotalHolders(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHolders();
  }, [tokenAddress]);

  // Calculate concentration metrics
  const top10Pct = holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
  const isConcentrated = top10Pct > 80;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full border border-blastoff-border bg-blastoff-surface p-4">
        <Spinner size="md" />
      </div>
    );
  }

  // Show empty/error state
  if (error || holders.length === 0) {
    return (
      <div className="h-full border border-blastoff-border bg-blastoff-surface flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-blastoff-border">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-blastoff-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-blastoff-text">Holders</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <svg className="mb-3 h-10 w-10 text-blastoff-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-blastoff-text-secondary">No holder data available</p>
          <p className="mt-1 text-xs text-blastoff-text-muted">{error || 'Check back soon'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border border-blastoff-border bg-blastoff-surface flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-blastoff-border">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-blastoff-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium text-blastoff-text">Holders</span>
        </div>
        <span className="text-xs text-blastoff-text-secondary">
          {totalHolders.toLocaleString()} total
        </span>
      </div>

      {/* Distribution Bar */}
      <div className="shrink-0 px-3 py-2 border-b border-blastoff-border">
        <div className="flex h-3 overflow-hidden rounded-sm">
          {holders.slice(0, 10).map((holder, i) => (
            <div
              key={holder.address}
              className={`${COLORS[i]} transition-all`}
              style={{ width: `${holder.percentage}%` }}
              title={`${shortenAddress(holder.address)}: ${holder.percentage.toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px]">
          <span className="text-blastoff-text-muted">Top 10 hold {top10Pct.toFixed(1)}%</span>
          {isConcentrated && (
            <span className="text-yellow-500 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Concentrated
            </span>
          )}
        </div>
      </div>

      {/* Holder List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {holders.map((holder, i) => (
          <div
            key={holder.address}
            className="flex items-center justify-between px-3 py-2 border-b border-blastoff-border/30 hover:bg-blastoff-bg/50"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-sm ${COLORS[i] || 'bg-gray-600'}`} />
              <div>
                <div className="flex items-center gap-1.5">
                  {holder.address === 'Others' ? (
                    <span className="text-xs text-blastoff-text">Others</span>
                  ) : (
                    <a
                      href={`https://basescan.org/address/${holder.address.split('...')[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-blastoff-text hover:text-blastoff-orange transition-colors"
                    >
                      {shortenAddress(holder.address)}
                    </a>
                  )}
                  {holder.label && (
                    <span className={`text-[9px] px-1.5 py-0.5 ${
                      holder.label === 'Creator' ? 'bg-purple-500/20 text-purple-400' :
                      holder.label === 'LP' ? 'bg-blue-500/20 text-blue-400' :
                      holder.label === 'Whale' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blastoff-border text-blastoff-text-muted'
                    }`}>
                      {holder.label}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-blastoff-text-muted">
                  {formatNumber(holder.balance)} {tokenSymbol}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-blastoff-text">
                {holder.percentage.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
