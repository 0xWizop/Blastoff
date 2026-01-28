'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { WalletButton } from './WalletButton';
import { NetworkBadge } from './NetworkBadge';

export function Header() {
  const { openModal } = useAppStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blastoff-border bg-blastoff-bg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/app" className="flex items-center gap-2">
          <span className="font-logo text-2xl tracking-[0.08em] text-blastoff-orange">
            BLASTOFF
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => openModal('createToken')}
            className="border border-blastoff-border bg-blastoff-surface px-4 py-2 text-sm font-medium text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-text"
          >
            Create
          </button>
          <NetworkBadge />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
