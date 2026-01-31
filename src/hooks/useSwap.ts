'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useChainId, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';

export type SwapStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface SwapParams {
  tokenAddress: string;
  inputAmount: number;
  outputAmount: number;
  isBuy: boolean;
  slippage: number;
}

export interface SwapResult {
  txHash: string;
  inputAmount: number;
  outputAmount: number;
}

/**
 * Hook to execute token swaps
 * 
 * TODO [Backend]: Implement swap execution
 * 
 * Options:
 * 1. Direct on-chain via wagmi useWriteContract:
 *    - Call DEX router directly from frontend
 *    - User signs transaction in wallet
 * 
 * 2. Backend-assisted:
 *    - POST /api/swap/execute with swap params
 *    - Backend builds optimal transaction
 *    - Returns unsigned tx for user to sign
 * 
 * Example wagmi implementation:
 * ```typescript
 * import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
 * import { parseEther } from 'viem';
 * import { CONTRACTS } from '@/config/contracts';
 * 
 * const { writeContract, data: hash, isPending } = useWriteContract();
 * const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
 * 
 * // Execute swap
 * writeContract({
 *   address: CONTRACTS.UNISWAP_V3_ROUTER,
 *   abi: swapRouterAbi,
 *   functionName: 'exactInputSingle',
 *   args: [swapParams],
 *   value: isBuy ? parseEther(inputAmount.toString()) : 0n,
 * });
 * ```
 */
export function useSwap() {
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const [status, setStatus] = useState<SwapStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SwapResult | null>(null);
  const { data: hash, sendTransactionAsync } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirming && status === 'pending') {
      setStatus('confirming');
    }
    if (isSuccess && status !== 'success') {
      setStatus('success');
    }
  }, [isConfirming, isSuccess, status]);

  const executeSwap = useCallback(async (params: SwapParams): Promise<SwapResult | null> => {
    if (!isConnected || !walletAddress) {
      setError('Wallet not connected');
      return null;
    }

    setStatus('pending');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          tokenAddress: params.tokenAddress,
          inputAmount: params.inputAmount,
          isBuy: params.isBuy,
          slippage: params.slippage,
          chainId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to build swap transaction');
      }

      const { transaction } = await res.json();

      const txHash = await sendTransactionAsync({
        to: transaction.to,
        data: transaction.data,
        value: BigInt(transaction.value || '0'),
      });

      setResult({
        txHash,
        inputAmount: params.inputAmount,
        outputAmount: params.outputAmount,
      });

      return {
        txHash,
        inputAmount: params.inputAmount,
        outputAmount: params.outputAmount,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Swap failed';
      setError(message);
      setStatus('error');
      return null;
    }
  }, [isConnected, walletAddress, chainId, sendTransactionAsync]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return {
    executeSwap,
    reset,
    status,
    error,
    result,
    isPending: status === 'pending' || status === 'confirming',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
