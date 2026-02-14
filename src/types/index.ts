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
  // Extended stats
  holders?: number;
  liquidity?: number;
  txCount24h?: number;
  creatorAddress?: string;
}

export type TradeType = 'buy' | 'sell';

export interface Trade {
  id: string;
  type: TradeType;
  tokenAddress: string;
  walletAddress: string;
  amount: number;        // Token amount
  price: number;         // Price per token at trade time
  totalValue: number;    // Total USD value
  txHash: string;
  timestamp: number;
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

export type SortOption = 'marketCap' | 'volume24h' | 'priceChange24h' | 'newest';

export interface FilterState {
  status: TokenStatus | 'ALL';
  sort: SortOption;
  search: string;
}
