/**
 * API Service Layer
 * 
 * This file defines all the API endpoints that need to be implemented by the backend.
 * Each function includes documentation of expected request/response formats.
 */

import { Token, ChartCandle, UserPosition, SwapQuote } from '@/types';
import { Balances } from '@/hooks/useBalances';

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ============================================================================
// TOKEN ENDPOINTS (Existing - Already Implemented)
// ============================================================================

/**
 * GET /api/tokens
 * Returns all tokens from database
 */
export async function getTokens(): Promise<Token[]> {
  const { tokens } = await fetchApi<{ tokens: Token[] }>('/tokens');
  return tokens;
}

/**
 * GET /api/tokens/[address]
 * Returns a single token by address
 */
export async function getToken(address: string): Promise<Token | null> {
  const { token } = await fetchApi<{ token: Token | null }>(`/tokens/${address}`);
  return token;
}

/**
 * GET /api/tokens/trending
 * Returns top trending tokens by volume
 */
export async function getTrendingTokens(): Promise<Token[]> {
  const { tokens } = await fetchApi<{ tokens: Token[] }>('/tokens/trending');
  return tokens;
}

// ============================================================================
// CHART ENDPOINTS (TODO - Backend Required)
// ============================================================================

/**
 * GET /api/tokens/[address]/chart?timeframe=1m
 * 
 * TODO [Backend]: Implement this endpoint
 * 
 * Query params:
 *   - timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
 * 
 * Expected response:
 *   { candles: ChartCandle[] }
 * 
 * Data source options:
 *   - The Graph (Uniswap/Aerodrome subgraphs)
 *   - GeckoTerminal API
 *   - Dune Analytics
 *   - Custom indexer
 */
export async function getChartData(address: string, timeframe: string): Promise<ChartCandle[]> {
  const { candles } = await fetchApi<{ candles: ChartCandle[] }>(
    `/tokens/${address}/chart?timeframe=${timeframe}`
  );
  return candles;
}

// ============================================================================
// BALANCE ENDPOINTS (TODO - Backend Required)
// ============================================================================

/**
 * GET /api/balances?wallet=[address]&token=[tokenAddress]
 * 
 * TODO [Backend]: Implement this endpoint
 * 
 * Query params:
 *   - wallet: User's wallet address (required)
 *   - token: Token address to check balance (optional)
 * 
 * Expected response:
 *   {
 *     balances: {
 *       eth: { address: '0x...', balance: '1000000000000000000', formatted: 1.0, decimals: 18 } | null,
 *       weth: { address: '0x...', balance: '500000000000000000', formatted: 0.5, decimals: 18 } | null,
 *       token: { address: '0x...', balance: '1000000000', formatted: 1000, decimals: 6 } | null
 *     }
 *   }
 * 
 * Implementation options:
 *   - Direct RPC calls (eth_getBalance, balanceOf)
 *   - Alchemy/Infura Token API
 *   - wagmi on frontend (alternative to backend)
 */
export async function getBalances(wallet: string, tokenAddress?: string): Promise<Balances> {
  const params = new URLSearchParams({ wallet });
  if (tokenAddress) params.append('token', tokenAddress);
  
  const { balances } = await fetchApi<{ balances: Balances }>(`/balances?${params}`);
  return balances;
}

// ============================================================================
// POSITION ENDPOINTS (TODO - Backend Required)
// ============================================================================

/**
 * GET /api/positions/[tokenAddress]?wallet=[walletAddress]
 * 
 * TODO [Backend]: Implement this endpoint
 * 
 * Query params:
 *   - wallet: User's wallet address (required)
 * 
 * Expected response:
 *   { position: UserPosition | null }
 * 
 * Position tracking requires:
 *   - Current token balance (on-chain)
 *   - Average entry price (requires indexing user's swap history)
 *   - Current token price (from price feed)
 * 
 * Note: Average entry tracking requires indexing historical transactions
 */
export async function getUserPosition(
  tokenAddress: string,
  wallet: string
): Promise<UserPosition | null> {
  const { position } = await fetchApi<{ position: UserPosition | null }>(
    `/positions/${tokenAddress}?wallet=${wallet}`
  );
  return position;
}

// ============================================================================
// SWAP ENDPOINTS (TODO - Backend Required)
// ============================================================================

/**
 * GET /api/swap/quote?tokenAddress=...&inputAmount=...&isBuy=...&slippage=...
 * 
 * TODO [Backend]: Implement this endpoint
 * 
 * Query params:
 *   - tokenAddress: Token to swap (required)
 *   - inputAmount: Amount in human-readable format (required)
 *   - isBuy: true for WETH->Token, false for Token->WETH (required)
 *   - slippage: Slippage tolerance percentage (required)
 * 
 * Expected response:
 *   {
 *     quote: {
 *       inputAmount: 0.1,
 *       outputAmount: 1000,
 *       priceImpact: 0.5,
 *       fee: 0.0003
 *     }
 *   }
 * 
 * Implementation options:
 *   - Uniswap V3 Quoter contract
 *   - Aerodrome Router
 *   - 1inch/0x API for aggregated quotes
 */
export async function getSwapQuote(params: {
  tokenAddress: string;
  inputAmount: number;
  isBuy: boolean;
  slippage: number;
}): Promise<SwapQuote> {
  const searchParams = new URLSearchParams({
    tokenAddress: params.tokenAddress,
    inputAmount: params.inputAmount.toString(),
    isBuy: params.isBuy.toString(),
    slippage: params.slippage.toString(),
  });
  
  const { quote } = await fetchApi<{ quote: SwapQuote }>(`/swap/quote?${searchParams}`);
  return quote;
}

/**
 * POST /api/swap/execute
 * 
 * TODO [Backend]: Implement this endpoint (optional - can also do client-side)
 * 
 * Request body:
 *   {
 *     wallet: string,
 *     tokenAddress: string,
 *     inputAmount: number,
 *     minOutputAmount: number,
 *     isBuy: boolean,
 *     deadline: number
 *   }
 * 
 * Expected response:
 *   {
 *     transaction: {
 *       to: '0x...',
 *       data: '0x...',
 *       value: '0x...',
 *       gasLimit: '0x...'
 *     }
 *   }
 * 
 * The frontend will then send this transaction via the user's wallet.
 * 
 * Alternative: Execute swaps directly from frontend using wagmi's useWriteContract
 */
export async function buildSwapTransaction(params: {
  wallet: string;
  tokenAddress: string;
  inputAmount: number;
  minOutputAmount: number;
  isBuy: boolean;
  deadline: number;
}): Promise<{
  to: string;
  data: string;
  value: string;
  gasLimit: string;
}> {
  const { transaction } = await fetchApi<{
    transaction: { to: string; data: string; value: string; gasLimit: string };
  }>('/swap/execute', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return transaction;
}

// ============================================================================
// TOKEN CREATION ENDPOINTS (TODO - Backend Required)
// ============================================================================

/**
 * POST /api/tokens/create
 * 
 * TODO [Backend]: Implement when token factory is ready
 * 
 * Request body:
 *   {
 *     name: string,
 *     symbol: string,
 *     totalSupply: string,
 *     decimals: number,
 *     description: string,
 *     website?: string,
 *     twitter?: string,
 *     telegram?: string,
 *     discord?: string,
 *     logoUrl?: string
 *   }
 * 
 * Expected response:
 *   {
 *     transaction: { to, data, value, gasLimit },
 *     predictedAddress: '0x...'
 *   }
 */

/**
 * POST /api/tokens/launch
 * 
 * TODO [Backend]: Implement when launchpad is ready
 * 
 * Request body:
 *   {
 *     tokenAddress: string,
 *     dex: 'UNISWAP_V3' | 'AERODROME',
 *     initialPriceWeth: number,
 *     wethLiquidity: number,
 *     feeTier?: 500 | 3000 | 10000  // Only for Uniswap V3
 *   }
 * 
 * Expected response:
 *   {
 *     transaction: { to, data, value, gasLimit },
 *     poolAddress: '0x...'
 *   }
 */
