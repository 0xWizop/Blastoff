'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Token } from '@/types';

interface CoinCardProps {
  token: Token;
}

function formatTimeAgo(startTime: number): string {
  const now = Date.now();
  const diff = now - startTime;

  if (diff <= 0) return 'just now';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ago`;
  if (hours > 0) return `${hours}h ${minutes}m ago`;
  return `${Math.max(minutes, 1)}m ago`;
}

export function CoinCard({ token }: CoinCardProps) {
  const router = useRouter();

  const socials = [
    token.website ? { key: 'website' as const, label: 'Website', href: token.website } : null,
    token.twitter
      ? {
          key: 'twitter' as const,
          label: 'Twitter',
          href: `https://twitter.com/${token.twitter.replace('@', '')}`,
        }
      : null,
    token.telegram
      ? { key: 'telegram' as const, label: 'Telegram', href: `https://t.me/${token.telegram}` }
      : null,
    token.discord ? { key: 'discord' as const, label: 'Discord', href: token.discord } : null,
  ].filter(Boolean) as { key: 'website' | 'twitter' | 'telegram' | 'discord'; label: string; href: string }[];

  return (
    <div
      className="cursor-pointer border border-blastoff-border bg-blastoff-surface p-5 transition-all duration-300 hover:border-blastoff-orange/50"
      onClick={() => router.push(`/token/${token.address}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          router.push(`/token/${token.address}`);
        }
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-blastoff-orange/20 text-lg font-bold text-blastoff-orange">
            {token.symbol.charAt(0)}
          </div>
          <div>
            <h3 className="font-medium text-blastoff-text">{token.symbol}</h3>
            <p className="text-sm text-blastoff-text-secondary">{token.name}</p>
          </div>
        </div>
        {socials.length > 0 && (
          <div className="flex items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center border border-blastoff-border bg-blastoff-bg text-blastoff-text-secondary transition-all hover:border-blastoff-orange hover:text-blastoff-orange"
                title={s.label}
                onClick={(e) => e.stopPropagation()}
              >
                {s.key === 'website' ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                ) : s.key === 'twitter' ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ) : s.key === 'telegram' ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="bg-blastoff-bg p-3">
          <p className="text-xs text-blastoff-text-muted">Market Cap</p>
          <p className="font-mono text-sm text-blastoff-text">
            ${(token.marketCap || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-blastoff-bg p-3">
          <p className="text-xs text-blastoff-text-muted">24h Volume</p>
          <p className="font-mono text-sm text-blastoff-text">
            ${(token.volume24h || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-blastoff-bg p-3">
          <p className="text-xs text-blastoff-text-muted">Price</p>
          <p className="font-mono text-sm text-blastoff-text">
            ${token.price.toFixed(6)}
          </p>
        </div>
        <div className="bg-blastoff-bg p-3">
          <p className="text-xs text-blastoff-text-muted">24h Change</p>
          <p className={`font-mono text-sm ${(token.priceChange24h || 0) >= 0 ? 'text-blastoff-success' : 'text-blastoff-error'}`}>
            {(token.priceChange24h || 0) >= 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-blastoff-text-muted">Launched</p>
          <p className="font-mono text-sm text-blastoff-text">{formatTimeAgo(token.startTime)}</p>
        </div>
        <Link
          href={`/token/${token.address}`}
          className="bg-blastoff-orange/10 px-4 py-2 text-sm font-medium text-blastoff-orange transition-all hover:bg-blastoff-orange hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          View Token
        </Link>
      </div>
    </div>
  );
}
