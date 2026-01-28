'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Token } from '@/types';
import { useSwapQuote } from '@/hooks/useTokens';
import { useAppStore } from '@/store/useAppStore';

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
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const mockWethBalance = 1.2345;
  const mockTokenBalance = 50000;

  const { data: quote } = useSwapQuote({
    tokenAddress: token.address,
    inputAmount: parseFloat(amount) || 0,
    isBuy,
  });

  const isDisabled = !isConnected;

  const setPct = (pct: number) => {
    const base = isBuy ? mockWethBalance : mockTokenBalance;
    const v = pct === 100 ? base : (base * pct) / 100;
    const formatted = isBuy ? v.toFixed(4) : v.toFixed(0);
    setAmount(formatted);
  };

  const copyTokenAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.address);
    } catch {
      // ignore
    }
  };

  const handleSwap = () => {
    if (isDisabled) return;
    setTxStatus('pending');
    setTimeout(() => {
      setTxStatus('success');
      setTimeout(() => setTxStatus('idle'), 3000);
    }, 2000);
  };

  return (
    <div className="border border-blastoff-border bg-blastoff-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-blastoff-text">Swap</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={copyTokenAddress}
            className="bg-blastoff-bg px-3 py-1.5 text-xs text-blastoff-text-secondary transition-colors hover:text-blastoff-text"
            title="Copy token address"
          >
            Copy
          </button>
          <button
            onClick={() => openModal('slippage')}
            className="flex items-center gap-1 bg-blastoff-bg px-3 py-1.5 text-xs text-blastoff-text-secondary transition-colors hover:text-blastoff-text"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {slippage}%
          </button>
        </div>
      </div>

      {openModals.slippage && (
        <div className="mb-4 border border-blastoff-border bg-blastoff-bg p-3">
          <p className="mb-2 text-xs text-blastoff-text-secondary">Slippage Tolerance</p>
          <div className="flex gap-2">
            {slippageOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSlippage(option);
                  closeModal('slippage');
                }}
                className={`flex-1 py-2 text-sm font-medium transition-all ${
                  slippage === option
                    ? 'bg-blastoff-orange text-white'
                    : 'bg-blastoff-surface text-blastoff-text-secondary hover:text-blastoff-text'
                }`}
              >
                {option}%
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex bg-blastoff-bg p-1">
        <button
          onClick={() => setIsBuy(true)}
          className={`flex-1 py-2 text-sm font-medium transition-all ${
            isBuy
              ? 'bg-blastoff-success/20 text-blastoff-success'
              : 'text-blastoff-text-secondary hover:text-blastoff-text'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setIsBuy(false)}
          className={`flex-1 py-2 text-sm font-medium transition-all ${
            !isBuy
              ? 'bg-blastoff-error/20 text-blastoff-error'
              : 'text-blastoff-text-secondary hover:text-blastoff-text'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="mb-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs text-blastoff-text-secondary">
            {isBuy ? 'You pay' : 'You sell'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full border border-blastoff-border bg-blastoff-bg px-4 py-3 pr-16 text-lg text-blastoff-text placeholder-blastoff-text-muted outline-none transition-all focus:border-blastoff-orange"
              disabled={isDisabled}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-blastoff-text-secondary">
              {isBuy ? 'WETH' : token.symbol}
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setPct(25)}
              disabled={isDisabled}
              className="flex-1 border border-blastoff-border bg-blastoff-bg py-2 text-xs text-blastoff-text-secondary transition-all hover:text-blastoff-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              25%
            </button>
            <button
              onClick={() => setPct(50)}
              disabled={isDisabled}
              className="flex-1 border border-blastoff-border bg-blastoff-bg py-2 text-xs text-blastoff-text-secondary transition-all hover:text-blastoff-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              50%
            </button>
            <button
              onClick={() => setPct(75)}
              disabled={isDisabled}
              className="flex-1 border border-blastoff-border bg-blastoff-bg py-2 text-xs text-blastoff-text-secondary transition-all hover:text-blastoff-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              75%
            </button>
            <button
              onClick={() => setPct(100)}
              disabled={isDisabled}
              className="flex-1 border border-blastoff-border bg-blastoff-bg py-2 text-xs text-blastoff-text-secondary transition-all hover:text-blastoff-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              Max
            </button>
          </div>
          <p className="mt-2 text-xs text-blastoff-text-muted">
            Balance: {isBuy ? `${mockWethBalance.toFixed(4)} WETH` : `${mockTokenBalance.toLocaleString()} ${token.symbol}`}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="bg-blastoff-border p-2">
            <svg className="h-4 w-4 text-blastoff-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-blastoff-text-secondary">
            {isBuy ? 'You receive' : 'You get'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={quote?.outputAmount.toFixed(4) || '0.0'}
              readOnly
              className="w-full border border-blastoff-border bg-blastoff-bg px-4 py-3 pr-16 text-lg text-blastoff-text-secondary"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-blastoff-text-secondary">
              {isBuy ? token.symbol : 'WETH'}
            </span>
          </div>
        </div>
      </div>

      {quote && parseFloat(amount) > 0 && (
        <div className="mb-4 space-y-1 bg-blastoff-bg p-3 text-xs">
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

      {!isConnected ? (
        <button
          onClick={() => openModal('walletConnect')}
          className="w-full bg-blastoff-orange py-3 font-medium text-white transition-all hover:bg-blastoff-orange-light hover:shadow-glow-orange"
        >
          Connect Wallet
        </button>
      ) : txStatus === 'pending' ? (
        <button
          disabled
          className="flex w-full items-center justify-center gap-2 bg-blastoff-orange/50 py-3 font-medium text-white"
        >
          <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent" />
          Processing...
        </button>
      ) : txStatus === 'success' ? (
        <button
          disabled
          className="w-full bg-blastoff-success py-3 font-medium text-white"
        >
          Success!
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={!amount || parseFloat(amount) <= 0}
          className={`w-full py-3 font-medium text-white transition-all disabled:cursor-not-allowed disabled:bg-blastoff-border disabled:text-blastoff-text-muted ${
            isBuy 
              ? 'bg-blastoff-success/80 hover:bg-blastoff-success hover:shadow-glow-green' 
              : 'bg-blastoff-error/80 hover:bg-blastoff-error hover:shadow-glow-red'
          }`}
        >
          {isBuy ? 'Buy' : 'Sell'} {token.symbol}
        </button>
      )}
    </div>
  );
}
