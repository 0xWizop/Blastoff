import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { db } from '@/lib/firebaseAdmin';
import { getTokenLiveStats } from '@/lib/chainUtils';
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

    const rawData = doc.data()!;
    const token = mapTokenData(doc.id, rawData);
    const tokenAddress = token.address;

    // Merge live on-chain stats so price, mcap, volume, txns update after buys/sells.
    // Use the same lightweight helper as the homepage/trending so this stays reasonably fast.
    if (tokenAddress && isAddress(tokenAddress)) {
      try {
        const live = await getTokenLiveStats(tokenAddress as `0x${string}`, chainId, Number(token.totalSupply) || 1e9, 150);
        token.price = live.price;
        token.marketCap = live.marketCap;
        token.volume24h = live.volume24h;
        token.priceChange24h = live.priceChange24h;
        token.txCount24h = live.txCount24h;
        // Persist the latest stats back into Firestore so homepage/trending can show them quickly next time.
        const statsToPersist: Record<string, unknown> = {
          price: token.price,
          marketCap: token.marketCap,
          volume: token.volume24h,
          priceChange24h: token.priceChange24h,
          txCount24h: token.txCount24h,
        };
        db.collection('TokenData').doc(doc.id).update(statsToPersist).catch(() => {
          // Non-fatal: homepage will still use the in-memory values
        });
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
