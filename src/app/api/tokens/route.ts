import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { db } from '@/lib/firebaseAdmin';
import { getTokenLiveStats } from '@/lib/chainUtils';
import { DEFAULT_CHAIN_ID } from '@/config/contracts';

export const runtime = 'nodejs';

const BATCH_SIZE = 12;
const LIST_TRADES_LIMIT = 60;
const DEFAULT_SUPPLY = 1e9;

// Map Firebase TokenData fields to frontend Token format
function mapTokenData(docId: string, data: FirebaseFirestore.DocumentData) {
  // Handle Firestore timestamp
  let createdAt = data.createdAt;
  let startTime = 0;
  if (createdAt && typeof createdAt === 'object' && '_seconds' in createdAt) {
    startTime = createdAt._seconds * 1000;
    createdAt = new Date(startTime).toISOString();
  } else if (typeof createdAt === 'string') {
    startTime = new Date(createdAt).getTime();
  }

  return {
    // Use contractID as address if available, otherwise use doc ID
    address: data.contractID && data.contractID !== 'error' ? data.contractID : docId,
    id: docId,
    name: data.name || 'Unknown',
    symbol: data.symbol || '???',
    logoUrl: data.image || '',
    description: data.description || '',
    creatorAddress: data.creatorAddress || data.account || null,
    totalSupply: data.totalSupply || 0,
    volume24h: data.volume || 0,
    // Default values for missing fields
    marketCap: data.marketCap || 0,
    price: data.price || data.priceUsd || 0,
    priceChange24h: data.priceChange24h || data.change24h || 0,
    status: data.status || 'LIVE',
    createdAt,
    startTime,
    endTime: startTime + (30 * 24 * 60 * 60 * 1000), // Default 30 days from start
    raised: data.raised || 0,
    hardCap: data.hardCap || 100,
    softCap: data.softCap || 10,
    // Social links
    website: data.website || '',
    twitter: data.twitter || '',
    telegram: data.telegram || '',
    discord: data.discord || '',
  };
}

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
