import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getTokenTrades, getTokenICOStats } from '@/lib/chainUtils';
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
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;
    
    console.log(`[Trades API] Fetching trades for ${tokenAddress}, chainId: ${chainId}`);
    
    // Fetch trades from chain
    const trades = await getTokenTrades(tokenAddress, chainId, limit);
    
    // Get ICO stats for context
    const icoStats = await getTokenICOStats(tokenAddress, chainId);
    
    console.log(`[Trades API] Found ${trades.length} trades, ICO state: ${icoStats.state}, collateral: ${icoStats.collateralRaised} ETH`);
    
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
