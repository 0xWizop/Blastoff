import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { db } from '@/lib/firebaseAdmin';
import { getTokenLiveStats, getTokenAddressesFromFactory, getTokenMetadataFromChain, getClient } from '@/lib/chainUtils';
import { mapTokenData } from '@/lib/firestoreTokenMap';
import { getContracts, DEFAULT_CHAIN_ID, DEFAULT_INITIAL_PRICE } from '@/config/contracts';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Keep homepage snappy: small batches and shallow trade lookback
const BATCH_SIZE = 8;
const LIST_TRADES_LIMIT = 30;
const DEFAULT_SUPPLY = 1e9;
/** Cap how many tokens we enrich so the request returns in reasonable time (avoids timeout / endless loading) */
const MAX_ENRICH = 16;
/** Max factory tokens to merge from chain when Firebase is empty or missing tokens */
const MAX_FACTORY_TOKENS = 50;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const live = url.searchParams.get('live') === 'true';
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;
    const contracts = getContracts(chainId);

    // Always fetch Firebase tokens first (fast, reliable)
    const snapshot = await db.collection('TokenData').get();
    let tokens = snapshot.docs.map((d) => mapTokenData(d.id, d.data()));

    // Try to add factory tokens (non-blocking - if it fails, we still return Firebase tokens).
    // IMPORTANT: Only do this when live=true so the fast (non-live) homepage query stays snappy.
    const firebaseAddresses = new Set(tokens.map((t) => (t.address || '').toLowerCase()));
    if (live && contracts.TOKEN_FACTORY) {
      try {
        const factoryMints = await getTokenAddressesFromFactory(chainId, 80000);
        const client = getClient(chainId);
        let added = 0;
        for (const mint of factoryMints) {
          if (added >= MAX_FACTORY_TOKENS) break;
          const addr = mint.address.toLowerCase();
          if (firebaseAddresses.has(addr)) continue;
          firebaseAddresses.add(addr);
          try {
            const block = await client.getBlock({ blockNumber: mint.blockNumber });
            const startTime = Number(block.timestamp) * 1000;
            const meta = await getTokenMetadataFromChain(mint.address, startTime, chainId);
            tokens.push({
              address: meta.address,
              id: meta.address,
              name: meta.name,
              symbol: meta.symbol,
              logoUrl: '',
              description: '',
              creatorAddress: mint.creator,
              totalSupply: meta.totalSupply ?? DEFAULT_SUPPLY,
              volume24h: 0,
              marketCap: 0,
              price: DEFAULT_INITIAL_PRICE,
              priceChange24h: 0,
              status: 'LIVE',
              createdAt: new Date(startTime).toISOString(),
              startTime,
              endTime: startTime + 30 * 24 * 60 * 60 * 1000,
              raised: 0,
              hardCap: 100,
              softCap: 10,
              website: '',
              twitter: '',
              telegram: '',
              discord: '',
            });
            added++;
          } catch (e) {
            console.warn('[Tokens API] Skip factory token metadata:', mint.address, e);
          }
        }
        tokens.sort((a, b) => (b.startTime ?? 0) - (a.startTime ?? 0));
      } catch (e) {
        console.warn('[Tokens API] Factory token fetch failed, using Firebase only:', e);
        // Continue with Firebase tokens only
      }
    }

    // NOTE: live=true enrichment has been moved to detail/trending routes to keep the homepage fast.
    // This endpoint now returns Firebase + optional factory tokens only.

    return NextResponse.json({ tokens });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
