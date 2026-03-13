import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getTokenTrades, aggregateToCandles, getTokenPrice, getTokenICOStats } from '@/lib/chainUtils';
import { DEFAULT_CHAIN_ID, DEFAULT_INITIAL_PRICE } from '@/config/contracts';
import { getTradesFromStore, saveTradesToStore } from '@/lib/firestoreTrades';

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

    // Prefer persisted trades if present
    const historyLimit = 500; // more for chart density
    let trades = await getTradesFromStore(tokenAddress, chainId, historyLimit);

    // Backfill from chain when store is empty / too shallow
    if (trades.length < 2) {
      const onChainTrades = await getTokenTrades(tokenAddress, chainId, historyLimit);
      if (onChainTrades.length) {
        await saveTradesToStore(onChainTrades, chainId);
        trades = onChainTrades;
      }
    }

    // Get ICO stats for current price
    const icoStats = await getTokenICOStats(tokenAddress, chainId);
    const currentPrice = icoStats.currentPrice;

    // If no trades anywhere, keep the existing single-candle / empty response behaviour
    if (trades.length === 0) {
      const now = Math.floor(Date.now() / 1000);

      // output a single candle to prevent the chart from showing an empty state
      const startPrice = DEFAULT_INITIAL_PRICE;
      
      return NextResponse.json({ 
        candles: [{
          time: now - 3600,
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
          note: 'Single candle showing price movement from buys or launch'
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
    let fallbackPrice = DEFAULT_INITIAL_PRICE;
    const tokenAddress = params?.address;
    if (tokenAddress && isAddress(tokenAddress)) {
      try {
        const chainIdParam = req.url ? new URL(req.url).searchParams.get('chainId') : null;
        const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;
        fallbackPrice = await getTokenPrice(tokenAddress as `0x${string}`, chainId);
      } catch {
        // keep default
      }
    }
    return NextResponse.json({
      candles: [],
      debug: { currentPrice: fallbackPrice, note: 'Fallback after error' },
    });
  }
}
