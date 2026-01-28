'use client';

import { useRouter } from 'next/navigation';
import { useAppStore, LaunchDex } from '@/store/useAppStore';

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function TokenCreatedModal() {
  const router = useRouter();
  const { createdToken, closeModal, openModal, setLaunchDraft } = useAppStore();

  const onClose = () => closeModal('tokenCreated');

  const onCopy = async () => {
    if (!createdToken?.address) return;
    try {
      await navigator.clipboard.writeText(createdToken.address);
    } catch {
      // ignore
    }
  };

  const openLaunch = (dex: LaunchDex) => {
    if (!createdToken) return;
    setLaunchDraft({
      dex,
      feeTier: 3000,
      initialPriceWeth: 0.000001,
      wethLiquidity: 0.1,
      slippage: 1,
    });
    closeModal('tokenCreated');
    openModal('launchToken');
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative mx-auto mt-24 w-[min(640px,calc(100vw-2rem))] border border-blastoff-border bg-blastoff-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-blastoff-text">Token Created</h2>
          <button onClick={onClose} className="text-blastoff-text-secondary hover:text-blastoff-text">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {createdToken ? (
          <>
            <div className="border border-blastoff-border bg-blastoff-bg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blastoff-text">{createdToken.name} ({createdToken.symbol})</div>
                  <div className="mt-1 font-mono text-xs text-blastoff-text-muted">{shortenAddress(createdToken.address)}</div>
                </div>
                <button
                  onClick={onCopy}
                  className="border border-blastoff-border bg-blastoff-surface px-3 py-2 text-xs text-blastoff-text-secondary hover:text-blastoff-text"
                >
                  Copy Address
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                onClick={() => {
                  router.push(`/token/${createdToken.address}`);
                  closeModal('tokenCreated');
                }}
                className="border border-blastoff-border bg-blastoff-bg px-4 py-2 text-sm text-blastoff-text-secondary transition-all hover:text-blastoff-text"
              >
                View Token Page
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => openLaunch('AERODROME')}
                  className="bg-blastoff-surface px-4 py-2 text-sm font-medium text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-text border border-blastoff-border"
                >
                  Launch on Aerodrome
                </button>
                <button
                  onClick={() => openLaunch('UNISWAP_V3')}
                  className="bg-blastoff-orange px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blastoff-orange-light"
                >
                  Launch on Uniswap V3
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-blastoff-text-secondary">No token draft found.</div>
        )}
      </div>
    </div>
  );
}
