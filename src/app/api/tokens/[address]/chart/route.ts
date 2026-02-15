import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getTokenTrades, aggregateToCandles, getTokenPrice, getTokenICOStats } from '@/lib/chainUtils';
import { DEFAULT_CHAIN_ID } from '@/config/contracts';

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
    
    // Get query params
    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '1h';
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;

    // Fetch enough trades for all timeframes (1m needs more for density)
    const trades = await getTokenTrades(tokenAddress, chainId, 500);

    // Get ICO stats for current price
    const icoStats = await getTokenICOStats(tokenAddress, chainId);
    const currentPrice = icoStats.currentPrice;

    // If no trades, return empty candles array or single price point
    if (trades.length === 0) {
      const now = Math.floor(Date.now() / 1000);

      // If there's collateral raised, we have buys but couldn't detect individual trades
      // Show a single candle at current price to indicate there IS activity
      if (icoStats.collateralRaised > 0) {
        const startPrice = 0.00003; // Initial bonding curve price
        
        return NextResponse.json({ 
          candles: [{
            time: now - 3600, // 1 hour ago
            open: startPrice,
            high: currentPrice * 1.01,
            low: startPrice * 0.99,
            close: currentPrice,
            volume: icoStats.collateralRaised,
          }],
          debug: {
            tradesFound: 0,
            collateral: icoStats.collateralRaised,
            currentPrice,
            state: icoStats.state,
            note: 'Single candle showing price movement from buys'
          }
        });
      }

      return NextResponse.json({ 
        candles: [],
        debug: {
          tradesFound: 0,
          collateral: 0,
          currentPrice,
          state: icoStats.state,
          note: 'No trading activity yet'
        }
      });
    }
    
    // Aggregate real trades into candles
    const candles = aggregateToCandles(trades, timeframe);

    return NextResponse.json({ 
      candles,
      debug: {
        tradesFound: trades.length,
        candlesGenerated: candles.length,
        collateral: icoStats.collateralRaised,
        currentPrice,
        state: icoStats.state,
      }
    });
  } catch (err) {
    console.error('Error fetching chart data:', err);
    let fallbackPrice = 0.00003;
    const tokenAddress = params?.address;
    if (tokenAddress && isAddress(tokenAddress)) {
      try {
        const chainIdParam = req.url ? new URL(req.url).searchParams.get('chainId') : null;
        const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;
        fallbackPrice = await getTokenPrice(tokenAddress as `0x${string}`, chainId);
      } catch {
        // keep 0.00003
      }
    }
    return NextResponse.json({
      candles: [],
      debug: { currentPrice: fallbackPrice, note: 'Fallback after error' },
    });
  }
}
