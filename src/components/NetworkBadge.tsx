'use client';

import { useAccount, useChainId } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import Image from 'next/image';

// Base chain logo
const BASE_LOGO = 'https://i.imgur.com/mOH2omk.png';

export function NetworkBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  
  const isBase = chainId === base.id;
  const isBaseSepolia = chainId === baseSepolia.id;
  const isSupported = isBase || isBaseSepolia;

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 bg-blastoff-surface px-3 py-2 text-sm font-medium border border-blastoff-border h-[38px]">
        <Image 
          src={BASE_LOGO} 
          alt="Base" 
          width={16} 
          height={16} 
          className="rounded-full opacity-50"
        />
        <span className="text-blastoff-text-secondary">Base</span>
      </div>
    );
  }

  const networkName = isBase ? 'Base' : isBaseSepolia ? 'Sepolia' : 'Wrong Network';

  return (
    <div className={`flex items-center gap-2 bg-blastoff-surface px-3 py-2 text-sm font-medium border h-[38px] ${
      isSupported ? 'border-blastoff-border' : 'border-blastoff-error'
    }`}>
      {isSupported ? (
        <div className="relative">
          <Image 
            src={BASE_LOGO} 
            alt={networkName} 
            width={16} 
            height={16} 
            className="rounded-full"
          />
          {isBaseSepolia && (
            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-yellow-500 border border-blastoff-surface" />
          )}
        </div>
      ) : (
        <div className="h-4 w-4 rounded-full bg-blastoff-error flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">!</span>
        </div>
      )}
      <span className={isSupported ? 'text-blastoff-text-secondary' : 'text-blastoff-error'}>
        {networkName}
      </span>
    </div>
  );
}
