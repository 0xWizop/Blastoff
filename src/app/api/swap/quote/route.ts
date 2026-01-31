import { NextResponse } from 'next/server';
import { createPublicClient, formatUnits, http, isAddress, parseUnits } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { uniswapV3QuoterAbi } from '@/lib/abis';
import { getChainConfig, getContracts } from '@/config/contracts';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function getChain(chainId?: number) {
  return chainId === 84532 ? baseSepolia : base;
}

async function getTokenDecimals(tokenAddress: `0x${string}`): Promise<number> {
  try {
    const doc = await db.collection('TokenData').doc(tokenAddress).get();
    const data = doc.data();
    if (data?.decimals) return Number(data.decimals);
  } catch {
    // fallback below
  }
  return 18;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tokenAddress = url.searchParams.get('tokenAddress');
    const inputAmount = url.searchParams.get('inputAmount');
    const isBuy = url.searchParams.get('isBuy');
    const slippage = url.searchParams.get('slippage');
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : undefined;
    const feeTierParam = url.searchParams.get('feeTier');

    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }
    if (!inputAmount || Number(inputAmount) <= 0) {
      return NextResponse.json({ error: 'Invalid input amount' }, { status: 400 });
    }

    const isBuyBool = isBuy === 'true';
    const feeTier = feeTierParam ? Number(feeTierParam) : 3000;

    const chainConfig = getChainConfig(chainId);
    const contracts = getContracts(chainId);
    if (!contracts.UNISWAP_V3_QUOTER) {
      return NextResponse.json({ error: 'Uniswap V3 quoter not configured' }, { status: 500 });
    }

    const client = createPublicClient({
      chain: getChain(chainConfig.chainId),
      transport: http(chainConfig.rpcUrl),
    });

    const tokenDecimals = await getTokenDecimals(tokenAddress as `0x${string}`);
    const inputDecimals = isBuyBool ? 18 : tokenDecimals;
    const outputDecimals = isBuyBool ? tokenDecimals : 18;

    const amountIn = parseUnits(inputAmount, inputDecimals);
    const tokenIn = isBuyBool ? contracts.WETH : (tokenAddress as `0x${string}`);
    const tokenOut = isBuyBool ? (tokenAddress as `0x${string}`) : contracts.WETH;

    const amountOut = await client.readContract({
      address: contracts.UNISWAP_V3_QUOTER,
      abi: uniswapV3QuoterAbi,
      functionName: 'quoteExactInputSingle',
      args: [tokenIn, tokenOut, feeTier, amountIn, 0n],
    });

    const outputAmount = Number(formatUnits(amountOut, outputDecimals));

    return NextResponse.json({
      quote: {
        inputAmount: Number(inputAmount),
        outputAmount,
        priceImpact: 0,
        fee: 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
