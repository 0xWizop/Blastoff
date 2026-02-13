import { NextResponse } from 'next/server';
import { createPublicClient, formatUnits, http, isAddress, parseUnits, type Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { uniswapV3QuoterAbi, tokenFactoryAbi, erc20Abi } from '@/lib/abis';
import { getChainConfig, getContracts } from '@/config/contracts';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

// TokenFactory address on Base Sepolia
const TOKEN_FACTORY_ADDRESS = '0x7E7618828FE3e2BA6a81d609E7904E3CE2c15fB3' as const;

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

/**
 * Calculate price impact for ICO tokens using bonding curve
 * The TokenFactory uses an exponential bonding curve
 */
async function calculateICOPriceImpact(
  client: ReturnType<typeof createPublicClient>,
  tokenAddress: Address,
  amountIn: bigint,
  isBuy: boolean
): Promise<{ priceImpact: number; outputAmount: number; fee: number }> {
  try {
    // For ICO tokens, use the bonding curve calculation
    if (isBuy) {
      // Get current price for 1 token
      const oneToken = BigInt(1e18);
      const currentPriceForOne = await client.readContract({
        address: TOKEN_FACTORY_ADDRESS,
        abi: tokenFactoryAbi,
        functionName: 'calculateRequiredBaseCoinExp',
        args: [tokenAddress, oneToken],
      });
      
      // Calculate how many tokens we can buy with amountIn
      // This is approximate - we iterate to find the right amount
      let lowTokens = 0n;
      let highTokens = amountIn * BigInt(1e18) / (currentPriceForOne || 1n);
      highTokens = highTokens * 2n; // Buffer for curve
      
      // Binary search to find token amount for given ETH
      for (let i = 0; i < 50; i++) {
        const midTokens = (lowTokens + highTokens) / 2n;
        if (midTokens === 0n) break;
        
        try {
          const requiredEth = await client.readContract({
            address: TOKEN_FACTORY_ADDRESS,
            abi: tokenFactoryAbi,
            functionName: 'calculateRequiredBaseCoinExp',
            args: [tokenAddress, midTokens],
          });
          
          if (requiredEth <= amountIn) {
            lowTokens = midTokens;
          } else {
            highTokens = midTokens;
          }
          
          if (highTokens - lowTokens <= BigInt(1e15)) break; // Close enough
        } catch {
          highTokens = midTokens;
        }
      }
      
      const tokensOut = lowTokens;
      const outputAmount = Number(formatUnits(tokensOut, 18));
      
      // Calculate effective price vs spot price
      const effectivePrice = Number(formatUnits(amountIn, 18)) / (outputAmount || 1);
      const spotPrice = Number(formatUnits(currentPriceForOne, 18));
      
      // Price impact = (effective - spot) / spot * 100
      const priceImpact = spotPrice > 0 ? ((effectivePrice - spotPrice) / spotPrice) * 100 : 0;
      
      // Fee is 1% on TokenFactory buys
      const fee = Number(formatUnits(amountIn, 18)) * 0.01;
      
      return {
        priceImpact: Math.max(0, priceImpact),
        outputAmount,
        fee,
      };
    } else {
      // Selling tokens back to the curve (if supported)
      // For now, return conservative estimates
      const oneToken = BigInt(1e18);
      const priceForOne = await client.readContract({
        address: TOKEN_FACTORY_ADDRESS,
        abi: tokenFactoryAbi,
        functionName: 'calculateRequiredBaseCoinExp',
        args: [tokenAddress, oneToken],
      });
      
      // Rough estimate for selling
      const tokensToSell = amountIn;
      const estimatedEth = (tokensToSell * priceForOne) / oneToken;
      const outputAmount = Number(formatUnits(estimatedEth, 18)) * 0.95; // 5% slippage estimate
      
      return {
        priceImpact: 5, // Conservative estimate for sells
        outputAmount,
        fee: outputAmount * 0.01,
      };
    }
  } catch (error) {
    console.error('Error calculating ICO price impact:', error);
    return { priceImpact: 0, outputAmount: 0, fee: 0 };
  }
}

/**
 * Calculate price impact for DEX trades using constant product formula
 * Price Impact = (amountIn / reserveIn) * 100 for simple approximation
 * More accurate: newPrice / oldPrice - 1
 */
async function calculateDEXPriceImpact(
  inputAmountNum: number,
  outputAmountNum: number,
  feeTier: number
): Promise<{ priceImpact: number; fee: number }> {
  // For Uniswap V3, price impact is embedded in the quote
  // We can estimate it by comparing to a smaller trade
  // Fee is based on the fee tier (500 = 0.05%, 3000 = 0.3%, 10000 = 1%)
  const feePercent = feeTier / 1000000;
  const fee = inputAmountNum * feePercent;
  
  // Estimate price impact based on trade size
  // This is a simplified model - actual impact depends on liquidity depth
  // For small trades, impact is minimal
  // For larger trades, we estimate based on typical pool sizes
  
  // Rough estimate: 0.1% impact per 0.1 ETH traded
  const estimatedImpact = Math.min(inputAmountNum * 1, 50); // Cap at 50%
  
  return {
    priceImpact: Math.max(0, estimatedImpact),
    fee,
  };
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

    const client = createPublicClient({
      chain: getChain(chainConfig.chainId),
      transport: http(chainConfig.rpcUrl),
    });

    const tokenDecimals = await getTokenDecimals(tokenAddress as `0x${string}`);
    const inputDecimals = isBuyBool ? 18 : tokenDecimals;
    const outputDecimals = isBuyBool ? tokenDecimals : 18;
    const amountIn = parseUnits(inputAmount, inputDecimals);

    // Check if token is in ICO phase (Base Sepolia with TokenFactory)
    if (chainConfig.chainId === 84532 && contracts.TOKEN_FACTORY) {
      try {
        // Check token state from factory
        const tokenState = await client.readContract({
          address: TOKEN_FACTORY_ADDRESS,
          abi: tokenFactoryAbi,
          functionName: 'tokens',
          args: [tokenAddress as Address],
        });

        // State: 0 = NOT_CREATED, 1 = ICO, 2 = GRADUATED
        if (tokenState === 1) {
          // Token is in ICO phase - use bonding curve calculation
          const icoQuote = await calculateICOPriceImpact(
            client,
            tokenAddress as Address,
            amountIn,
            isBuyBool
          );

          return NextResponse.json({
            quote: {
              inputAmount: Number(inputAmount),
              outputAmount: icoQuote.outputAmount,
              priceImpact: Math.round(icoQuote.priceImpact * 100) / 100,
              fee: Math.round(icoQuote.fee * 10000) / 10000,
            },
          });
        }
      } catch (error) {
        console.log('Token not in factory, trying DEX quote');
      }
    }

    // Fallback to DEX quote (Uniswap V3)
    if (!contracts.UNISWAP_V3_QUOTER) {
      return NextResponse.json({ error: 'Uniswap V3 quoter not configured for this chain' }, { status: 500 });
    }

    const tokenIn = isBuyBool ? contracts.WETH : (tokenAddress as `0x${string}`);
    const tokenOut = isBuyBool ? (tokenAddress as `0x${string}`) : contracts.WETH;

    const amountOut = await client.readContract({
      address: contracts.UNISWAP_V3_QUOTER,
      abi: uniswapV3QuoterAbi,
      functionName: 'quoteExactInputSingle',
      args: [tokenIn, tokenOut, feeTier, amountIn, 0n],
    });

    const outputAmount = Number(formatUnits(amountOut, outputDecimals));
    const inputAmountNum = Number(inputAmount);

    // Calculate price impact for DEX trades
    const { priceImpact, fee } = await calculateDEXPriceImpact(
      isBuyBool ? inputAmountNum : outputAmount, // ETH amount
      outputAmount,
      feeTier
    );

    return NextResponse.json({
      quote: {
        inputAmount: inputAmountNum,
        outputAmount,
        priceImpact: Math.round(priceImpact * 100) / 100,
        fee: Math.round(fee * 10000) / 10000,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Swap quote error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
