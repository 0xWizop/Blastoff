import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { db } from '@/lib/firebaseAdmin';
import { getTokenLiveStats } from '@/lib/chainUtils';
import { mapTokenData } from '@/lib/firestoreTokenMap';
import { DEFAULT_CHAIN_ID } from '@/config/contracts';

export const runtime = 'nodejs';

const TRENDING_LIMIT = 5;
const TRENDING_ENRICH_LIMIT = 40;
const DEFAULT_SUPPLY = 1e9;
const BATCH_SIZE = 8;

/**
 * Trending score: combines 24h volume and price momentum so big gainers/losers rank.
 * score = log10(volume24h_ETH + 1) * 50 + abs(priceChange24h)
 */
function trendingScore(volume24h: number, priceChange24h: number): number {
  const vol = Math.max(0, volume24h);
  const change = Math.abs(priceChange24h ?? 0);
  return Math.log10(vol + 1) * 50 + change;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;

    // Get ALL tokens (no Firebase volume filter) so tokens with on-chain activity but stale Firebase data are included
    const snapshot = await db.collection('TokenData').get();
    let tokens = snapshot.docs.map((d) => mapTokenData(d.id, d.data()));

    const withAddress = tokens
      .filter((t) => t.address && isAddress(t.address))
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, TRENDING_ENRICH_LIMIT);
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
