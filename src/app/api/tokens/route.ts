import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { db } from '@/lib/firebaseAdmin';
import { getTokenLiveStats, getTokenAddressesFromFactory, getTokenMetadataFromChain, getClient } from '@/lib/chainUtils';
import { mapTokenData } from '@/lib/firestoreTokenMap';
import { getContracts, DEFAULT_CHAIN_ID } from '@/config/contracts';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BATCH_SIZE = 12;
const LIST_TRADES_LIMIT = 40;
const DEFAULT_SUPPLY = 1e9;
/** Cap how many tokens we enrich so the request returns in reasonable time (avoids timeout / endless loading) */
const MAX_ENRICH = 24;
/** Max factory tokens to merge from chain when Firebase is empty or missing tokens */
const MAX_FACTORY_TOKENS = 50;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const live = url.searchParams.get('live') === 'true';
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;
    const contracts = getContracts(chainId);

    const snapshot = await db.collection('TokenData').get();
    let tokens = snapshot.docs.map((d) => mapTokenData(d.id, d.data()));

    const firebaseAddresses = new Set(tokens.map((t) => (t.address || '').toLowerCase()));

    if (contracts.TOKEN_FACTORY) {
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
            price: 0.00003,
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
          console.warn('Skip factory token metadata:', mint.address, e);
        }
      }
      tokens.sort((a, b) => (b.startTime ?? 0) - (a.startTime ?? 0));
    }

    if (live && tokens.length > 0) {
      const withAddress = tokens.filter((t) => t.address && isAddress(t.address)).slice(0, MAX_ENRICH);
      for (let i = 0; i < withAddress.length; i += BATCH_SIZE) {
        const batch = withAddress.slice(i, i + BATCH_SIZE);
        const settled = await Promise.allSettled(
          batch.map((t) =>
            getTokenLiveStats(
              t.address as `0x${string}`,
              chainId,
              Number(t.totalSupply) || DEFAULT_SUPPLY,
              LIST_TRADES_LIMIT
            )
          )
        );
        const fallback = { price: 0, marketCap: 0, volume24h: 0, priceChange24h: 0, txCount24h: 0, holders: 0 };
        const results = settled.map((s) => (s.status === 'fulfilled' ? s.value : fallback));
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
            txCount24h: stats.txCount24h,
            holders: stats.holders,
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
