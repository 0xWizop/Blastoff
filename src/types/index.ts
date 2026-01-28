export type TokenStatus = 'LIVE' | 'UPCOMING' | 'ENDED';

export interface Token {
  address: string;
  name: string;
  symbol: string;
  status: TokenStatus;
  raised: number;
  hardCap: number;
  softCap: number;
  startTime: number;
  endTime: number;
  price: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  logoUrl: string;
}

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface UserPosition {
  tokenAddress: string;
  balance: number;
  averageEntry: number;
  currentValue: number;
  pnlUsd: number;
  pnlPercent: number;
}

export interface SwapQuote {
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
}

export type SortOption = 'marketCap' | 'volume24h' | 'newest';

export interface FilterState {
  status: TokenStatus | 'ALL';
  sort: SortOption;
  search: string;
}
