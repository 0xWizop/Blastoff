'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Token } from '@/types';
import { CoinCard } from '@/components/CoinCard';
import { FullPageLoader } from '@/components/Spinner';
import { CoinCardSkeleton } from '@/components/Skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface CreatorStats {
  totalTokens: number;
  totalVolume: number;
  totalMarketCap: number;
  successRate: number;
  firstLaunch: number | null;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

function formatTimeAgo(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function CreatorPage() {
  const params = useParams();
  const address = params.address as string;
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/creators/${address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch creator data');
        }
        const data = await response.json();
        setTokens(data.tokens || []);
        setStats(data.stats || null);
      } catch (err) {
        // API not implemented yet
        setError('Creator profiles require backend integration');
        setTokens([]);
        setStats({
          totalTokens: 0,
          totalVolume: 0,
          totalMarketCap: 0,
          successRate: 0,
          firstLaunch: null,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [address]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Link */}
      <Link
        href="/app"
        className="mb-4 inline-flex items-center gap-2 text-sm text-blastoff-text-secondary transition-colors hover:text-blastoff-text"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      {/* Creator Header */}
      <div className="border border-blastoff-border bg-blastoff-surface p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 bg-gradient-to-br from-blastoff-orange to-orange-600 flex items-center justify-center text-2xl font-bold text-white">
              {address.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-blastoff-text sm:text-2xl">
                Creator Profile
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm text-blastoff-text-secondary">
                  {address.slice(0, 10)}...{address.slice(-8)}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-blastoff-text-muted hover:text-blastoff-orange transition-colors"
                  title="Copy address"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <a
                  href={`https://basescan.org/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blastoff-text-muted hover:text-blastoff-orange transition-colors"
                  title="View on BaseScan"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Reputation Badge */}
          {stats && (
            <div className={`px-4 py-2 ${
              stats.successRate >= 80 ? 'bg-green-500/20 border-green-500/50' :
              stats.successRate >= 50 ? 'bg-yellow-500/20 border-yellow-500/50' :
              'bg-red-500/20 border-red-500/50'
            } border`}>
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">Reputation</p>
              <p className={`text-lg font-bold ${
                stats.successRate >= 80 ? 'text-green-500' :
                stats.successRate >= 50 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {stats.successRate >= 80 ? 'Trusted' : stats.successRate >= 50 ? 'Mixed' : 'Caution'}
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-blastoff-bg p-3">
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">Tokens Created</p>
              <p className="text-xl font-bold text-blastoff-text">{stats.totalTokens}</p>
            </div>
            <div className="bg-blastoff-bg p-3">
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">Total Volume</p>
              <p className="text-xl font-bold text-blastoff-text">{formatNumber(stats.totalVolume)}</p>
            </div>
            <div className="bg-blastoff-bg p-3">
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">Combined MCap</p>
              <p className="text-xl font-bold text-blastoff-text">{formatNumber(stats.totalMarketCap)}</p>
            </div>
            <div className="bg-blastoff-bg p-3">
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">First Launch</p>
              <p className="text-xl font-bold text-blastoff-text">
                {stats.firstLaunch ? formatTimeAgo(stats.firstLaunch) : '--'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tokens Created */}
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-blastoff-text mb-4">
          Tokens by this Creator ({tokens.length})
        </h2>
        
        {tokens.length === 0 ? (
          <div className="border border-blastoff-border bg-blastoff-surface p-8 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-blastoff-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-blastoff-text-secondary">No tokens found</p>
            <p className="mt-1 text-xs text-blastoff-text-muted">
              {error || 'This creator has not launched any tokens yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tokens.map((token) => (
              <CoinCard key={token.address} token={token} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
