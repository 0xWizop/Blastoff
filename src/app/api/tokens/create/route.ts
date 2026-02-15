import { NextResponse } from 'next/server';
import { createPublicClient, encodeFunctionData, http, isAddress, decodeEventLog } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { tokenFactoryAbi } from '@/lib/abis';
import { getChainConfig, getContracts } from '@/config/contracts';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function getChain(chainId?: number) {
  return chainId === 84532 ? baseSepolia : base;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      symbol,
      totalSupply,
      decimals,
      description,
      website,
      twitter,
      telegram,
      discord,
      logoUrl,
      creatorAddress,
      txHash,
      chainId,
    } = body as {
      name: string;
      symbol: string;
      totalSupply?: string;
      decimals?: number;
      description: string;
      website?: string;
      twitter?: string;
      telegram?: string;
      discord?: string;
      logoUrl?: string;
      creatorAddress?: string;
      txHash?: string;
      chainId?: number;
    };

    const chainConfig = getChainConfig(chainId);
    const contracts = getContracts(chainId);
    if (!contracts.TOKEN_FACTORY) {
      return NextResponse.json({ error: 'TokenFactory not configured' }, { status: 500 });
    }

    // If txHash is provided, finalize by reading receipt and storing metadata
    if (txHash) {
      const client = createPublicClient({
        chain: getChain(chainConfig.chainId),
        transport: http(chainConfig.rpcUrl),
      });
      const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
      let tokenAddress: `0x${string}` | null = null;

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: tokenFactoryAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'TokenMinted') {
            tokenAddress = decoded.args.tokenAddress as `0x${string}`;
            break;
          }
        } catch {
          // ignore non-matching logs
        }
      }

      if (!tokenAddress) {
        return NextResponse.json({ error: 'TokenMinted event not found' }, { status: 400 });
      }

      const now = Date.now();
      await db.collection('TokenData').doc(tokenAddress).set(
        {
          name: name?.trim() || '',
          symbol: symbol?.trim()?.toUpperCase() || '',
          status: 'UPCOMING',
          totalSupply: totalSupply ?? null,
          decimals: decimals ?? 18,
          raised: 0,
          hardCap: 0,
          softCap: 0,
          startTime: now,
          endTime: now + 7 * 24 * 60 * 60 * 1000,
          price: 0,
          description: description?.trim() || '',
          website: website?.trim() || '',
          twitter: twitter?.trim() || '',
          telegram: telegram?.trim() || '',
          discord: discord?.trim() || '',
          logoUrl: logoUrl?.trim() || '',
          creatorAddress: creatorAddress?.toLowerCase() || '',
          chainId: chainConfig.chainId,
          createdAt: now,
        },
        { merge: true }
      );

      return NextResponse.json({ tokenAddress });
    }

    if (!name || !symbol) {
      return NextResponse.json({ error: 'Name and symbol are required' }, { status: 400 });
    }

    const data = encodeFunctionData({
      abi: tokenFactoryAbi,
      functionName: 'createToken',
      args: [name.trim(), symbol.trim().toUpperCase()],
    });

    return NextResponse.json({
      transaction: {
        to: contracts.TOKEN_FACTORY,
        data,
        value: '0',
        gasLimit: '0x30d40',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
