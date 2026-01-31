import { NextResponse } from 'next/server';
import { createPublicClient, formatUnits, http, isAddress } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { erc20Abi } from '@/lib/abis';
import { getChainConfig, getContracts } from '@/config/contracts';

export const runtime = 'nodejs';

function getChain(chainId?: number) {
  return chainId === 84532 ? baseSepolia : base;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const wallet = url.searchParams.get('wallet');
    const token = url.searchParams.get('token');
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : undefined;

    if (!wallet || !isAddress(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    if (token && !isAddress(token)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const chainConfig = getChainConfig(chainId);
    const contracts = getContracts(chainId);
    const client = createPublicClient({
      chain: getChain(chainConfig.chainId),
      transport: http(chainConfig.rpcUrl),
    });

    const ethBalance = await client.getBalance({ address: wallet });
    const eth = {
      address: '0x0000000000000000000000000000000000000000',
      balance: ethBalance.toString(),
      formatted: Number(formatUnits(ethBalance, 18)),
      decimals: 18,
    };

    let weth = null;
    if (contracts.WETH && isAddress(contracts.WETH)) {
      const wethBalance = await client.readContract({
        address: contracts.WETH,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [wallet],
      });
      weth = {
        address: contracts.WETH,
        balance: wethBalance.toString(),
        formatted: Number(formatUnits(wethBalance, 18)),
        decimals: 18,
      };
    }

    let tokenBalance = null;
    if (token) {
      const decimals = await client.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'decimals',
      });
      const balance = await client.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [wallet],
      });
      tokenBalance = {
        address: token,
        balance: balance.toString(),
        formatted: Number(formatUnits(balance, decimals)),
        decimals: Number(decimals),
      };
    }

    return NextResponse.json({
      balances: {
        eth,
        weth,
        token: tokenBalance,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
