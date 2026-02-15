'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChainId } from 'wagmi';
import { Trade } from '@/types';
import { getChainConfig } from '@/config/contracts';
import { Spinner } from './Spinner';
import { useTradeStream } from '@/hooks/useTradeStream';

interface RecentTradesProps {
  tokenAddress: string;
  tokenSymbol: string;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toFixed(0);
}

function formatValue(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(3)}`;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export function RecentTrades({ tokenAddress, tokenSymbol }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTradeId, setNewTradeId] = useState<string | null>(null);

  const chainId = useChainId();
  const blockExplorer = getChainConfig(chainId).blockExplorer;
  const TRADES_CAP = 100;

  // Handle incoming live trades
  const handleNewTrade = useCallback((trade: Trade) => {
    setTrades(prev => {
      if (prev.some(t => t.id === trade.id)) return prev;
      return [trade, ...prev].slice(0, TRADES_CAP);
    });
    
    // Mark as new for animation
    setNewTradeId(trade.id);
    
    // Remove "new" status after animation
    setTimeout(() => {
      setNewTradeId(prev => prev === trade.id ? null : prev);
    }, 2000);
  }, []);

  // Connect to live trade stream
  const { isConnected } = useTradeStream({
    tokenAddress,
    enabled: true,
    onTrade: handleNewTrade,
  });

  // Fetch initial trades from API
  useEffect(() => {
    const loadTrades = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/tokens/${tokenAddress}/trades?limit=${TRADES_CAP}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        const data = await response.json();
        setTrades(data.trades || []);
      } catch (err) {
        // API returned error - continue with live stream
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

  return (
    <div className="border border-blastoff-border border-t-0 bg-blastoff-surface flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-blastoff-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-blastoff-text">Trades</span>
          <span className="relative flex h-1.5 w-1.5">
            <span className={`absolute inline-flex h-full w-full rounded-full ${isConnected ? 'animate-ping bg-green-400 opacity-75' : 'bg-gray-400 opacity-50'}`} />
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
          </span>
        </div>
        {trades.length > 0 && (
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-green-500">{buyCount}B</span>
            <span className="text-blastoff-text-muted">/</span>
            <span className="text-red-500">{sellCount}S</span>
          </div>
        )}
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : error || trades.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <svg className="mb-2 h-6 w-6 text-blastoff-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-[10px] text-blastoff-text-muted">
              {error || (isConnected ? 'Waiting for live trades...' : 'No trades yet')}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {trades.map((trade) => {
              const isBuy = trade.type === 'buy';
              const isNew = trade.id === newTradeId;
              
              return (
                <motion.div
                  key={trade.id}
                  initial={isNew ? { opacity: 0, x: -10 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 border-b border-blastoff-border/30 ${
                    isNew ? (isBuy ? 'bg-green-500/10' : 'bg-red-500/10') : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] font-medium shrink-0 w-6 ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
                      {isBuy ? 'BUY' : 'SELL'}
                    </span>
                    <span className="font-mono text-[11px] text-blastoff-text truncate">
                      {formatAmount(trade.amount)}
                    </span>
                    <span className="text-[10px] text-blastoff-text-muted shrink-0">
                      {tokenSymbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-blastoff-text-secondary">
                      {formatValue(trade.totalValue)}
                    </span>
                    <span className="text-[9px] text-blastoff-text-muted w-6 text-right">
                      {formatTimeAgo(trade.timestamp)}
                    </span>
                    <a
                      href={`${blockExplorer}/tx/${trade.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-blastoff-text-muted hover:text-blastoff-orange transition-colors"
                      title="View on explorer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-3 py-1.5 border-t border-blastoff-border bg-blastoff-bg/50">
        <p className="text-[9px] text-blastoff-text-muted text-center">
          {trades.length > 0 
            ? `${isConnected ? 'Live' : 'Offline'} • Scroll for more • ${trades.length} trades` 
            : isConnected 
              ? 'Streaming...'
              : 'Waiting for trades...'
          }
        </p>
      </div>
    </div>
  );
}
