'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { getContracts } from '@/config/contracts';
import { tokenFactoryAbi, erc20Abi } from '@/lib/abis';

/** TokenFactory state: 0 = NOT_CREATED, 1 = ICO, 2 = GRADUATED */
export type TokenFactoryState = 0 | 1 | 2;

/**
 * Read TokenFactory token state for a given token address.
 * Use this to show ICO buy/sell UI when state === 1.
 */
export function useTokenFactoryState(tokenAddress: string | undefined) {
  const chainId = useChainId();
  const contracts = getContracts(chainId);
  const factoryAddress = contracts.TOKEN_FACTORY as Address | undefined;

  const { data: state, isLoading } = useReadContract({
    address: factoryAddress || undefined,
    abi: tokenFactoryAbi,
    functionName: 'tokens',
    args: tokenAddress ? [tokenAddress as Address] : undefined,
  });

  const numericState = state !== undefined ? Number(state) as TokenFactoryState : undefined;

  return {
    state: numericState,
    isICO: numericState === 1,
    isGraduated: numericState === 2,
    isLoading: !!tokenAddress && isLoading,
    hasTokenFactory: !!factoryAddress,
  };
}

export type TokenFactorySwapStatus = 'idle' | 'approve' | 'pending' | 'confirming' | 'success' | 'error';

/**
 * Execute TokenFactory buy/sell (ICO phase only).
 * Buy: pays ETH, receives tokens. Sell: pays tokens, receives ETH (approve + sell).
 */
export function useTokenFactorySwap() {
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const contracts = getContracts(chainId);
  const factoryAddress = contracts.TOKEN_FACTORY as Address | undefined;

  const [status, setStatus] = useState<TokenFactorySwapStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [lastTradeRef, setLastTradeRef] = useState<{
    tokenAddress: string;
    isBuy: boolean;
    inputAmount: number;
    outputAmount: number;
  } | null>(null);
  const [lastTxWasApprove, setLastTxWasApprove] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash as `0x${string}` });

  useEffect(() => {
    if (isConfirming && (status === 'pending' || status === 'approve')) setStatus('confirming');
  }, [isConfirming, status]);
  useEffect(() => {
    if (!isSuccess) return;
    if (lastTxWasApprove) {
      setStatus('idle');
      setTxHash(undefined);
      setLastTxWasApprove(false);
    } else {
      setStatus('success');
    }
  }, [isSuccess, lastTxWasApprove]);

  // Record ICO trade for PnL when sell/buy tx confirms (not approve)
  useEffect(() => {
    if (!isSuccess || lastTxWasApprove || !lastTradeRef || !walletAddress) return;
    const { tokenAddress, isBuy, inputAmount, outputAmount } = lastTradeRef;
    fetch('/api/trades/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txHash,
        tokenAddress,
        wallet: walletAddress,
        isBuy,
        inputAmount,
        outputAmount,
        chainId,
      }),
    }).catch(() => {});
    setLastTradeRef(null);
  }, [isSuccess, lastTxWasApprove, lastTradeRef, walletAddress, txHash, chainId]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(undefined);
    setLastTradeRef(null);
    setLastTxWasApprove(false);
  }, []);

  /**
   * Execute ICO buy: send ETH, receive tokens.
   * tokenAmount = quote output (tokens to receive), we compute required ETH on-chain.
   */
  const executeBuy = useCallback(
    async (params: {
      tokenAddress: string;
      tokenAmount: number;
      tokenDecimals?: number;
    }): Promise<{ txHash: string } | null> => {
      if (!isConnected || !walletAddress || !factoryAddress || !publicClient) {
        setError('Wallet or chain not ready');
        return null;
      }

      setStatus('pending');
      setError(null);
      setTxHash(undefined);

      const decimals = params.tokenDecimals ?? 18;
      const amountScaled = parseUnits(params.tokenAmount.toString(), decimals);

      try {
        const requiredEth = await publicClient.readContract({
          address: factoryAddress,
          abi: tokenFactoryAbi,
          functionName: 'calculateRequiredBaseCoinExp',
          args: [params.tokenAddress as Address, amountScaled],
        });

        const hash = await writeContractAsync({
          address: factoryAddress,
          abi: tokenFactoryAbi,
          functionName: 'buy',
          args: [params.tokenAddress as Address, amountScaled],
          value: requiredEth,
        });

        setTxHash(hash);
        setLastTradeRef({
          tokenAddress: params.tokenAddress,
          isBuy: true,
          inputAmount: Number(requiredEth) / 1e18,
          outputAmount: params.tokenAmount,
        });
        return { txHash: hash };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Buy failed';
        setError(message);
        setStatus('error');
        return null;
      }
    },
    [isConnected, walletAddress, factoryAddress, publicClient, writeContractAsync]
  );

  /**
   * Execute ICO sell: send tokens, receive ETH. Handles approve if needed.
   */
  const executeSell = useCallback(
    async (params: {
      tokenAddress: string;
      tokenAmount: number;
      tokenDecimals?: number;
    }): Promise<{ txHash: string } | null> => {
      if (!isConnected || !walletAddress || !factoryAddress || !publicClient) {
        setError('Wallet or chain not ready');
        return null;
      }

      setError(null);
      setTxHash(undefined);

      const decimals = params.tokenDecimals ?? 18;
      const amountScaled = parseUnits(params.tokenAmount.toString(), decimals);

      try {
        const allowance = await publicClient.readContract({
          address: params.tokenAddress as Address,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [walletAddress as Address, factoryAddress],
        });

        if (allowance < amountScaled) {
          setStatus('approve');
          setLastTxWasApprove(true);
          const approveHash = await writeContractAsync({
            address: params.tokenAddress as Address,
            abi: erc20Abi,
            functionName: 'approve',
            args: [factoryAddress, amountScaled],
          });
          setTxHash(approveHash);
          // Wait for approve to confirm, then run sell in same flow so one click does approve + sell
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
          setLastTxWasApprove(false);
          setTxHash(undefined);
        }

        setStatus('pending');
        const hash = await writeContractAsync({
          address: factoryAddress,
          abi: tokenFactoryAbi,
          functionName: 'sell',
          args: [params.tokenAddress as Address, amountScaled],
        });

        setTxHash(hash);
        setLastTradeRef({
          tokenAddress: params.tokenAddress,
          isBuy: false,
          inputAmount: params.tokenAmount,
          outputAmount: 0, // Will be filled from quote in UI; record uses input for sell
        });
        return { txHash: hash };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sell failed';
        setError(message);
        setStatus('error');
        return null;
      }
    },
    [isConnected, walletAddress, factoryAddress, publicClient, writeContractAsync]
  );

  return {
    executeBuy,
    executeSell,
    reset,
    status,
    error,
    txHash,
    isPending: status === 'approve' || status === 'pending' || status === 'confirming',
    isSuccess: status === 'success',
    isError: status === 'error',
    hasTokenFactory: !!factoryAddress,
  };
}
