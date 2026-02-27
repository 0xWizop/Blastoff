import { NextResponse } from 'next/server';
import { formatUnits, isAddress, parseUnits, type Address } from 'viem';
import { getClient, getTokenICOStats } from '@/lib/chainUtils';
import { getContracts, DEFAULT_CHAIN_ID } from '@/config/contracts';
import { tokenFactoryAbi } from '@/lib/abis';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: { address: string } }
) {
  try {
    const tokenAddress = params.address;
    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const url = new URL(req.url);
    const tokenAmountParam = url.searchParams.get('tokenAmount');
    const isBuy = url.searchParams.get('isBuy') === 'true';
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;

    const tokenAmount = Number(tokenAmountParam || '0');
    if (!tokenAmount || tokenAmount <= 0) {
      return NextResponse.json({ error: 'Invalid token amount' }, { status: 400 });
    }

    const client = getClient(chainId);
    const contracts = getContracts(chainId);
    const factoryAddress = contracts.TOKEN_FACTORY as Address | undefined;
    if (!factoryAddress) {
      return NextResponse.json({ error: 'TokenFactory not configured for this chain' }, { status: 500 });
    }

    // Assume 18 decimals for factory tokens
    const decimals = 18;

    if (isBuy) {
      const amountScaled = parseUnits(tokenAmount.toString(), decimals);
      const requiredEth = await client.readContract({
        address: factoryAddress,
        abi: tokenFactoryAbi,
        functionName: 'calculateRequiredBaseCoinExp',
        args: [tokenAddress as Address, amountScaled],
      });
      const ethIn = Number(formatUnits(requiredEth, 18));
      return NextResponse.json({ ethIn });
    }

    // Sell: approximate ETH out using current bonding-curve price
    const stats = await getTokenICOStats(tokenAddress as Address, chainId);
    const ethOut = tokenAmount * (stats.currentPrice || 0);
    return NextResponse.json({ ethOut });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ICO Quote] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

