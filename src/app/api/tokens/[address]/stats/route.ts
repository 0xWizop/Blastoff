import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getTokenICOStats, getTokenTrades, getTokenHolders } from '@/lib/chainUtils';
import { DEFAULT_CHAIN_ID } from '@/config/contracts';

export const runtime = 'nodejs';

/**
 * GET /api/tokens/[address]/stats
 * Get comprehensive on-chain stats for a token
 */
export async function GET(
  req: Request,
  { params }: { params: { address: string } }
) {
  try {
    const tokenAddress = params.address;
    
    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }
    
    const url = new URL(req.url);
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;
    
    // Fetch all stats in parallel
    const [icoStats, trades, holdersData] = await Promise.all([
      getTokenICOStats(tokenAddress, chainId),
      getTokenTrades(tokenAddress, chainId, 100),
      getTokenHolders(tokenAddress, chainId, 10),
    ]);
    
    // Calculate additional stats from trades
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const trades24h = trades.filter(t => t.timestamp > oneDayAgo);
    
    const volume24h = trades24h.reduce((sum, t) => sum + t.totalValue, 0);
    const txCount24h = trades24h.length;
    const buys24h = trades24h.filter(t => t.type === 'buy').length;
    const sells24h = trades24h.filter(t => t.type === 'sell').length;
    
    return NextResponse.json({
      ico: icoStats,
      stats: {
        volume24h,
        txCount24h,
        buys24h,
        sells24h,
        totalTrades: trades.length,
        holders: holdersData.totalHolders,
      },
      lastTrade: trades[0] || null,
    });
  } catch (err) {
    console.error('Error fetching token stats:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
