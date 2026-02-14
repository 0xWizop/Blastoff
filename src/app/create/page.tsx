'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId, useSendTransaction } from 'wagmi';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { ButtonSpinner } from '@/components/Spinner';

function isValidUrl(url: string): boolean {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidTwitterHandle(handle: string): boolean {
  if (!handle) return true;
  const clean = handle.startsWith('@') ? handle.slice(1) : handle;
  return /^[A-Za-z0-9_]{1,15}$/.test(clean);
}

function isValidTelegramHandle(handle: string): boolean {
  if (!handle) return true;
  const clean = handle.startsWith('@') ? handle.slice(1) : handle;
  return /^[A-Za-z0-9_]{5,32}$/.test(clean);
}

interface ValidationErrors {
  name?: string;
  symbol?: string;
  supply?: string;
  decimals?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export default function CreateTokenPage() {
  const router = useRouter();
  const { isConnected, address: walletAddress } = useAccount();
  const chainId = useChainId();
  const { sendTransactionAsync } = useSendTransaction();
  const { setCreatedToken, openModal } = useAppStore();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState('1000000000');
  const [decimals, setDecimals] = useState('18');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => new Set([...prev, field]));
  }, []);

  const errors = useMemo((): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!name.trim()) errs.name = 'Token name is required';
    else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    else if (name.trim().length > 32) errs.name = 'Name must be 32 characters or less';

    if (!symbol.trim()) errs.symbol = 'Symbol is required';
    else if (symbol.trim().length < 2) errs.symbol = 'Symbol must be at least 2 characters';
    else if (symbol.trim().length > 8) errs.symbol = 'Symbol must be 8 characters or less';
    else if (!/^[A-Za-z0-9]+$/.test(symbol.trim())) errs.symbol = 'Symbol can only contain letters and numbers';

    const supplyNum = Number(supply);
    if (!supply || isNaN(supplyNum)) errs.supply = 'Supply is required';
    else if (supplyNum <= 0) errs.supply = 'Supply must be greater than 0';
    else if (supplyNum > 1_000_000_000_000_000) errs.supply = 'Supply is too large';

    const decimalsNum = Number(decimals);
    if (isNaN(decimalsNum) || !Number.isInteger(decimalsNum)) errs.decimals = 'Decimals must be a whole number';
    else if (decimalsNum < 0 || decimalsNum > 18) errs.decimals = 'Decimals must be between 0 and 18';

    if (website && !isValidUrl(website)) errs.website = 'Please enter a valid URL';
    if (twitter && !isValidTwitterHandle(twitter)) errs.twitter = 'Invalid Twitter handle';
    if (telegram && !isValidTelegramHandle(telegram)) errs.telegram = 'Invalid Telegram handle';
    if (discord && !isValidUrl(discord)) errs.discord = 'Please enter a valid Discord invite URL';
    return errs;
  }, [name, symbol, supply, decimals, website, twitter, telegram, discord]);

  const hasErrors = Object.keys(errors).length > 0;
  const canSubmit = isConnected && !hasErrors;

  const getFieldError = (field: string): string | undefined => {
    if (!touched.has(field)) return undefined;
    return errors[field as keyof ValidationErrors];
  };

  const onCreate = async () => {
    setTouched(new Set(['name', 'symbol', 'supply', 'decimals', 'website', 'twitter', 'telegram', 'discord']));
    if (!canSubmit) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    setIsCreating(true);
    const createToast = toast.loading('Creating token...', {
      description: 'Please confirm the transaction in your wallet',
    });

    try {
      const buildRes = await fetch('/api/tokens/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          totalSupply: supply,
          decimals: Number(decimals),
          description: '',
          website: website.trim(),
          twitter: twitter.trim(),
          telegram: telegram.trim(),
          discord: discord.trim(),
          logoUrl: '',
          creatorAddress: walletAddress ?? undefined,
          chainId,
        }),
      });

      if (!buildRes.ok) {
        const body = await buildRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to build create transaction');
      }

      const { transaction } = await buildRes.json();
      const txHash = await sendTransactionAsync({
        to: transaction.to,
        data: transaction.data,
        value: BigInt(transaction.value || '0'),
      });

      toast.loading('Waiting for confirmation...', {
        id: createToast,
        description: 'Transaction submitted, waiting for block confirmation',
      });

      let receipt: { tokenAddress?: string } | null = null;
      let attempts = 0;
      const maxAttempts = 60;

      while (!receipt && attempts < maxAttempts) {
        try {
          const receiptRes = await fetch('/api/tokens/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim(),
              symbol: symbol.trim().toUpperCase(),
              totalSupply: supply,
              decimals: Number(decimals),
              description: '',
              website: website.trim(),
              twitter: twitter.trim(),
              telegram: telegram.trim(),
              discord: discord.trim(),
              logoUrl: '',
              creatorAddress: walletAddress ?? undefined,
              txHash,
              chainId,
            }),
          });

          if (receiptRes.ok) {
            receipt = await receiptRes.json();
            break;
          }
          const errorBody = await receiptRes.json().catch(() => ({}));
          if (
            errorBody.error?.includes('could not be found') ||
            errorBody.error?.includes('not found') ||
            errorBody.error?.includes('pending')
          ) {
            await new Promise((r) => setTimeout(r, 1000));
            attempts++;
            continue;
          }
          throw new Error(errorBody.error || 'Failed to finalize token');
        } catch (e) {
          if (attempts >= maxAttempts - 1) throw e;
          await new Promise((r) => setTimeout(r, 1000));
          attempts++;
        }
      }

      if (!receipt?.tokenAddress) {
        throw new Error(
          receipt
            ? 'Token address not returned from backend'
            : 'Transaction confirmation timed out. Check the block explorer.'
        );
      }

      const createdAddress = receipt.tokenAddress;
      toast.success('Token created!', {
        id: createToast,
        description: `$${symbol.trim().toUpperCase()} is ready to launch`,
      });

      setCreatedToken({
        address: createdAddress,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        supply: Number(supply),
        decimals: Number(decimals),
        website: website.trim() || undefined,
        twitter: twitter.trim() || undefined,
        telegram: telegram.trim() || undefined,
        discord: discord.trim() || undefined,
      });

      openModal('tokenCreated');
      router.push(`/token/${createdAddress}`);
    } catch (error) {
      toast.error('Failed to create token', {
        id: createToast,
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full border bg-blastoff-bg px-3 py-2 text-sm text-blastoff-text outline-none transition-colors ${
      getFieldError(field)
        ? 'border-red-500 focus:border-red-500'
        : 'border-blastoff-border focus:border-blastoff-orange'
    }`;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/app"
          className="mb-6 inline-flex items-center gap-2 text-sm text-blastoff-text-secondary transition-colors hover:text-blastoff-text"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to launches
        </Link>

        <div className="border border-blastoff-border bg-blastoff-surface p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-blastoff-text sm:text-3xl">Create Token</h1>
          <p className="mt-1 text-sm text-blastoff-text-secondary">
            Deploy a fair-launch token on Base. No presales—tokens go straight to bonding curve then DEX.
          </p>

          {!isConnected && (
            <div className="mt-6 border border-blastoff-border bg-blastoff-bg p-4">
              <p className="text-sm text-blastoff-text-secondary">
                Connect your wallet to create a token.
              </p>
            </div>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-blastoff-text-secondary">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => markTouched('name')}
                className={inputClass('name')}
                placeholder="Blast Token"
                maxLength={32}
              />
              {getFieldError('name') && <p className="mt-1 text-xs text-red-500">{getFieldError('name')}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-blastoff-text-secondary">
                Symbol <span className="text-red-500">*</span>
              </label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onBlur={() => markTouched('symbol')}
                className={inputClass('symbol')}
                placeholder="BLAST"
                maxLength={8}
              />
              {getFieldError('symbol') && <p className="mt-1 text-xs text-red-500">{getFieldError('symbol')}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-blastoff-text-secondary">
                Supply <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
                onBlur={() => markTouched('supply')}
                className={inputClass('supply')}
                placeholder="1000000000"
                min={1}
              />
              {getFieldError('supply') && <p className="mt-1 text-xs text-red-500">{getFieldError('supply')}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-blastoff-text-secondary">
                Decimals <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
                onBlur={() => markTouched('decimals')}
                className={inputClass('decimals')}
                placeholder="18"
                min={0}
                max={18}
              />
              {getFieldError('decimals') && <p className="mt-1 text-xs text-red-500">{getFieldError('decimals')}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-blastoff-text-secondary">Website</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                onBlur={() => markTouched('website')}
                className={inputClass('website')}
                placeholder="https://..."
              />
              {getFieldError('website') && <p className="mt-1 text-xs text-red-500">{getFieldError('website')}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-blastoff-text-secondary">Twitter / X</label>
              <input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                onBlur={() => markTouched('twitter')}
                className={inputClass('twitter')}
                placeholder="@handle"
              />
              {getFieldError('twitter') && <p className="mt-1 text-xs text-red-500">{getFieldError('twitter')}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-blastoff-text-secondary">Telegram</label>
              <input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                onBlur={() => markTouched('telegram')}
                className={inputClass('telegram')}
                placeholder="@channel"
              />
              {getFieldError('telegram') && <p className="mt-1 text-xs text-red-500">{getFieldError('telegram')}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-blastoff-text-secondary">Discord</label>
              <input
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                onBlur={() => markTouched('discord')}
                className={inputClass('discord')}
                placeholder="https://discord.gg/..."
              />
              {getFieldError('discord') && <p className="mt-1 text-xs text-red-500">{getFieldError('discord')}</p>}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/app"
              className="inline-flex justify-center border border-blastoff-border bg-blastoff-bg px-4 py-2.5 text-sm text-blastoff-text-secondary transition-all hover:text-blastoff-text disabled:opacity-50"
            >
              Cancel
            </Link>
            <button
              onClick={onCreate}
              disabled={!canSubmit || isCreating}
              className="inline-flex items-center justify-center gap-2 bg-blastoff-orange px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blastoff-orange-light disabled:cursor-not-allowed disabled:bg-blastoff-border disabled:text-blastoff-text-muted"
            >
              {isCreating ? (
                <>
                  <ButtonSpinner />
                  Creating...
                </>
              ) : (
                'Create Token'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
