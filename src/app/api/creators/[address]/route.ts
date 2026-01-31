import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  try {
    const creatorAddress = params.address.toLowerCase();
    const snapshot = await db
      .collection('TokenData')
      .where('creatorAddress', '==', creatorAddress)
      .get();

    const tokens = snapshot.docs.map((d) => ({
      address: d.id,
      ...d.data(),
    }));

    const totalVolume = tokens.reduce((sum, t: any) => sum + (t.volume24h || 0), 0);
    const totalMarketCap = tokens.reduce((sum, t: any) => sum + (t.marketCap || 0), 0);
    const totalTokens = tokens.length;
    const successRate =
      totalTokens === 0 ? 0 : (tokens.filter((t: any) => t.status === 'LIVE').length / totalTokens) * 100;
    const firstLaunch = tokens.length
      ? Math.min(...tokens.map((t: any) => t.startTime || Date.now()))
      : null;

    return NextResponse.json({
      tokens,
      stats: {
        totalTokens,
        totalVolume,
        totalMarketCap,
        successRate,
        firstLaunch,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
