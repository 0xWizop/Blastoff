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

    return NextResponse.json({
      position: {
        tokenAddress,
        balance: formattedBalance,
        averageEntry: 0,
        currentValue,
        pnlUsd: 0,
        pnlPercent: 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
