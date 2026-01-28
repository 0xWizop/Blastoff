'use client';

import { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useAppStore } from '@/store/useAppStore';

function randomAddress() {
  const hex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `0x${hex}`;
}

export function CreateTokenModal() {
  const { isConnected } = useAccount();
  const { closeModal, openModal, setCreatedToken } = useAppStore();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState('1000000000');
  const [decimals, setDecimals] = useState('18');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');

  const canSubmit = useMemo(() => {
    return (
      isConnected &&
      name.trim().length > 0 &&
      symbol.trim().length > 0 &&
      Number(supply) > 0 &&
      Number.isInteger(Number(decimals)) &&
      Number(decimals) >= 0 &&
      Number(decimals) <= 18
    );
  }, [isConnected, name, symbol, supply, decimals]);

  const onClose = () => closeModal('createToken');

  const onCreate = () => {
    if (!canSubmit) return;

    const address = randomAddress();

    setCreatedToken({
      address,
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      supply: Number(supply),
      decimals: Number(decimals),
      website: website.trim() || undefined,
      twitter: twitter.trim() || undefined,
      telegram: telegram.trim() || undefined,
      discord: discord.trim() || undefined,
    });

    closeModal('createToken');
    openModal('tokenCreated');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-[min(720px,100%)] border border-blastoff-border bg-blastoff-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-blastoff-text">Create Token</h2>
          <button onClick={onClose} className="text-blastoff-text-secondary hover:text-blastoff-text">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isConnected && (
          <div className="mb-4 border border-blastoff-border bg-blastoff-bg p-3">
            <p className="text-sm text-blastoff-text-secondary">Connect wallet to create a token.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-blastoff-text-secondary">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              placeholder="Blast Token"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-blastoff-text-secondary">Symbol</label>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              placeholder="BLAST"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-blastoff-text-secondary">Supply</label>
            <input
              type="number"
              value={supply}
              onChange={(e) => setSupply(e.target.value)}
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              placeholder="1000000000"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-blastoff-text-secondary">Decimals</label>
            <input
              type="number"
              value={decimals}
              onChange={(e) => setDecimals(e.target.value)}
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              placeholder="18"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-blastoff-text-secondary">Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-blastoff-text-secondary">Twitter / X</label>
            <input
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              placeholder="@handle"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-blastoff-text-secondary">Telegram</label>
            <input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              placeholder="channel"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-blastoff-text-secondary">Discord</label>
            <input
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              className="w-full border border-blastoff-border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none focus:border-blastoff-orange"
              placeholder="https://discord.gg/..."
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border border-blastoff-border bg-blastoff-bg px-4 py-2 text-sm text-blastoff-text-secondary transition-all hover:text-blastoff-text"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={!canSubmit}
            className="bg-blastoff-orange px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blastoff-orange-light disabled:cursor-not-allowed disabled:bg-blastoff-border disabled:text-blastoff-text-muted"
          >
            Create Token
          </button>
        </div>
      </div>
    </div>
  );
}
