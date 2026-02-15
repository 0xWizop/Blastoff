import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { db } from '@/lib/firebaseAdmin';
import { getTokenICOStats, getTokenTrades, getTokenHolders } from '@/lib/chainUtils';
import { mapTokenData } from '@/lib/firestoreTokenMap';
import { DEFAULT_CHAIN_ID } from '@/config/contracts';

export const runtime = 'nodejs';

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
