'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, useChainId } from 'wagmi';

export interface TokenBalance {
  address: string;
  balance: string; // Raw balance as string (to avoid precision issues)
  formatted: number; // Human-readable balance
  decimals: number;
}

export interface Balances {
  eth: TokenBalance | null;
  weth: TokenBalance | null;
  token: TokenBalance | null;
}

/**
 * Fetch user's ETH, WETH, and token balances
 * 
 * TODO [Backend]: Implement GET /api/balances?wallet=[address]&token=[tokenAddress]
 * Expected response: { balances: Balances }
 * 
 * Alternative: Use wagmi's useBalance hook directly for on-chain reads:
 * 
 * ```typescript
 * import { useBalance } from 'wagmi';
 * import { CONTRACTS } from '@/config/contracts';
 * 
 * // ETH balance
 * const { data: ethBalance } = useBalance({ address: userAddress });
 * 
 * // WETH balance  
 * const { data: wethBalance } = useBalance({ 
 *   address: userAddress,
 *   token: CONTRACTS.WETH,
 * });
 * 
 * // Token balance
 * const { data: tokenBalance } = useBalance({
 *   address: userAddress,
 *   token: tokenAddress as `0x${string}`,
 * });
 * ```
 */
export function useBalances(tokenAddress?: string) {
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();

  return useQuery({
    queryKey: ['balances', walletAddress, tokenAddress, chainId],
    queryFn: async (): Promise<Balances> => {
      if (!walletAddress) {
        return { eth: null, weth: null, token: null };
      }
      
      const params = new URLSearchParams({ wallet: walletAddress, chainId: chainId.toString() });
      if (tokenAddress) {
        params.append('token', tokenAddress);
      }
      
      const res = await fetch(`/api/balances?${params}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch balances: ${res.status}`);
      }
      
      const { balances } = await res.json();
      return balances;
    },
    enabled: isConnected && !!walletAddress,
    refetchInterval: 15000, // Refresh every 15s
  });
}

/**
 * Hook to get just WETH balance (convenience wrapper)
 */
export function useWethBalance() {
  const { data: balances, ...rest } = useBalances();
  return {
    data: balances?.weth ?? null,
    ...rest,
  };
}

/**
 * Hook to get just a specific token balance (convenience wrapper)
 */
export function useTokenBalance(tokenAddress: string) {
  const { data: balances, ...rest } = useBalances(tokenAddress);
  return {
    data: balances?.token ?? null,
    ...rest,
  };
}
