import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getChainConfig } from '@/config/contracts';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      tokenAddress,
      dex,
      initialPriceWeth,
      wethLiquidity,
      feeTier,
      poolAddress,
      txHash,
      chainId,
    } = body as {
      tokenAddress: string;
      dex: 'UNISWAP_V3' | 'AERODROME';
      initialPriceWeth: number;
      wethLiquidity: number;
      feeTier?: number;
      poolAddress?: string;
      txHash?: string;
      chainId?: number;
    };

    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const chainConfig = getChainConfig(chainId);
    const now = Date.now();

    await db.collection('TokenData').doc(tokenAddress).set(
      {
        status: 'LIVE',
        dex: dex ?? 'UNISWAP_V3',
        initialPriceWeth: Number(initialPriceWeth || 0),
        wethLiquidity: Number(wethLiquidity || 0),
        feeTier: feeTier ?? null,
        poolAddress: poolAddress || '',
        launchTxHash: txHash || '',
        chainId: chainConfig.chainId,
        launchedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({
      status: 'ok',
      tokenAddress,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
