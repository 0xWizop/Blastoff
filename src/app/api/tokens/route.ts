import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { db } from '@/lib/firebaseAdmin';
import { getTokenLiveStats } from '@/lib/chainUtils';
import { mapTokenData } from '@/lib/firestoreTokenMap';
import { DEFAULT_CHAIN_ID } from '@/config/contracts';

export const runtime = 'nodejs';

const BATCH_SIZE = 12;
const LIST_TRADES_LIMIT = 40;
const DEFAULT_SUPPLY = 1e9;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const live = url.searchParams.get('live') === 'true';
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;

    const snapshot = await db.collection('TokenData').get();
    let tokens = snapshot.docs.map((d) => mapTokenData(d.id, d.data()));

    if (live && tokens.length > 0) {
      const withAddress = tokens.filter((t) => t.address && isAddress(t.address));
      for (let i = 0; i < withAddress.length; i += BATCH_SIZE) {
        const batch = withAddress.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map((t) =>
            getTokenLiveStats(
              t.address as `0x${string}`,
              chainId,
              Number(t.totalSupply) || DEFAULT_SUPPLY,
              LIST_TRADES_LIMIT
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
    }

    return NextResponse.json({ tokens });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
