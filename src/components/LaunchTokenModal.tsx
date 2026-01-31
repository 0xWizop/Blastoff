'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { toast } from 'sonner';
import { useAppStore, LaunchDex } from '@/store/useAppStore';
import { useBalances } from '@/hooks/useBalances';
import { ButtonSpinner } from './Spinner';

const slippageOptions = [0.5, 1, 2, 5];
const feeTiers: { value: 500 | 3000 | 10000; label: string }[] = [
  { value: 500, label: '0.05%' },
  { value: 3000, label: '0.3%' },
  { value: 10000, label: '1%' },
];

export function LaunchTokenModal() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { createdToken, launchDraft, setLaunchDraft, closeModal } = useAppStore();
  const { data: balances, isLoading: isLoadingBalances } = useBalances();
  const [isLaunching, setIsLaunching] = useState(false);

  // Get WETH balance from balances hook
  const wethBalance = balances?.weth?.formatted ?? 0;

  const draft = launchDraft;

  const canSubmit = useMemo(() => {
    if (!isConnected) return false;
    if (!createdToken || !draft) return false;
    if (draft.wethLiquidity <= 0) return false;
    if (draft.wethLiquidity > wethBalance) return false;
    if (draft.initialPriceWeth <= 0) return false;
    if (draft.slippage <= 0) return false;
    if (draft.dex === 'UNISWAP_V3' && !draft.feeTier) return false;
    return true;
  }, [isConnected, createdToken, draft, wethBalance]);

  const onClose = () => closeModal('launchToken');

  const update = (patch: Partial<NonNullable<typeof draft>>) => {
    if (!draft) return;
    setLaunchDraft({ ...draft, ...patch });
  };

  const setPct = (pct: number) => {
    const v = (wethBalance * pct) / 100;
    update({ wethLiquidity: Number(v.toFixed(4)) });
  };

  const onLaunch = async () => {
    if (!canSubmit) return;
    
    setIsLaunching(true);
    const launchToast = toast.loading('Launching token...', {
      description: 'Please confirm the transaction in your wallet',
    });

    try {
      const res = await fetch('/api/tokens/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: createdToken.address,
          dex: draft.dex,
          initialPriceWeth: draft.initialPriceWeth,
          wethLiquidity: draft.wethLiquidity,
          feeTier: draft.feeTier,
          chainId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to launch token');
      }

      toast.success('Token launched!', {
        id: launchToast,
        description: `${createdToken.symbol} is live`,
      });
      closeModal('launchToken');
    } catch (error) {
      toast.error('Failed to launch token', {
        id: launchToast,
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLaunching(false);
    }
  };

  if (!createdToken || !draft) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative mx-auto mt-16 w-[min(760px,calc(100vw-2rem))] border border-blastoff-border bg-blastoff-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-blastoff-text">Launch Token</h2>
          <button onClick={onClose} className="text-blastoff-text-secondary hover:text-blastoff-text">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isConnected && (
          <div className="mb-4 border border-blastoff-border bg-blastoff-bg p-3">
            <p className="text-sm text-blastoff-text-secondary">Connect wallet to launch.</p>
          </div>
        )}

        <div className="mb-4 border border-blastoff-border bg-blastoff-bg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blastoff-text">{createdToken.name} ({createdToken.symbol})</div>
              <div className="mt-1 text-xs text-blastoff-text-muted">Pair: {createdToken.symbol}/WETH</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blastoff-text-muted">WETH Balance</div>
              <div className="font-mono text-sm text-blastoff-text">
                {isLoadingBalances ? (
                  <span className="text-blastoff-text-muted">Loading...</span>
                ) : (
                  `${wethBalance.toFixed(4)} WETH`
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-blastoff-text-secondary">DEX</p>
            <div className="flex gap-2">
              <button
                onClick={() => update({ dex: 'AERODROME' })}
                className={`flex-1 border border-blastoff-border px-4 py-2 text-sm font-medium transition-all ${
                  draft.dex === 'AERODROME'
                    ? 'bg-blastoff-orange text-white'
                    : 'bg-blastoff-bg text-blastoff-text-secondary hover:text-blastoff-text'
                }`}
              >
                Aerodrome
              </button>
              <button
                onClick={() => update({ dex: 'UNISWAP_V3' })}
                className={`flex-1 border border-blastoff-border px-4 py-2 text-sm font-medium transition-all ${
                  draft.dex === 'UNISWAP_V3'
                    ? 'bg-blastoff-orange text-white'
                    : 'bg-blastoff-bg text-blastoff-text-secondary hover:text-blastoff-text'
                }`}
              >
                Uniswap V3
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-blastoff-text-secondary">Slippage</p>
            <div className="flex gap-2">
              {slippageOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => update({ slippage: opt })}
                  className={`flex-1 border border-blastoff-border py-2 text-sm font-medium transition-all ${
                    draft.slippage === opt
                      ? 'bg-blastoff-orange text-white'
                      : 'bg-blastoff-bg text-blastoff-text-secondary hover:text-blastoff-text'
                  }`}
                >
                  {opt}%
                </button>
              ))}
            </div>
          </div>

          {draft.dex === 'UNISWAP_V3' && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-blastoff-text-secondary">Uniswap V3 Fee Tier</label>
              <select
                value={draft.feeTier}
                onChange={(e) => update({ feeTier: Number(e.target.value) as 500 | 3000 | 10000 })}
                className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              >
                {feeTiers.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-blastoff-text-secondary">Initial Price (1 {createdToken.symbol} = WETH)</label>
            <input
              type="number"
              value={draft.initialPriceWeth}
              onChange={(e) => update({ initialPriceWeth: Number(e.target.value) })}
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              placeholder="0.000001"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-blastoff-text-secondary">WETH Liquidity</label>
            <input
              type="number"
              value={draft.wethLiquidity}
              onChange={(e) => update({ wethLiquidity: Number(e.target.value) })}
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              placeholder="0.1"
            />
            <div className="mt-2 flex gap-2">
              <button onClick={() => setPct(25)} className="flex-1 border border-blastoff-border bg-blastoff-bg py-2 text-xs text-blastoff-text-secondary hover:text-blastoff-text">
                25%
              </button>
              <button onClick={() => setPct(50)} className="flex-1 border border-blastoff-border bg-blastoff-bg py-2 text-xs text-blastoff-text-secondary hover:text-blastoff-text">
                50%
              </button>
              <button onClick={() => setPct(75)} className="flex-1 border border-blastoff-border bg-blastoff-bg py-2 text-xs text-blastoff-text-secondary hover:text-blastoff-text">
                75%
              </button>
              <button onClick={() => setPct(100)} className="flex-1 border border-blastoff-border bg-blastoff-bg py-2 text-xs text-blastoff-text-secondary hover:text-blastoff-text">
                Max
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isLaunching}
            className="border border-blastoff-border bg-blastoff-bg px-4 py-2 text-sm text-blastoff-text-secondary transition-all hover:text-blastoff-text disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onLaunch}
            disabled={!canSubmit || isLaunching}
            className="flex items-center gap-2 bg-blastoff-orange px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blastoff-orange-light disabled:cursor-not-allowed disabled:bg-blastoff-border disabled:text-blastoff-text-muted"
          >
            {isLaunching ? (
              <>
                <ButtonSpinner />
                Launching...
              </>
            ) : (
              'Launch'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
