'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

export function NetworkBadge() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-2 rounded border border-blastoff-separator bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white/90">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blastoff-text-muted" aria-hidden />
        <span>[ NETWORK: ... ]</span>
      </div>
    );
  }

  const isBase = chainId === base.id;
  const isBaseSepolia = chainId === baseSepolia.id;
  const isSupported = isBase || isBaseSepolia;
  const networkName = isBase ? 'BASE L2' : isBaseSepolia ? 'BASE SEPOLIA' : 'WRONG NETWORK';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded border border-blastoff-separator bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider ${
        isSupported ? 'text-white/90' : 'border-blastoff-error/60 text-blastoff-error'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          isSupported ? 'bg-blastoff-success' : 'bg-blastoff-error'
        }`}
        aria-hidden
      />
      <span>[ NETWORK: {networkName} ]</span>
    </div>
  );
}
