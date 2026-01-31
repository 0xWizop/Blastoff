'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'sonner';
import { useToken } from '@/hooks/useTokens';
import { SwapPanel } from '@/components/SwapPanel';
import { UserPosition } from '@/components/UserPosition';
import { Skeleton } from '@/components/Skeleton';
import { FullPageLoader } from '@/components/Spinner';
import { TradesFeed } from '@/components/TradesFeed';
import { RecentTrades } from '@/components/RecentTrades';
import { TokenChat } from '@/components/TokenChat';
import { HolderDistribution } from '@/components/HolderDistribution';
import { ShareCard } from '@/components/ShareCard';

const TokenChart = dynamic(
  () => import('@/components/TokenChart').then((mod) => mod.TokenChart),
  {
    loading: () => <Skeleton className="h-[468px] w-full " />,
    ssr: false,
  }
);

type ContentTab = 'chart' | 'trades' | 'chat' | 'holders' | 'info';

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export default function TokenPage() {
  const params = useParams();
  const address = params.address as string;
  const { data: token, isLoading, error } = useToken(address);
  const [activePanel, setActivePanel] = useState<'swap' | 'position'>('swap');
  const [activeTab, setActiveTab] = useState<ContentTab>('chart');
  const [showShareCard, setShowShareCard] = useState(false);

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
    <div className="container mx-auto flex min-h-[calc(100vh-3.5rem)] flex-col px-4 py-3 sm:min-h-[calc(100vh-4rem)] sm:py-4 lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
      {/* Compact Header Bar */}
      <div className="shrink-0 mb-3 flex items-center justify-between">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm text-blastoff-text-secondary transition-colors active:text-blastoff-text sm:hover:text-blastoff-text"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-blastoff-text-secondary hover:text-blastoff-orange transition-colors border border-blastoff-border bg-blastoff-surface"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy CA
          </button>
          <button
            onClick={() => setShowShareCard(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blastoff-orange text-white hover:bg-blastoff-orange-light transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          <a
            href={`https://basescan.org/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center border border-blastoff-border bg-blastoff-surface text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-orange"
            title="View on BaseScan"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Share Card Modal */}
      {showShareCard && token && (
        <ShareCard token={token} onClose={() => setShowShareCard(false)} />
      )}

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:min-h-0">
        {/* Left Column - Token Info + Chart */}
        <div className="flex flex-col min-h-0 gap-3">
          {/* Token Info Row */}
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blastoff-border bg-blastoff-surface p-3">
            {/* Token Identity */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center bg-blastoff-orange/20 text-lg font-bold text-blastoff-orange shrink-0">
                {token.symbol.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-bold text-blastoff-text">{token.symbol}</h1>
                  <span className={`text-sm font-semibold ${(token.priceChange24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(token.priceChange24h || 0) >= 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
                  </span>
                </div>
                <p className="text-sm text-blastoff-text-secondary">{token.name}</p>
              </div>
            </div>

            {/* Price Display */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-2xl font-bold font-mono text-blastoff-text">
                  ${token.price < 0.0001 ? token.price.toExponential(2) : token.price.toFixed(6)}
                </p>
              </div>
              
              {/* Social Links */}
              <div className="flex items-center gap-1.5">
                {token.website && (
                  <a href={token.website} target="_blank" rel="noopener noreferrer" className="p-2 text-blastoff-text-muted hover:text-blastoff-orange transition-colors" title="Website">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                  </a>
                )}
                {token.telegram && (
                  <a href={`https://t.me/${token.telegram}`} target="_blank" rel="noopener noreferrer" className="p-2 text-blastoff-text-muted hover:text-blastoff-orange transition-colors" title="Telegram">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  </a>
                )}
                {token.discord && (
                  <a href={token.discord} target="_blank" rel="noopener noreferrer" className="p-2 text-blastoff-text-muted hover:text-blastoff-orange transition-colors" title="Discord">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="shrink-0 grid grid-cols-3 sm:grid-cols-6 gap-px bg-blastoff-border border border-blastoff-border">
            <div className="bg-blastoff-surface px-3 py-2">
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">MCap</p>
              <p className="font-mono text-sm font-medium text-blastoff-text">${formatCompactNumber(token.marketCap || 0)}</p>
            </div>
            <div className="bg-blastoff-surface px-3 py-2">
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">Volume</p>
              <p className="font-mono text-sm font-medium text-blastoff-text">${formatCompactNumber(token.volume24h || 0)}</p>
            </div>
            <div className="bg-blastoff-surface px-3 py-2">
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">Liquidity</p>
              <p className="font-mono text-sm font-medium text-blastoff-text">${formatCompactNumber(token.liquidity || 0)}</p>
            </div>
            <div className="bg-blastoff-surface px-3 py-2">
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">Holders</p>
              <p className="font-mono text-sm font-medium text-blastoff-text">{formatCompactNumber(token.holders || 0)}</p>
            </div>
            <div className="bg-blastoff-surface px-3 py-2">
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">Txns 24h</p>
              <p className="font-mono text-sm font-medium text-blastoff-text">{formatCompactNumber(token.txCount24h || 0)}</p>
            </div>
            <div className="bg-blastoff-surface px-3 py-2">
              <p className="text-[10px] text-blastoff-text-muted uppercase tracking-wide">Age</p>
              <p className="font-mono text-sm font-medium text-blastoff-text">{formatTimeAgo(token.startTime)}</p>
            </div>
          </div>

          {/* Description (if exists) */}
          {token.description && (
            <p className="shrink-0 text-xs text-blastoff-text-secondary px-1">{token.description}</p>
          )}

          {/* Chart/Trades/Chat/Holders Tabs + Content */}
          <div className="flex-1 flex flex-col min-h-0 border border-blastoff-border bg-blastoff-surface">
            {/* Tabs */}
            <div className="shrink-0 flex border-b border-blastoff-border overflow-x-auto">
              <button
                onClick={() => setActiveTab('chart')}
                className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'chart' ? 'text-blastoff-orange bg-blastoff-bg' : 'text-blastoff-text-secondary hover:text-blastoff-text'
                }`}
              >
                Chart
                {activeTab === 'chart' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blastoff-orange" />}
              </button>
              <button
                onClick={() => setActiveTab('trades')}
                className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'trades' ? 'text-blastoff-orange bg-blastoff-bg' : 'text-blastoff-text-secondary hover:text-blastoff-text'
                }`}
              >
                Trades
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
                {activeTab === 'trades' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blastoff-orange" />}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'chat' ? 'text-blastoff-orange bg-blastoff-bg' : 'text-blastoff-text-secondary hover:text-blastoff-text'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
                {activeTab === 'chat' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blastoff-orange" />}
              </button>
              <button
                onClick={() => setActiveTab('holders')}
                className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'holders' ? 'text-blastoff-orange bg-blastoff-bg' : 'text-blastoff-text-secondary hover:text-blastoff-text'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Holders
                {activeTab === 'holders' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blastoff-orange" />}
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'info' ? 'text-blastoff-orange bg-blastoff-bg' : 'text-blastoff-text-secondary hover:text-blastoff-text'
                }`}
              >
                Info
                {activeTab === 'info' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blastoff-orange" />}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0">
              {activeTab === 'chart' && <TokenChart address={address} />}
              {activeTab === 'trades' && <TradesFeed tokenAddress={address} tokenSymbol={token.symbol} />}
              {activeTab === 'chat' && <TokenChat tokenAddress={address} tokenSymbol={token.symbol} />}
              {activeTab === 'holders' && <HolderDistribution tokenAddress={address} tokenSymbol={token.symbol} />}
              {activeTab === 'info' && (
                <div className="h-full p-4 overflow-y-auto">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="bg-blastoff-bg p-3">
                      <h4 className="text-[10px] font-medium text-blastoff-text-muted uppercase tracking-wide mb-2">Contract</h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-blastoff-text-secondary">Address</span><span className="font-mono text-blastoff-text">{address.slice(0, 8)}...{address.slice(-6)}</span></div>
                        <div className="flex justify-between"><span className="text-blastoff-text-secondary">Network</span><span className="text-blastoff-text">Base</span></div>
                        <div className="flex justify-between"><span className="text-blastoff-text-secondary">Decimals</span><span className="text-blastoff-text">18</span></div>
                      </div>
                    </div>
                    <div className="bg-blastoff-bg p-3">
                      <h4 className="text-[10px] font-medium text-blastoff-text-muted uppercase tracking-wide mb-2">Supply</h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-blastoff-text-secondary">Total</span><span className="text-blastoff-text">1B {token.symbol}</span></div>
                        <div className="flex justify-between"><span className="text-blastoff-text-secondary">Circulating</span><span className="text-blastoff-text">1B {token.symbol}</span></div>
                        <div className="flex justify-between"><span className="text-blastoff-text-secondary">FDV</span><span className="text-blastoff-text">${formatCompactNumber((token.marketCap || 0) * 1.2)}</span></div>
                      </div>
                    </div>
                    <div className="bg-blastoff-bg p-3">
                      <h4 className="text-[10px] font-medium text-blastoff-text-muted uppercase tracking-wide mb-2">Launch</h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-blastoff-text-secondary">Date</span><span className="text-blastoff-text">{new Date(token.startTime).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span className="text-blastoff-text-secondary">Type</span><span className="text-blastoff-text">Fair Launch</span></div>
                        <div className="flex justify-between"><span className="text-blastoff-text-secondary">Initial Price</span><span className="text-blastoff-text">$0.000001</span></div>
                      </div>
                    </div>
                    <div className="bg-blastoff-bg p-3">
                      <h4 className="text-[10px] font-medium text-blastoff-text-muted uppercase tracking-wide mb-2">Links</h4>
                      <div className="flex flex-wrap gap-1.5">
                        <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-[11px] border border-blastoff-border text-blastoff-text-secondary hover:text-blastoff-orange hover:border-blastoff-orange transition-all">BaseScan</a>
                        <a href={`https://dexscreener.com/base/${address}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-[11px] border border-blastoff-border text-blastoff-text-secondary hover:text-blastoff-orange hover:border-blastoff-orange transition-all">DexScreener</a>
                        {token.website && <a href={token.website} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-[11px] border border-blastoff-border text-blastoff-text-secondary hover:text-blastoff-orange hover:border-blastoff-orange transition-all">Website</a>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Swap Panel + Trades */}
        <div className="flex flex-col min-h-0">
          {/* Swap/Position Toggle */}
          <div className="shrink-0 flex bg-blastoff-surface border border-blastoff-border border-b-0">
            <button
              onClick={() => setActivePanel('swap')}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                activePanel === 'swap' ? 'bg-blastoff-orange text-white' : 'text-blastoff-text-secondary hover:text-blastoff-text'
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActivePanel('position')}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                activePanel === 'position' ? 'bg-blastoff-orange text-white' : 'text-blastoff-text-secondary hover:text-blastoff-text'
              }`}
            >
              Position
            </button>
          </div>

          {/* Swap/Position Panel */}
          <div className="shrink-0">
            {activePanel === 'swap' ? (
              <SwapPanel token={token} />
            ) : (
              <UserPosition tokenAddress={address} tokenSymbol={token.symbol} />
            )}
          </div>

          {/* Recent Trades Panel */}
          <div className="flex-1 min-h-[200px] lg:min-h-0">
            <RecentTrades tokenAddress={address} tokenSymbol={token.symbol} />
          </div>
        </div>
      </div>
    </div>
  );
}
