'use client';

import { useRef, useState } from 'react';
import { Token } from '@/types';
import { toast } from 'sonner';

interface ShareCardProps {
  token: Token;
  onClose: () => void;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

export function ShareCard({ token, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCopying, setIsCopying] = useState(false);

  const shareUrl = `https://blastoff.app/token/${token.address}`;
  
  const shareText = `Check out $${token.symbol} on @BlastoffBase! 🚀

💰 Price: $${token.price.toFixed(6)}
📊 MCap: ${formatNumber(token.marketCap || 0)}
📈 24h: ${(token.priceChange24h || 0) >= 0 ? '+' : ''}${(token.priceChange24h || 0).toFixed(2)}%

${shareUrl}`;

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank');
    toast.success('Opening Twitter...');
  };

  const shareToTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
    toast.success('Opening Telegram...');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Share text copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const isPositive = (token.priceChange24h || 0) >= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <div className="relative w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-blastoff-text-secondary hover:text-blastoff-text transition-colors"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Share Card Preview */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-blastoff-border p-6 mb-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blastoff-orange/20 flex items-center justify-center text-xl font-bold text-blastoff-orange">
                {token.symbol.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">${token.symbol}</h2>
                <p className="text-sm text-gray-400">{token.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">24h change</p>
            </div>
          </div>

          {/* Price */}
          <div className="bg-black/30 p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <p className="text-3xl font-bold text-white font-mono">
              ${token.price < 0.0001 ? token.price.toExponential(2) : token.price.toFixed(6)}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-black/30 p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase">MCap</p>
              <p className="text-sm font-bold text-white">{formatNumber(token.marketCap || 0)}</p>
            </div>
            <div className="bg-black/30 p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase">Volume</p>
              <p className="text-sm font-bold text-white">{formatNumber(token.volume24h || 0)}</p>
            </div>
            <div className="bg-black/30 p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase">Liquidity</p>
              <p className="text-sm font-bold text-white">{formatNumber(token.liquidity || 0)}</p>
            </div>
          </div>

          {/* Branding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blastoff-orange font-display font-bold text-lg">BLASTOFF</span>
              <span className="text-xs text-gray-500">on Base</span>
            </div>
            <div className="text-[10px] text-gray-600 font-mono">
              {token.address.slice(0, 8)}...{token.address.slice(-6)}
            </div>
          </div>
        </div>

        {/* Share Actions */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={shareToTwitter}
            className="flex items-center justify-center gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white py-3 px-4 font-medium transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </button>
          <button
            onClick={shareToTelegram}
            className="flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b3] text-white py-3 px-4 font-medium transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-2 bg-blastoff-surface hover:bg-blastoff-border text-blastoff-text py-3 px-4 font-medium border border-blastoff-border transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Copy Link
          </button>
          <button
            onClick={copyText}
            className="flex items-center justify-center gap-2 bg-blastoff-surface hover:bg-blastoff-border text-blastoff-text py-3 px-4 font-medium border border-blastoff-border transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Text
          </button>
        </div>
      </div>
    </div>
  );
}
