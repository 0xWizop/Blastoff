import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getTokenTrades, getTokenICOStats } from '@/lib/chainUtils';
import { DEFAULT_CHAIN_ID } from '@/config/contracts';
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
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;
    
    console.log(`[Trades API] Fetching trades for ${tokenAddress}, chainId: ${chainId}`);

    // 1) Prefer historical trades from Firestore
    let trades = await getTradesFromStore(tokenAddress, chainId, limit);

    // 2) If we don't have enough history yet, backfill from chain once
    if (trades.length < limit) {
      const onChainTrades = await getTokenTrades(tokenAddress, chainId, limit);
      if (onChainTrades.length) {
        // Persist for future requests (best-effort)
        await saveTradesToStore(onChainTrades, chainId);

        // Merge and de-dupe (favor Firestore copies)
        const byId = new Map<string, (typeof onChainTrades)[number]>();
        for (const t of [...onChainTrades, ...trades]) {
          byId.set(t.id, t);
        }
        trades = Array.from(byId.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
      }
    }
    
    // Get ICO stats for context
    const icoStats = await getTokenICOStats(tokenAddress, chainId);
    
    console.log(`[Trades API] Returning ${trades.length} trades, ICO state: ${icoStats.state}, collateral: ${icoStats.collateralRaised} ETH`);
    
    // Format trades for frontend
    const formattedTrades = trades.map((trade) => ({
      id: trade.id,
      type: trade.type,
      tokenAddress: trade.tokenAddress,
      walletAddress: trade.walletAddress,
      amount: trade.amount,
      price: trade.price,
      totalValue: trade.totalValue,
      txHash: trade.txHash,
      timestamp: trade.timestamp,
    }));
    
    return NextResponse.json({ 
      trades: formattedTrades,
      debug: {
        totalFound: trades.length,
        icoState: icoStats.state,
        collateralRaised: icoStats.collateralRaised,
        currentPrice: icoStats.currentPrice,
      }
    });
  } catch (err) {
    console.error('Error fetching trades:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
