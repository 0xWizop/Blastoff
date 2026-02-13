import { NextResponse } from 'next/server';
import { createPublicClient, formatUnits, http, isAddress } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { erc20Abi } from '@/lib/abis';
import { getChainConfig } from '@/config/contracts';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function getChain(chainId?: number) {
  return chainId === 84532 ? baseSepolia : base;
}

export async function GET(
  req: Request,
  { params }: { params: { tokenAddress: string } }
) {
  try {
    const url = new URL(req.url);
    const wallet = url.searchParams.get('wallet');
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : undefined;
    const tokenAddress = params.tokenAddress;

    if (!wallet || !isAddress(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }
    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const chainConfig = getChainConfig(chainId);
    const client = createPublicClient({
      chain: getChain(chainConfig.chainId),
      transport: http(chainConfig.rpcUrl),
    });

    const decimals = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
    });

    const balance = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [wallet],
    });

    const formattedBalance = Number(formatUnits(balance, Number(decimals)));

    let price = 0;
    try {
      const doc = await db.collection('TokenData').doc(tokenAddress).get();
      const data = doc.data();
      price = Number(data?.price || 0);
    } catch {
      price = 0;
    }

    const currentValue = formattedBalance * price;

    let averageEntry = 0;
    let pnlUsd = 0;
    let pnlPercent = 0;

    try {
      const positionId = `${wallet.toLowerCase()}_${tokenAddress.toLowerCase()}`;
      const posDoc = await db.collection('UserPositions').doc(positionId).get();
      const posData = posDoc.data();
      const totalCostBasisUsd = Number(posData?.totalCostBasisUsd ?? 0);
      const totalTokenAmount = Number(posData?.totalTokenAmount ?? 0);

      if (totalTokenAmount > 0 && formattedBalance > 0) {
        averageEntry = totalCostBasisUsd / totalTokenAmount;
        const costBasisForCurrentBalance = totalCostBasisUsd * (formattedBalance / totalTokenAmount);
        pnlUsd = currentValue - costBasisForCurrentBalance;
        pnlPercent = costBasisForCurrentBalance > 0
          ? (pnlUsd / costBasisForCurrentBalance) * 100
          : 0;
      }
    } catch {
      // keep 0 PnL if no position or read error
    }

    return NextResponse.json({
      position: {
        tokenAddress,
        balance: formattedBalance,
        averageEntry,
        currentValue,
        pnlUsd,
        pnlPercent,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
