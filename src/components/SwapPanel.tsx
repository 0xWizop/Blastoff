'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { Token } from '@/types';
import { useSwapQuote } from '@/hooks/useTokens';
import { useBalances } from '@/hooks/useBalances';
import { useSwap } from '@/hooks/useSwap';
import { useAppStore } from '@/store/useAppStore';
import { ButtonSpinner } from './Spinner';

interface SwapPanelProps {
  token: Token;
}

const slippageOptions = [0.5, 1, 2, 5];

export function SwapPanel({ token }: SwapPanelProps) {
  const { isConnected } = useAccount();
  const { openModal, openModals, closeModal } = useAppStore();
  const [isBuy, setIsBuy] = useState(true);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(1);

  // Fetch real balances
  const { data: balances, isLoading: balancesLoading } = useBalances(token.address);
  const wethBalance = balances?.weth?.formatted ?? 0;
  const tokenBalance = balances?.token?.formatted ?? 0;

  // Swap execution hook
  const { executeSwap, status: txStatus, isPending, isSuccess, reset: resetSwap } = useSwap();

  const { data: quote } = useSwapQuote({
    tokenAddress: token.address,
    inputAmount: parseFloat(amount) || 0,
    isBuy,
    slippage,
  });

  const isDisabled = !isConnected;

  const setPct = (pct: number) => {
    const base = isBuy ? wethBalance : tokenBalance;
    const v = pct === 100 ? base : (base * pct) / 100;
    const formatted = isBuy ? v.toFixed(4) : v.toFixed(0);
    setAmount(formatted);
  };

  const copyTokenAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.address);
      toast.success('Address copied!', {
        description: `${token.address.slice(0, 8)}...${token.address.slice(-6)}`,
      });
    } catch {
      toast.error('Failed to copy address');
    }
  };

  const handleSwap = async () => {
    if (isDisabled || !quote) return;
    
    const swapToast = toast.loading(
      `${isBuy ? 'Buying' : 'Selling'} ${token.symbol}...`,
      { description: 'Please confirm in your wallet' }
    );
    
    try {
      const result = await executeSwap({
        tokenAddress: token.address,
        inputAmount: parseFloat(amount),
        outputAmount: quote.outputAmount,
        isBuy,
        slippage,
      });

      if (result) {
        toast.success(
          `${isBuy ? 'Bought' : 'Sold'} ${token.symbol}!`,
          {
            id: swapToast,
            description: `${isBuy ? 'Received' : 'Got'} ${quote.outputAmount.toFixed(4)} ${isBuy ? token.symbol : 'WETH'}`,
          }
        );
        // Reset form on success
        setTimeout(() => {
          setAmount('');
          resetSwap();
        }, 2000);
      } else {
        toast.error('Swap failed', {
          id: swapToast,
          description: 'Transaction was rejected or failed',
        });
      }
    } catch (error: any) {
      toast.error('Swap failed', {
        id: swapToast,
        description: error?.message || 'Something went wrong',
      });
    }
  };

  return (
    <div className="border border-blastoff-border bg-blastoff-surface p-3 sm:p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <h3 className="font-display text-base font-semibold text-blastoff-text sm:text-lg">Swap</h3>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={copyTokenAddress}
            className="bg-blastoff-bg px-2.5 py-2 text-xs text-blastoff-text-secondary transition-colors active:bg-blastoff-border sm:px-3 sm:py-1.5 sm:hover:text-blastoff-text"
            title="Copy token address"
          >
            Copy
          </button>
          <button
            onClick={() => openModal('slippage')}
            className="flex items-center gap-1 bg-blastoff-bg px-2.5 py-2 text-xs text-blastoff-text-secondary transition-colors active:bg-blastoff-border sm:px-3 sm:py-1.5 sm:hover:text-blastoff-text"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {slippage}%
          </button>
        </div>
      </div>

      {/* Slippage Dropdown */}
      {openModals.slippage && (
        <div className="mb-3 border border-blastoff-border bg-blastoff-bg p-3 sm:mb-4">
          <p className="mb-2 text-xs text-blastoff-text-secondary">Slippage Tolerance</p>
          <div className="flex gap-2">
            {slippageOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSlippage(option);
                  closeModal('slippage');
                }}
                className={`flex-1 py-2.5 text-sm font-medium transition-all sm:py-2 ${
                  slippage === option
                    ? 'bg-blastoff-orange text-white'
                    : 'bg-blastoff-surface text-blastoff-text-secondary active:bg-blastoff-border sm:hover:text-blastoff-text'
                }`}
              >
                {option}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Buy/Sell Toggle */}
      <div className="mb-3 flex bg-blastoff-bg p-1 sm:mb-4">
        <button
          onClick={() => setIsBuy(true)}
          className={`flex-1 py-2.5 text-sm font-medium transition-all sm:py-2 ${
            isBuy
              ? 'bg-blastoff-success/20 text-blastoff-success'
              : 'text-blastoff-text-secondary active:bg-blastoff-border sm:hover:text-blastoff-text'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setIsBuy(false)}
          className={`flex-1 py-2.5 text-sm font-medium transition-all sm:py-2 ${
            !isBuy
              ? 'bg-blastoff-error/20 text-blastoff-error'
              : 'text-blastoff-text-secondary active:bg-blastoff-border sm:hover:text-blastoff-text'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Input/Output Section */}
      <div className="mb-3 space-y-2 sm:mb-4 sm:space-y-3">
        <div>
          <label className="mb-1 block text-xs text-blastoff-text-secondary">
            {isBuy ? 'You pay' : 'You sell'}
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-3 pr-16 text-base text-blastoff-text placeholder-blastoff-text-muted outline-none transition-all focus:border-blastoff-orange sm:px-4 sm:text-lg"
              disabled={isDisabled}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blastoff-text-secondary sm:right-4 sm:text-sm">
              {isBuy ? 'WETH' : token.symbol}
            </span>
          </div>
          
          {/* Percentage Buttons - Larger touch targets on mobile */}
          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setPct(pct)}
                disabled={isDisabled}
                className="border border-blastoff-border bg-blastoff-bg py-2.5 text-xs text-blastoff-text-secondary transition-all active:bg-blastoff-border disabled:cursor-not-allowed disabled:opacity-50 sm:py-2 sm:hover:text-blastoff-text"
              >
                {pct === 100 ? 'Max' : `${pct}%`}
              </button>
            ))}
          </div>
          
          <p className="mt-1.5 text-[11px] text-blastoff-text-muted sm:mt-2 sm:text-xs">
            Balance: {balancesLoading ? '...' : isBuy ? `${wethBalance.toFixed(4)} WETH` : `${tokenBalance.toLocaleString()} ${token.symbol}`}
          </p>
        </div>

        {/* Arrow Separator */}
        <div className="flex justify-center py-1">
          <div className="bg-blastoff-border p-1.5 sm:p-2">
            <svg className="h-3.5 w-3.5 text-blastoff-text-secondary sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Output Field */}
        <div>
          <label className="mb-1 block text-xs text-blastoff-text-secondary">
            {isBuy ? 'You receive' : 'You get'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={quote?.outputAmount.toFixed(4) || '0.0'}
              readOnly
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-3 pr-16 text-base text-blastoff-text-secondary sm:px-4 sm:text-lg"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blastoff-text-secondary sm:right-4 sm:text-sm">
              {isBuy ? token.symbol : 'WETH'}
            </span>
          </div>
        </div>
      </div>

      {/* Quote Details */}
      {quote && parseFloat(amount) > 0 && (
        <div className="mb-3 space-y-1 bg-blastoff-bg p-2.5 text-[11px] sm:mb-4 sm:p-3 sm:text-xs">
          <div className="flex justify-between text-blastoff-text-secondary">
            <span>Price Impact</span>
            <span className={quote.priceImpact > 1 ? 'text-blastoff-warning' : ''}>
              {quote.priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between text-blastoff-text-secondary">
            <span>Fee</span>
            <span>{quote.fee.toFixed(4)} ETH</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      {!isConnected ? (
        <button
          onClick={() => openModal('walletConnect')}
          className="w-full bg-blastoff-orange py-3.5 text-sm font-medium text-white transition-all active:bg-blastoff-orange-light sm:py-3 sm:hover:bg-blastoff-orange-light sm:hover:shadow-glow-orange"
        >
          Connect Wallet
        </button>
      ) : isPending ? (
        <button
          disabled
          className="flex w-full items-center justify-center gap-2 bg-blastoff-orange/50 py-3.5 text-sm font-medium text-white sm:py-3"
        >
          <ButtonSpinner />
          {txStatus === 'confirming' ? 'Confirming...' : 'Processing...'}
        </button>
      ) : isSuccess ? (
        <button
          disabled
          className="w-full bg-blastoff-success py-3.5 text-sm font-medium text-white sm:py-3"
        >
          Success!
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={!amount || parseFloat(amount) <= 0}
          className={`w-full py-3.5 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:bg-blastoff-border disabled:text-blastoff-text-muted sm:py-3 ${
            isBuy 
              ? 'bg-blastoff-success/80 active:bg-blastoff-success sm:hover:bg-blastoff-success sm:hover:shadow-glow-green' 
              : 'bg-blastoff-error/80 active:bg-blastoff-error sm:hover:bg-blastoff-error sm:hover:shadow-glow-red'
          }`}
        >
          {isBuy ? 'Buy' : 'Sell'} {token.symbol}
        </button>
      )}
    </div>
  );
}
