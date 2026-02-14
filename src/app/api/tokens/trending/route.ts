import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { db } from '@/lib/firebaseAdmin';
import { getTokenLiveStats } from '@/lib/chainUtils';
import { DEFAULT_CHAIN_ID } from '@/config/contracts';

export const runtime = 'nodejs';

const TRENDING_LIMIT = 5;
const DEFAULT_SUPPLY = 1e9;
const BATCH_SIZE = 8;

/**
 * Trending score: combines 24h volume and price momentum so big gainers/losers rank.
 * score = log10(volume24h_ETH + 1) * 50 + abs(priceChange24h)
 * So 1300% gain gives +1300; 1 ETH volume gives ~35. Momentum dominates but volume matters.
 */
function trendingScore(volume24h: number, priceChange24h: number): number {
  const vol = Math.max(0, volume24h);
  const change = Math.abs(priceChange24h ?? 0);
  return Math.log10(vol + 1) * 50 + change;
}

// Map Firebase TokenData fields to frontend Token format
function mapTokenData(docId: string, data: FirebaseFirestore.DocumentData) {
  let createdAt = data.createdAt;
  let startTime = 0;
  if (createdAt && typeof createdAt === 'object' && '_seconds' in createdAt) {
    startTime = createdAt._seconds * 1000;
    createdAt = new Date(startTime).toISOString();
  } else if (typeof createdAt === 'string') {
    startTime = new Date(createdAt).getTime();
  }

  return {
    address: data.contractID && data.contractID !== 'error' ? data.contractID : docId,
    id: docId,
    name: data.name || 'Unknown',
    symbol: data.symbol || '???',
    logoUrl: data.image || '',
    description: data.description || '',
    creatorAddress: data.creatorAddress || data.account || null,
    totalSupply: data.totalSupply || 0,
    volume24h: data.volume || 0,
    marketCap: data.marketCap || 0,
    price: data.price || data.priceUsd || 0,
    priceChange24h: data.priceChange24h || data.change24h || 0,
    status: data.status || 'LIVE',
    createdAt,
    startTime,
    endTime: startTime + (30 * 24 * 60 * 60 * 1000),
    raised: data.raised || 0,
    hardCap: data.hardCap || 100,
    softCap: data.softCap || 10,
    website: data.website || '',
    twitter: data.twitter || '',
    telegram: data.telegram || '',
    discord: data.discord || '',
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;

    // Get ALL tokens (no Firebase volume filter) so tokens with on-chain activity but stale Firebase data are included
    const snapshot = await db.collection('TokenData').get();
    let tokens = snapshot.docs.map((d) => mapTokenData(d.id, d.data()));

    const withAddress = tokens.filter((t) => t.address && isAddress(t.address));
    for (let i = 0; i < withAddress.length; i += BATCH_SIZE) {
      const batch = withAddress.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((t) =>
          getTokenLiveStats(
            t.address as `0x${string}`,
            chainId,
            Number(t.totalSupply) || DEFAULT_SUPPLY,
            60
          )
        )
      );
      const statsByAddress = new Map(batch.map((t, j) => [t.address.toLowerCase(), results[j]]));
      tokens = tokens.map((t) => {
        const stats = t.address ? statsByAddress.get(t.address.toLowerCase()) : null;
        if (!stats) return t;
        return {
          ...t,
          price: stats.price || t.price,
          marketCap: stats.marketCap,
          volume24h: stats.volume24h,
          priceChange24h: stats.priceChange24h,
        };
      });
    }

    // Filter to tokens with some on-chain activity, then sort by trending score
    const withActivity = tokens.filter(
      (t) => (t.volume24h ?? 0) > 0 || (t.priceChange24h != null && t.priceChange24h !== 0)
    );
    withActivity.sort(
      (a, b) =>
        trendingScore(b.volume24h ?? 0, b.priceChange24h ?? 0) -
        trendingScore(a.volume24h ?? 0, a.priceChange24h ?? 0)
    );

    return NextResponse.json({ tokens: withActivity.slice(0, TRENDING_LIMIT) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
