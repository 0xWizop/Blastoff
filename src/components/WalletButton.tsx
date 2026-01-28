'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useAppStore } from '@/store/useAppStore';

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { openModals, openModal, closeModal } = useAppStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        closeModal('walletConnect');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeModal]);

  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 bg-blastoff-surface px-4 py-2 text-sm font-medium text-blastoff-text-secondary border border-blastoff-border"
      >
        <div className="h-4 w-4 animate-spin border-2 border-blastoff-orange border-t-transparent" />
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 bg-blastoff-surface px-4 py-2 text-sm font-medium text-blastoff-text transition-all hover:bg-blastoff-border hover:shadow-glow-orange-sm border border-blastoff-border"
        >
          <div className="h-2 w-2 bg-blastoff-success" />
          {shortenAddress(address)}
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 border border-blastoff-border bg-blastoff-surface p-2 shadow-xl">
            <div className="border-b border-blastoff-border px-3 py-2">
              <p className="text-xs text-blastoff-text-muted">Connected</p>
              <p className="font-mono text-sm text-blastoff-text">{shortenAddress(address)}</p>
            </div>
            <div className="border-b border-blastoff-border px-3 py-2">
              <p className="text-xs text-blastoff-text-muted">Network</p>
              <p className="text-sm text-blastoff-text">Base</p>
            </div>
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="mt-2 w-full bg-blastoff-error/10 px-3 py-2 text-sm text-blastoff-error transition-colors hover:bg-blastoff-error/20"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => openModal('walletConnect')}
        className="bg-blastoff-orange px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blastoff-orange-light hover:shadow-glow-orange"
      >
        Connect Wallet
      </button>

      {openModals.walletConnect && (
        <div className="absolute right-0 top-full mt-2 w-64 border border-blastoff-border bg-blastoff-surface p-4 shadow-xl">
          <h3 className="mb-3 text-sm font-medium text-blastoff-text">Select Wallet</h3>
          <div className="space-y-2">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  connect({ connector });
                  closeModal('walletConnect');
                }}
                className="flex w-full items-center gap-3 border border-blastoff-border bg-blastoff-bg px-3 py-2.5 text-sm text-blastoff-text transition-all hover:border-blastoff-orange hover:shadow-glow-orange-sm"
              >
                <span>{connector.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
