'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

function applyFiltersAndSort(tokens: Token[], filters?: FilterState): Token[] {
  const now = Date.now();
  let list = (tokens || []).filter((t) => t.startTime <= now);
  if (!filters) return list;
  if (filters.search) {
    const search = filters.search.toLowerCase().trim();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.symbol.toLowerCase().includes(search) ||
        (t.address && t.address.toLowerCase().includes(search))
    );
  }
  switch (filters.sort) {
    case 'marketCap':
      list.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
      break;
    case 'volume24h':
      list.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
      break;
    case 'priceChange24h':
      list.sort((a, b) => (b.priceChange24h ?? -Infinity) - (a.priceChange24h ?? -Infinity));
      break;
    case 'newest':
      list.sort((a, b) => b.startTime - a.startTime);
      break;
  }
  return list;
}

/** Single source of token list: fast Firebase first, then live on-chain. Live runs after fast succeeds to avoid duplicate load. */
export function useTokensList() {
  const queryClient = useQueryClient();
  const chainId = useChainId();

  const fastQuery = useQuery({
    queryKey: ['tokensListFast', chainId],
    queryFn: async (): Promise<Token[]> => {
      const params = new URLSearchParams();
      if (chainId != null) params.set('chainId', String(chainId));
      const { tokens } = await fetchJson<{ tokens: Token[] }>(`/api/tokens?${params}`);
      const now = Date.now();
      return (tokens || []).filter((t) => t.startTime <= now);
    },
    staleTime: 60_000,
  });

  const liveQuery = useQuery({
    queryKey: ['tokensList', chainId],
    queryFn: async (): Promise<Token[]> => {
      const params = new URLSearchParams({ live: 'true' });
      if (chainId != null) params.set('chainId', String(chainId));
      const { tokens } = await fetchJson<{ tokens: Token[] }>(`/api/tokens?${params}`);
      const now = Date.now();
      return (tokens || []).filter((t) => t.startTime <= now);
    },
    placeholderData: () => queryClient.getQueryData<Token[]>(['tokensListFast', chainId]),
    staleTime: 30_000,
    enabled: fastQuery.isSuccess && chainId != null,
  });

  return liveQuery;
}

/** Filtered/sorted list (e.g. for Top Movers). Derives from shared list. */
export function useTokens(filters?: FilterState) {
  const listQuery = useTokensList();
  const data = useMemo(
    () => applyFiltersAndSort(listQuery.data ?? [], filters),
    [listQuery.data, filters]
  );
  return {
    ...listQuery,
    data: listQuery.data !== undefined ? data : undefined,
  };
}

/** Paginated feed: derives from shared list. One fetch; cards show fast (Firebase) then update (live). */
export function useTokensPaginated(filters?: FilterState, page: number = 1) {
  const listQuery = useTokensList();
  const result = useMemo(() => {
    const sorted = applyFiltersAndSort(listQuery.data ?? [], filters);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / TOKENS_PER_PAGE));
    const start = (page - 1) * TOKENS_PER_PAGE;
    const tokens = sorted.slice(start, start + TOKENS_PER_PAGE);
    return { tokens, total, totalPages, currentPage: page };
  }, [listQuery.data, filters, page]);

  return {
    ...listQuery,
    data: listQuery.data !== undefined ? result : undefined,
  };
}

export function useToken(address: string, options?: { refetchInterval?: number; chainId?: number }) {
  const chainId = options?.chainId;
  return useQuery({
    queryKey: ['token', address, chainId],
    queryFn: async (): Promise<Token | null> => {
      const q = chainId != null ? `?chainId=${chainId}` : '';
      const { token } = await fetchJson<{ token: Token | null }>(`/api/tokens/${address}${q}`);
      return token;
    },
    enabled: !!address,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

/**
 * Fetch OHLCV chart data for a token.
 * Pass chainId so the correct chain's trades/prices are used.
 */
export function useTokenChart(address: string, timeframe: string = '1m', chainId?: number) {
  return useQuery({
    queryKey: ['tokenChart', address, timeframe, chainId],
    queryFn: async (): Promise<ChartCandle[]> => {
      const params = new URLSearchParams({ timeframe });
      if (chainId != null) params.set('chainId', String(chainId));
      const { candles } = await fetchJson<{ candles: ChartCandle[] }>(
        `/api/tokens/${address}/chart?${params}`
      );
      return candles || [];
    },
    enabled: !!address,
    refetchInterval: 60000,
  });
}

export function useTrendingTokens() {
  const chainId = useChainId();
  return useQuery({
    queryKey: ['trendingTokens', chainId],
    queryFn: async (): Promise<Token[]> => {
      const params = new URLSearchParams();
      if (chainId != null) params.set('chainId', String(chainId));
      const { tokens } = await fetchJson<{ tokens: Token[] }>(`/api/tokens/trending?${params}`);
      const now = Date.now();
      return (tokens || []).filter((t) => t.startTime <= now);
    },
    refetchInterval: 30000,
  });
}

/**
 * Fetch user's position for a token via GET /api/positions/[tokenAddress].
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
 * Get a swap quote via GET /api/swap/quote.
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
