'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade } from '@/types';
import { Spinner } from './Spinner';
import { useTradeStream } from '@/hooks/useTradeStream';

interface TradesFeedProps {
  tokenAddress: string;
  tokenSymbol: string;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
  return amount.toFixed(2);
}

function formatValue(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function TradeRow({ trade, tokenSymbol, isNew }: { trade: Trade; tokenSymbol: string; isNew?: boolean }) {
  const isBuy = trade.type === 'buy';
  const isWhale = trade.totalValue >= 100;
  
  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -20, scale: 0.95 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 border-b border-blastoff-border/50 px-3 py-2.5 ${
        isNew ? (isBuy ? 'bg-green-500/5' : 'bg-red-500/5') : ''
      } ${isWhale ? 'border-l-2 border-l-yellow-500' : ''}`}
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center ${
        isBuy ? 'bg-green-500/20' : 'bg-red-500/20'
      }`}>
        {isBuy ? (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
            {isBuy ? 'Buy' : 'Sell'}
          </span>
          {isWhale && (
            <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5">
              WHALE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-blastoff-text-muted">
          <span className="font-mono">{formatAmount(trade.amount)}</span>
          <span>{tokenSymbol}</span>
          <span className="text-blastoff-text-muted/50">•</span>
          <span className="font-mono">{formatValue(trade.totalValue)}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <a
          href={`https://basescan.org/address/${trade.walletAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-blastoff-text-secondary hover:text-blastoff-orange transition-colors"
        >
          {shortenAddress(trade.walletAddress)}
        </a>
        <p className="text-[10px] text-blastoff-text-muted">{formatTimeAgo(trade.timestamp)}</p>
      </div>

      <a
        href={`https://basescan.org/tx/${trade.txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 p-1.5 text-blastoff-text-muted hover:text-blastoff-orange transition-colors"
        title="View transaction"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </motion.div>
  );
}

export function TradesFeed({ tokenAddress, tokenSymbol }: TradesFeedProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTradeIds, setNewTradeIds] = useState<Set<string>>(new Set());
  const feedRef = useRef<HTMLDivElement>(null);

  // Handle incoming live trades
  const handleNewTrade = useCallback((trade: Trade) => {
    setTrades(prev => {
      // Check if trade already exists
      if (prev.some(t => t.id === trade.id)) return prev;
      // Add new trade at the beginning, limit to 50
      return [trade, ...prev].slice(0, 50);
    });
    
    // Mark as new for animation
    setNewTradeIds(prev => new Set([...Array.from(prev), trade.id]));
    
    // Remove "new" status after animation
    setTimeout(() => {
      setNewTradeIds(prev => {
        const next = new Set(prev);
        next.delete(trade.id);
        return next;
      });
    }, 3000);
  }, []);

  // Connect to live trade stream
  const { isConnected, isConnecting, error: streamError, reconnect } = useTradeStream({
    tokenAddress,
    enabled: isLive,
    onTrade: handleNewTrade,
  });

  // Fetch initial trades from API
  useEffect(() => {
    const loadTrades = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/tokens/${tokenAddress}/trades`);
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        const data = await response.json();
        setTrades(data.trades || []);
      } catch (err) {
        // API returned error - show empty state but continue with live stream
        setError(null);
        setTrades([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrades();
  }, [tokenAddress]);

  const buyCount = trades.filter((t) => t.type === 'buy').length;
  const sellCount = trades.filter((t) => t.type === 'sell').length;
  const totalVolume = trades.reduce((sum, t) => sum + t.totalValue, 0);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center border border-blastoff-border bg-blastoff-surface">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border border-blastoff-border bg-blastoff-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blastoff-border px-3 py-2.5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-blastoff-text">Live Trades</h3>
          {trades.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-500">{buyCount} buys</span>
              <span className="text-blastoff-text-muted">/</span>
              <span className="text-red-500">{sellCount} sells</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {trades.length > 0 && (
            <span className="text-xs text-blastoff-text-muted">
              Vol: {formatValue(totalVolume)}
            </span>
          )}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs transition-all ${
              isLive && isConnected
                ? 'bg-green-500/20 text-green-500' 
                : isLive && isConnecting
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'bg-blastoff-bg text-blastoff-text-muted hover:text-blastoff-text'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${
              isLive && isConnected 
                ? 'bg-green-500 animate-pulse' 
                : isLive && isConnecting
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-blastoff-text-muted'
            }`} />
            {isLive && isConnected ? 'Live' : isLive && isConnecting ? 'Connecting...' : 'Paused'}
          </button>
          {streamError && isLive && (
            <button
              onClick={reconnect}
              className="px-2 py-1 text-xs text-blastoff-orange hover:text-blastoff-orange-light"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Trades List */}
      <div ref={feedRef} className="flex-1 overflow-y-auto">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <svg className="mb-3 h-10 w-10 text-blastoff-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-sm text-blastoff-text-secondary">No trades available</p>
            <p className="mt-1 text-xs text-blastoff-text-muted">{error}</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <svg className="mb-3 h-10 w-10 text-blastoff-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-sm text-blastoff-text-secondary">No trades yet</p>
            <p className="mt-1 text-xs text-blastoff-text-muted">
              {isLive && isConnected 
                ? 'Waiting for live trades...' 
                : 'Be the first to trade this token'
              }
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {trades.map((trade) => (
              <TradeRow
                key={trade.id}
                trade={trade}
                tokenSymbol={tokenSymbol}
                isNew={newTradeIds.has(trade.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-blastoff-border px-3 py-2 text-center">
        <p className="text-[10px] text-blastoff-text-muted">
          {trades.length > 0 
            ? `Showing last ${trades.length} trades • ${isLive && isConnected ? 'Live updates enabled' : 'Updates paused'}`
            : isLive && isConnected 
              ? 'Streaming live trades...'
              : 'Waiting for trades...'
          }
        </p>
      </div>
    </div>
  );
}
