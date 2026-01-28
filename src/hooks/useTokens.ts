'use client';

import { useQuery } from '@tanstack/react-query';
import { generateMockChartData, generateMockUserPosition } from '@/data/mockTokens';
import { Token, ChartCandle, UserPosition, FilterState, SwapQuote } from '@/types';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useTokens(filters?: FilterState) {
  return useQuery({
    queryKey: ['tokens', filters],
    queryFn: async (): Promise<Token[]> => {
      const { tokens: rawTokens } = await fetchJson<{ tokens: Token[] }>('/api/tokens');

      const now = Date.now();
      let tokens = (rawTokens || []).filter((t) => t.startTime <= now);
      
      if (filters) {
        if (filters.search) {
          const search = filters.search.toLowerCase();
          tokens = tokens.filter(
            (t) =>
              t.name.toLowerCase().includes(search) ||
              t.symbol.toLowerCase().includes(search)
          );
        }
        
        switch (filters.sort) {
          case 'marketCap':
            tokens.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
            break;
          case 'volume24h':
            tokens.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
            break;
          case 'newest':
            tokens.sort((a, b) => b.startTime - a.startTime);
            break;
        }
      }
      
      return tokens;
    },
    staleTime: 30000,
  });
}

export function useToken(address: string) {
  return useQuery({
    queryKey: ['token', address],
    queryFn: async (): Promise<Token | null> => {
      const { token } = await fetchJson<{ token: Token | null }>(`/api/tokens/${address}`);
      return token;
    },
    enabled: !!address,
  });
}

export function useTokenChart(address: string, timeframe: string = '1m') {
  return useQuery({
    queryKey: ['tokenChart', address, timeframe],
    queryFn: async (): Promise<ChartCandle[]> => {
      const { token } = await fetchJson<{ token: Token | null }>(`/api/tokens/${address}`);
      if (!token) return [];
      
      const counts: Record<string, number> = {
        '1m': 100,
        '5m': 100,
        '15m': 96,
        '1h': 72,
      };
      
      return generateMockChartData(token.price, counts[timeframe] || 100);
    },
    enabled: !!address,
    refetchInterval: 60000,
  });
}

export function useTrendingTokens() {
  return useQuery({
    queryKey: ['trendingTokens'],
    queryFn: async (): Promise<Token[]> => {
      const { tokens } = await fetchJson<{ tokens: Token[] }>('/api/tokens/trending');
      const now = Date.now();
      return (tokens || []).filter((t) => t.startTime <= now);
    },
    refetchInterval: 30000,
  });
}

export function useUserPosition(tokenAddress: string, walletAddress: string | undefined) {
  return useQuery({
    queryKey: ['userPosition', tokenAddress, walletAddress],
    queryFn: async (): Promise<UserPosition | null> => {
      const { token } = await fetchJson<{ token: Token | null }>(`/api/tokens/${tokenAddress}`);
      if (!token || !walletAddress) return null;
      return generateMockUserPosition(token, walletAddress);
    },
    enabled: !!tokenAddress && !!walletAddress,
  });
}

export function useSwapQuote(params: {
  tokenAddress: string;
  inputAmount: number;
  isBuy: boolean;
}) {
  return useQuery({
    queryKey: ['swapQuote', params],
    queryFn: async (): Promise<SwapQuote> => {
      const { token } = await fetchJson<{ token: Token | null }>(`/api/tokens/${params.tokenAddress}`);
      const price = token?.price || 0.0001;
      
      const outputAmount = params.isBuy
        ? params.inputAmount / price
        : params.inputAmount * price;
      
      return {
        inputAmount: params.inputAmount,
        outputAmount,
        priceImpact: Math.random() * 2,
        fee: params.inputAmount * 0.003,
      };
    },
    enabled: !!params.tokenAddress && params.inputAmount > 0,
  });
}
