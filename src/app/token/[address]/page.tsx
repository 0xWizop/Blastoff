'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useToken } from '@/hooks/useTokens';
import { SwapPanel } from '@/components/SwapPanel';
import { UserPosition } from '@/components/UserPosition';
import { Skeleton } from '@/components/Skeleton';
import { InlineLoader, FullPageLoader } from '@/components/Spinner';

const TokenChart = dynamic(
  () => import('@/components/TokenChart').then((mod) => mod.TokenChart),
  {
    loading: () => <Skeleton className="h-[468px] w-full " />,
    ssr: false,
  }
);

function formatTimeRemaining(endTime: number): string {
  const now = Date.now();
  const diff = endTime - now;
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function TokenPage() {
  const params = useParams();
  const address = params.address as string;
  const { data: token, isLoading, error } = useToken(address);
  const [activePanel, setActivePanel] = useState<'swap' | 'position'>('swap');

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (error || !token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/app"
          className="mb-6 inline-flex items-center gap-2 text-blastoff-text-secondary transition-colors hover:text-blastoff-text"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to launches
        </Link>
        <div className="flex h-64 items-center justify-center  border border-blastoff-border bg-blastoff-surface">
          <div className="text-center">
            <p className="text-lg text-blastoff-text">Token not found</p>
            <p className="text-sm text-blastoff-text-muted">
              The token you&apos;re looking for doesn&apos;t exist
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-[calc(100vh-4rem)] flex-col overflow-hidden px-4 py-4">
      <Link
        href="/app"
        className="mb-3 inline-flex items-center gap-2 text-blastoff-text-secondary transition-colors hover:text-blastoff-text"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to launches
      </Link>

      <div className="shrink-0 border border-blastoff-border bg-blastoff-surface p-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center  bg-blastoff-orange/20 text-2xl font-bold text-blastoff-orange">
              {token.symbol.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-blastoff-text">
                  {token.symbol}
                </h1>
              </div>
              <p className="text-blastoff-text-secondary">{token.name}</p>
              <p className="mt-1 font-mono text-xs text-blastoff-text-muted">
                {address.slice(0, 10)}...{address.slice(-8)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {token.website && (
              <a
                href={token.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center  border border-blastoff-border bg-blastoff-bg text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-orange"
                title="Website"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
            )}
            {token.twitter && (
              <a
                href={`https://twitter.com/${token.twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center  border border-blastoff-border bg-blastoff-bg text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-orange"
                title="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {token.telegram && (
              <a
                href={`https://t.me/${token.telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center  border border-blastoff-border bg-blastoff-bg text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-orange"
                title="Telegram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            )}
            {token.discord && (
              <a
                href={token.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center  border border-blastoff-border bg-blastoff-bg text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-orange"
                title="Discord"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className=" bg-blastoff-bg p-4">
            <p className="text-xs text-blastoff-text-muted">Market Cap</p>
            <p className="font-mono text-xl font-semibold text-blastoff-text">
              ${(token.marketCap || 0).toLocaleString()}
            </p>
          </div>
          <div className=" bg-blastoff-bg p-4">
            <p className="text-xs text-blastoff-text-muted">24h Volume</p>
            <p className="font-mono text-xl font-semibold text-blastoff-text">
              ${(token.volume24h || 0).toLocaleString()}
            </p>
          </div>
          <div className=" bg-blastoff-bg p-4">
            <p className="text-xs text-blastoff-text-muted">Price</p>
            <p className="font-mono text-xl font-semibold text-blastoff-text">
              ${token.price.toFixed(6)}
            </p>
          </div>
          <div className=" bg-blastoff-bg p-4">
            <p className="text-xs text-blastoff-text-muted">24h Change</p>
            <p className={`font-mono text-xl font-semibold ${(token.priceChange24h || 0) >= 0 ? 'text-blastoff-success' : 'text-blastoff-error'}`}>
              {(token.priceChange24h || 0) >= 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
            </p>
          </div>
        </div>

        
        {token.description && (
          <div className="mt-6">
            <p className="text-sm text-blastoff-text-secondary">{token.description}</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid flex-1 min-h-0 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="h-full min-h-0">
          <TokenChart address={address} />
        </div>

        <div className="flex h-full min-h-0 flex-col">
          <div className="mb-3 flex shrink-0 bg-blastoff-bg p-1">
            <button
              onClick={() => setActivePanel('swap')}
              className={`flex-1 py-2 text-sm font-medium transition-all ${
                activePanel === 'swap'
                  ? 'bg-blastoff-orange text-white'
                  : 'text-blastoff-text-secondary hover:text-blastoff-text'
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActivePanel('position')}
              className={`flex-1 py-2 text-sm font-medium transition-all ${
                activePanel === 'position'
                  ? 'bg-blastoff-orange text-white'
                  : 'text-blastoff-text-secondary hover:text-blastoff-text'
              }`}
            >
              Position
            </button>
          </div>

          <div className="min-h-0 flex-1">
            {activePanel === 'swap' ? (
              <SwapPanel token={token} />
            ) : (
              <UserPosition tokenAddress={address} tokenSymbol={token.symbol} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
