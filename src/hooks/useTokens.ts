'use client';

import { useQuery } from '@tanstack/react-query';
import { useChainId } from 'wagmi';
import { Token, ChartCandle, UserPosition, FilterState, SwapQuote } from '@/types';

const TOKENS_PER_PAGE = 12;

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
          const search = filters.search.toLowerCase().trim();
          tokens = tokens.filter(
            (t) =>
              t.name.toLowerCase().includes(search) ||
              t.symbol.toLowerCase().includes(search) ||
              (t.address && t.address.toLowerCase().includes(search))
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

// Paginated version with page numbers
export function useTokensPaginated(filters?: FilterState, page: number = 1) {
  return useQuery({
    queryKey: ['tokensPaginated', filters, page],
    queryFn: async (): Promise<{ tokens: Token[]; total: number; totalPages: number; currentPage: number }> => {
      const { tokens: rawTokens } = await fetchJson<{ tokens: Token[] }>('/api/tokens');

      const now = Date.now();
      let tokens = (rawTokens || []).filter((t) => t.startTime <= now);
      
      if (filters) {
        if (filters.search) {
          const search = filters.search.toLowerCase().trim();
          tokens = tokens.filter(
            (t) =>
              t.name.toLowerCase().includes(search) ||
              t.symbol.toLowerCase().includes(search) ||
              (t.address && t.address.toLowerCase().includes(search))
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

      const total = tokens.length;
      const totalPages = Math.ceil(total / TOKENS_PER_PAGE);
      const start = (page - 1) * TOKENS_PER_PAGE;
      const end = start + TOKENS_PER_PAGE;
      const paginatedTokens = tokens.slice(start, end);
      
      return {
        tokens: paginatedTokens,
        total,
        totalPages,
        currentPage: page,
      };
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

/**
 * Fetch OHLCV chart data for a token
 * 
 * TODO [Backend]: Implement GET /api/tokens/[address]/chart?timeframe=1m
 * Expected response: { candles: ChartCandle[] }
 */
export function useTokenChart(address: string, timeframe: string = '1m') {
  return useQuery({
    queryKey: ['tokenChart', address, timeframe],
    queryFn: async (): Promise<ChartCandle[]> => {
      const { candles } = await fetchJson<{ candles: ChartCandle[] }>(
        `/api/tokens/${address}/chart?timeframe=${timeframe}`
      );
      return candles || [];
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

/**
 * Fetch user's position for a specific token
 * 
 * TODO [Backend]: Implement GET /api/positions/[tokenAddress]?wallet=[walletAddress]
 * Expected response: { position: UserPosition | null }
 */
export function useUserPosition(tokenAddress: string, walletAddress: string | undefined) {
  return useQuery({
    queryKey: ['userPosition', tokenAddress, walletAddress],
    queryFn: async (): Promise<UserPosition | null> => {
      const { position } = await fetchJson<{ position: UserPosition | null }>(
        `/api/positions/${tokenAddress}?wallet=${walletAddress}`
      );
      return position;
    },
    enabled: !!tokenAddress && !!walletAddress,
  });
}

/**
 * Get a swap quote from the backend/DEX
 * 
 * TODO [Backend]: Implement GET /api/swap/quote
 * Query params: tokenAddress, inputAmount, isBuy, slippage
 * Expected response: { quote: SwapQuote }
 */
export function useSwapQuote(params: {
  tokenAddress: string;
  inputAmount: number;
  isBuy: boolean;
  slippage?: number;
}) {
  const chainId = useChainId();
  return useQuery({
    queryKey: ['swapQuote', params, chainId],
    queryFn: async (): Promise<SwapQuote> => {
      const searchParams = new URLSearchParams({
        tokenAddress: params.tokenAddress,
        inputAmount: params.inputAmount.toString(),
        isBuy: params.isBuy.toString(),
        slippage: (params.slippage ?? 1).toString(),
        chainId: chainId.toString(),
      });
      const { quote } = await fetchJson<{ quote: SwapQuote }>(`/api/swap/quote?${searchParams}`);
      return quote;
    },
    enabled: !!params.tokenAddress && params.inputAmount > 0,
  });
}
