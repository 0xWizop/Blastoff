import { NextResponse } from 'next/server';
import { createPublicClient, encodeFunctionData, formatUnits, http, isAddress, parseUnits, type Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { tokenFactoryAbi, erc20Abi } from '@/lib/abis';
import { getChainConfig, getContracts } from '@/config/contracts';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

// TokenFactory address on Base Sepolia
const TOKEN_FACTORY_ADDRESS = '0x7E7618828FE3e2BA6a81d609E7904E3CE2c15fB3' as const;

function getChain(chainId?: number) {
  return chainId === 84532 ? baseSepolia : base;
}

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
      action, // 'buy' | 'finalize' | 'status'
      buyAmount, // For ICO buys
      wallet, // User wallet for buys
    } = body as {
      tokenAddress: string;
      dex?: 'UNISWAP_V3' | 'AERODROME';
      initialPriceWeth?: number;
      wethLiquidity?: number;
      feeTier?: number;
      poolAddress?: string;
      txHash?: string;
      chainId?: number;
      action?: 'buy' | 'finalize' | 'status';
      buyAmount?: number;
      wallet?: string;
    };

    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const chainConfig = getChainConfig(chainId);
    const contracts = getContracts(chainId);

    const client = createPublicClient({
      chain: getChain(chainConfig.chainId),
      transport: http(chainConfig.rpcUrl),
    });

    // Get token state from factory
    let tokenState = 0;
    let collateral = 0n;
    
    if (contracts.TOKEN_FACTORY) {
      try {
        [tokenState, collateral] = await Promise.all([
          client.readContract({
            address: TOKEN_FACTORY_ADDRESS,
            abi: tokenFactoryAbi,
            functionName: 'tokens',
            args: [tokenAddress as Address],
          }),
          client.readContract({
            address: TOKEN_FACTORY_ADDRESS,
            abi: tokenFactoryAbi,
            functionName: 'collateral',
            args: [tokenAddress as Address],
          }),
        ]);
      } catch (e) {
        console.log('Could not get token state from factory:', e);
      }
    }

    // Handle different actions
    if (action === 'status') {
      // Return current ICO status
      const stateMap: Record<number, string> = {
        0: 'NOT_CREATED',
        1: 'ICO',
        2: 'GRADUATED',
      };

      return NextResponse.json({
        status: 'ok',
        tokenAddress,
        icoState: stateMap[tokenState] || 'UNKNOWN',
        collateralRaised: Number(formatUnits(collateral, 18)),
        fundingGoal: 30, // 30 ETH from contract
        progress: Number(formatUnits(collateral, 18)) / 30 * 100,
      });
    }

    if (action === 'buy') {
      // Build a buy transaction for ICO phase
      if (!wallet || !isAddress(wallet)) {
        return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
      }
      if (!buyAmount || buyAmount <= 0) {
        return NextResponse.json({ error: 'Invalid buy amount' }, { status: 400 });
      }

      // Calculate how many tokens we can get for the ETH amount
      const ethAmount = parseUnits(buyAmount.toString(), 18);
      
      // Get estimated tokens for this ETH amount using binary search
      let estimatedTokens = ethAmount * BigInt(1e18) / BigInt(3e13); // Rough starting estimate
      
      try {
        // Refine estimate
        const requiredEth = await client.readContract({
          address: TOKEN_FACTORY_ADDRESS,
          abi: tokenFactoryAbi,
          functionName: 'calculateRequiredBaseCoinExp',
          args: [tokenAddress as Address, estimatedTokens],
        });
        
        // Adjust tokens based on actual curve
        estimatedTokens = (estimatedTokens * ethAmount) / (requiredEth || ethAmount);
      } catch (e) {
        console.log('Could not estimate tokens:', e);
      }

      // Build buy transaction
      const data = encodeFunctionData({
        abi: tokenFactoryAbi,
        functionName: 'buy',
        args: [tokenAddress as Address, estimatedTokens],
      });

      return NextResponse.json({
        status: 'ok',
        transaction: {
          to: TOKEN_FACTORY_ADDRESS,
          data,
          value: ethAmount.toString(),
          gasLimit: '0x4c4b40', // 5M gas
        },
        estimatedTokens: Number(formatUnits(estimatedTokens, 18)),
        ethAmount: buyAmount,
      });
    }

    if (action === 'finalize' && txHash) {
      // Finalize after successful transaction - update Firestore
      const now = Date.now();

      // Determine status based on token state
      let status = 'UPCOMING';
      if (tokenState === 1) status = 'LIVE'; // ICO active
      if (tokenState === 2) status = 'GRADUATED'; // On DEX

      await db.collection('TokenData').doc(tokenAddress).set(
        {
          status,
          dex: dex ?? null,
          initialPriceWeth: Number(initialPriceWeth || 0),
          wethLiquidity: Number(wethLiquidity || 0),
          feeTier: feeTier ?? null,
          poolAddress: poolAddress || '',
          launchTxHash: txHash,
          chainId: chainConfig.chainId,
          launchedAt: now,
          collateralRaised: Number(formatUnits(collateral, 18)),
        },
        { merge: true }
      );

      return NextResponse.json({
        status: 'ok',
        tokenAddress,
        tokenState: tokenState === 1 ? 'ICO' : tokenState === 2 ? 'GRADUATED' : 'UNKNOWN',
      });
    }

    // Default: Legacy behavior - just update Firestore status
    const now = Date.now();

    await db.collection('TokenData').doc(tokenAddress).set(
      {
        status: tokenState === 2 ? 'GRADUATED' : 'LIVE',
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
      icoState: tokenState === 1 ? 'ICO' : tokenState === 2 ? 'GRADUATED' : 'PENDING',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Token launch error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint to check token ICO status
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tokenAddress = url.searchParams.get('tokenAddress');
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : undefined;

    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const chainConfig = getChainConfig(chainId);
    const contracts = getContracts(chainId);

    const client = createPublicClient({
      chain: getChain(chainConfig.chainId),
      transport: http(chainConfig.rpcUrl),
    });

    // Get token state from factory
    let tokenState = 0;
    let collateral = 0n;
    let tokensRemaining = 0n;

    if (contracts.TOKEN_FACTORY) {
      try {
        [tokenState, collateral] = await Promise.all([
          client.readContract({
            address: TOKEN_FACTORY_ADDRESS,
            abi: tokenFactoryAbi,
            functionName: 'tokens',
            args: [tokenAddress as Address],
          }),
          client.readContract({
            address: TOKEN_FACTORY_ADDRESS,
            abi: tokenFactoryAbi,
            functionName: 'collateral',
            args: [tokenAddress as Address],
          }),
        ]);

        // Get tokens remaining in factory
        tokensRemaining = await client.readContract({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [TOKEN_FACTORY_ADDRESS],
        });
      } catch (e) {
        console.log('Could not get token state:', e);
      }
    }

    const stateMap: Record<number, string> = {
      0: 'NOT_CREATED',
      1: 'ICO',
      2: 'GRADUATED',
    };

    const collateralRaised = Number(formatUnits(collateral, 18));
    const fundingGoal = 30; // 30 ETH

    return NextResponse.json({
      tokenAddress,
      state: stateMap[tokenState] || 'UNKNOWN',
      collateralRaised,
      fundingGoal,
      progress: Math.min((collateralRaised / fundingGoal) * 100, 100),
      tokensRemaining: Number(formatUnits(tokensRemaining, 18)),
      isGraduated: tokenState === 2,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
