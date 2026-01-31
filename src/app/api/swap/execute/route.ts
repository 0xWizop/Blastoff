import { NextResponse } from 'next/server';
import { createPublicClient, encodeFunctionData, http, isAddress, parseUnits } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { uniswapV3QuoterAbi, uniswapV3SwapRouterAbi } from '@/lib/abis';
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      wallet,
      tokenAddress,
      inputAmount,
      isBuy,
      slippage,
      feeTier,
      chainId,
    } = body as {
      wallet: string;
      tokenAddress: string;
      inputAmount: number;
      isBuy: boolean;
      slippage: number;
      feeTier?: number;
      chainId?: number;
    };

    if (!wallet || !isAddress(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }
    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }
    if (!inputAmount || Number(inputAmount) <= 0) {
      return NextResponse.json({ error: 'Invalid input amount' }, { status: 400 });
    }

    const chainConfig = getChainConfig(chainId);
    const contracts = getContracts(chainId);
    if (!contracts.UNISWAP_V3_ROUTER || !contracts.UNISWAP_V3_QUOTER) {
      return NextResponse.json({ error: 'Uniswap V3 router/quoter not configured' }, { status: 500 });
    }

    const client = createPublicClient({
      chain: getChain(chainConfig.chainId),
      transport: http(chainConfig.rpcUrl),
    });

    const tokenDecimals = await getTokenDecimals(tokenAddress as `0x${string}`);
    const inputDecimals = isBuy ? 18 : tokenDecimals;
    const outputDecimals = isBuy ? tokenDecimals : 18;

    const amountIn = parseUnits(inputAmount.toString(), inputDecimals);
    const tokenIn = isBuy ? contracts.WETH : (tokenAddress as `0x${string}`);
    const tokenOut = isBuy ? (tokenAddress as `0x${string}`) : contracts.WETH;

    const poolFee = feeTier ?? 3000;
    const quotedOut = await client.readContract({
      address: contracts.UNISWAP_V3_QUOTER,
      abi: uniswapV3QuoterAbi,
      functionName: 'quoteExactInputSingle',
      args: [tokenIn, tokenOut, poolFee, amountIn, 0n],
    });

    const slippageBps = Math.round((slippage ?? 1) * 100);
    const amountOutMin = (quotedOut * BigInt(10000 - slippageBps)) / 10000n;

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const data = encodeFunctionData({
      abi: uniswapV3SwapRouterAbi,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn,
          tokenOut,
          fee: poolFee,
          recipient: wallet,
          deadline,
          amountIn,
          amountOutMinimum: amountOutMin,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });

    return NextResponse.json({
      transaction: {
        to: contracts.UNISWAP_V3_ROUTER,
        data,
        value: isBuy ? amountIn.toString() : '0',
        gasLimit: '0x30d40',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
