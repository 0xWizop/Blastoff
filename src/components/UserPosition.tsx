'use client';

import { useAccount } from 'wagmi';
import { useUserPosition } from '@/hooks/useTokens';
import { InlineLoader } from './Spinner';

interface UserPositionProps {
  tokenAddress: string;
  tokenSymbol: string;
}

export function UserPosition({ tokenAddress, tokenSymbol }: UserPositionProps) {
  const { address, isConnected } = useAccount();
  const { data: position, isLoading } = useUserPosition(tokenAddress, address);

  if (!isConnected) {
    return (
      <div className="border border-blastoff-border bg-blastoff-surface p-4">
        <h3 className="mb-3 font-display text-lg font-semibold text-blastoff-text">
          Your Position
        </h3>
        <p className="text-sm text-blastoff-text-muted">
          Connect wallet to view your position
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border border-blastoff-border bg-blastoff-surface p-4">
        <h3 className="mb-3 font-display text-lg font-semibold text-blastoff-text">
          Your Position
        </h3>
        <div className="flex items-center justify-center py-8">
          <InlineLoader />
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="border border-blastoff-border bg-blastoff-surface p-4">
        <h3 className="mb-3 font-display text-lg font-semibold text-blastoff-text">
          Your Position
        </h3>
        <p className="text-sm text-blastoff-text-muted">
          You don&apos;t have a position in this token
        </p>
      </div>
    );
  }

  const isProfitable = position.pnlUsd >= 0;

  return (
    <div className="border border-blastoff-border bg-blastoff-surface p-4">
      <h3 className="mb-4 font-display text-lg font-semibold text-blastoff-text">
        Your Position
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blastoff-bg p-3">
          <p className="text-xs text-blastoff-text-muted">Balance</p>
          <p className="font-mono text-lg text-blastoff-text">
            {position.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-blastoff-text-secondary">{tokenSymbol}</p>
        </div>
        
        <div className="bg-blastoff-bg p-3">
          <p className="text-xs text-blastoff-text-muted">Avg Entry</p>
          <p className="font-mono text-lg text-blastoff-text">
            ${position.averageEntry.toFixed(6)}
          </p>
        </div>
        
        <div className="bg-blastoff-bg p-3">
          <p className="text-xs text-blastoff-text-muted">Current Value</p>
          <p className="font-mono text-lg text-blastoff-text">
            ${position.currentValue.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-blastoff-bg p-3">
          <p className="text-xs text-blastoff-text-muted">PnL</p>
          <p className={`font-mono text-lg ${isProfitable ? 'text-blastoff-success' : 'text-blastoff-error'}`}>
            {isProfitable ? '+' : ''}{position.pnlUsd.toFixed(2)} USD
          </p>
          <p className={`text-xs ${isProfitable ? 'text-blastoff-success' : 'text-blastoff-error'}`}>
            {isProfitable ? '+' : ''}{position.pnlPercent.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}
