'use client';

import { useAccount, useChainId } from 'wagmi';
import { base } from 'wagmi/chains';

export function NetworkBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  
  const isCorrectNetwork = chainId === base.id;

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 bg-blastoff-surface px-3 py-1.5 text-sm border border-blastoff-border">
        <div className="h-2 w-2 bg-blastoff-text-muted" />
        <span className="text-blastoff-text-secondary">Base</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-blastoff-surface px-3 py-1.5 text-sm border border-blastoff-border">
      <div
        className={`h-2 w-2 ${
          isCorrectNetwork ? 'bg-[#0052FF]' : 'bg-blastoff-error'
        }`}
      />
      <span className="text-blastoff-text-secondary">
        {isCorrectNetwork ? 'Base' : 'Wrong Network'}
      </span>
    </div>
  );
}
