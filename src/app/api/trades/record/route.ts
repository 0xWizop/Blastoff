import { NextResponse } from 'next/server';
import { createPublicClient, http, isAddress } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { db } from '@/lib/firebaseAdmin';
import { getChainConfig } from '@/config/contracts';

export const runtime = 'nodejs';

function getChain(chainId?: number) {
  return chainId === 84532 ? baseSepolia : base;
}

/**
 * POST /api/trades/record
 * Record a swap for PnL tracking. Call after tx is confirmed.
 * Body: { txHash, tokenAddress, wallet, isBuy, inputAmount, outputAmount, chainId }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      txHash,
      tokenAddress,
      wallet,
      isBuy,
      inputAmount,
      outputAmount,
      chainId,
    } = body as {
      txHash: string;
      tokenAddress: string;
      wallet: string;
      isBuy: boolean;
      inputAmount: number;
      outputAmount: number;
      chainId?: number;
    };

    if (!txHash || !tokenAddress || !isAddress(tokenAddress) || !wallet || !isAddress(wallet)) {
      return NextResponse.json({ error: 'Missing or invalid txHash, tokenAddress, wallet' }, { status: 400 });
    }
    if (typeof isBuy !== 'boolean' || typeof inputAmount !== 'number' || typeof outputAmount !== 'number') {
      return NextResponse.json({ error: 'Invalid isBuy, inputAmount, or outputAmount' }, { status: 400 });
    }

    const chainConfig = getChainConfig(chainId);
    const client = createPublicClient({
      chain: getChain(chainConfig.chainId),
      transport: http(chainConfig.rpcUrl),
    });

    const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
    if (!receipt || receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction not found or failed' }, { status: 400 });
    }

    let priceUsd = 0;
    try {
      const doc = await db.collection('TokenData').doc(tokenAddress).get();
      const data = doc.data();
      priceUsd = Number(data?.price ?? data?.priceUsd ?? 0);
    } catch {
      // use 0 if no price
    }

    const now = Date.now();
    const walletLower = wallet.toLowerCase();
    const tokenLower = tokenAddress.toLowerCase();

    const tradeDoc = {
      walletAddress: walletLower,
      tokenAddress: tokenLower,
      type: isBuy ? 'buy' : 'sell',
      tokenAmount: isBuy ? outputAmount : inputAmount,
      quoteAmount: isBuy ? inputAmount : outputAmount,
      priceUsd,
      txHash,
      timestamp: now,
      chainId: chainId ?? 8453,
    };

    await db.collection('TradeHistory').add(tradeDoc);

    const positionId = `${walletLower}_${tokenLower}`;
    const posRef = db.collection('UserPositions').doc(positionId);

    const existing = await posRef.get();
    const data = existing.data();
    let totalCostBasisUsd = Number(data?.totalCostBasisUsd ?? 0);
    let totalTokenAmount = Number(data?.totalTokenAmount ?? 0);

    if (isBuy) {
      totalCostBasisUsd += outputAmount * priceUsd;
      totalTokenAmount += outputAmount;
    } else {
      if (totalTokenAmount <= 0) {
        totalCostBasisUsd = 0;
        totalTokenAmount = 0;
      } else {
        const ratio = Math.min(inputAmount / totalTokenAmount, 1);
        totalCostBasisUsd *= 1 - ratio;
        totalTokenAmount -= inputAmount;
        if (totalTokenAmount < 0) totalTokenAmount = 0;
        if (totalTokenAmount === 0) totalCostBasisUsd = 0;
      }
    }

    await posRef.set({
      walletAddress: walletLower,
      tokenAddress: tokenLower,
      totalCostBasisUsd,
      totalTokenAmount,
      lastUpdated: now,
    }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
