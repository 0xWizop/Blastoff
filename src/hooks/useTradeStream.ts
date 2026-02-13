'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useChainId } from 'wagmi';
import { Trade } from '@/types';

interface StreamStats {
  state: 'ICO' | 'GRADUATED' | 'NOT_CREATED';
  collateralRaised: number;
  fundingGoal: number;
  progress: number;
  tokensRemaining: number;
}

interface UseTradeStreamOptions {
  tokenAddress: string;
  enabled?: boolean;
  onTrade?: (trade: Trade) => void;
  onStats?: (stats: StreamStats) => void;
}

interface UseTradeStreamResult {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnect: () => void;
  latestTrade: Trade | null;
  stats: StreamStats | null;
}

/**
 * Hook to subscribe to real-time trade updates via Server-Sent Events
 */
export function useTradeStream({
  tokenAddress,
  enabled = true,
  onTrade,
  onStats,
}: UseTradeStreamOptions): UseTradeStreamResult {
  const chainId = useChainId();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestTrade, setLatestTrade] = useState<Trade | null>(null);
  const [stats, setStats] = useState<StreamStats | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!tokenAddress || !enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsConnecting(true);
    setError(null);

    const url = `/api/tokens/${tokenAddress}/stream?chainId=${chainId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            console.log('[TradeStream] Connected for token:', data.tokenAddress);
            break;

          case 'trade':
            const trade = data.trade as Trade;
            setLatestTrade(trade);
            onTrade?.(trade);
            break;

          case 'stats':
            const statsData = data.stats as StreamStats;
            setStats(statsData);
            onStats?.(statsData);
            break;

          case 'error':
            console.warn('[TradeStream] Server error:', data.message);
            break;

          default:
            console.log('[TradeStream] Unknown message type:', data.type);
        }
      } catch (e) {
        console.error('[TradeStream] Failed to parse message:', e);
      }
    };

    eventSource.onerror = (e) => {
      console.error('[TradeStream] Connection error:', e);
      setIsConnected(false);
      setIsConnecting(false);
      
      eventSource.close();
      eventSourceRef.current = null;

      // Exponential backoff for reconnection
      const attempts = reconnectAttemptsRef.current;
      const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
      
      setError(`Connection lost. Reconnecting in ${delay / 1000}s...`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        connect();
      }, delay);
    };
  }, [tokenAddress, chainId, enabled, onTrade, onStats]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    connect();
  }, [connect]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    reconnect,
    latestTrade,
    stats,
  };
}
