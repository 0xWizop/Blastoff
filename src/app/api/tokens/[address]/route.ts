import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { db } from '@/lib/firebaseAdmin';
import { getTokenICOStats, getTokenTrades, getTokenHolders } from '@/lib/chainUtils';
import { DEFAULT_CHAIN_ID } from '@/config/contracts';

export const runtime = 'nodejs';

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

export async function GET(
  req: Request,
  { params }: { params: { address: string } }
) {
  try {
    const url = new URL(req.url);
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;

    // First try to find by document ID
    let doc = await db.collection('TokenData').doc(params.address).get();
    
    // If not found, try to find by contractID field
    if (!doc.exists) {
      const snapshot = await db
        .collection('TokenData')
        .where('contractID', '==', params.address)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        doc = snapshot.docs[0];
      }
    }

    if (!doc.exists) {
      return NextResponse.json({ token: null }, { status: 404 });
    }

    const token = mapTokenData(doc.id, doc.data()!);
    const tokenAddress = token.address;

    // Merge live on-chain stats so price, mcap, volume, txns update after buys/sells
    if (tokenAddress && isAddress(tokenAddress)) {
      try {
        const [icoStats, trades, holdersData] = await Promise.all([
          getTokenICOStats(tokenAddress as `0x${string}`, chainId),
          getTokenTrades(tokenAddress as `0x${string}`, chainId, 300),
          getTokenHolders(tokenAddress as `0x${string}`, chainId, 10),
        ]);

        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const trades24h = trades.filter((t) => t.timestamp > oneDayAgo);
        const volume24h = trades24h.reduce((sum, t) => sum + t.totalValue, 0);
        const txCount24h = trades24h.length;

        token.price = icoStats.currentPrice;
        const supply = Number(token.totalSupply) || 1e9;
        token.marketCap = icoStats.currentPrice * supply;
        token.volume24h = volume24h;
        token.txCount24h = txCount24h;
        token.holders = holdersData.totalHolders;
      } catch (_) {
        // Keep Firebase values on chain error
      }
    }

    return NextResponse.json({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
