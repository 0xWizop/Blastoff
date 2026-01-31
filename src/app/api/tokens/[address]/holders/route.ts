import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getTokenHolders } from '@/lib/chainUtils';
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
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const chainIdParam = url.searchParams.get('chainId');
    const chainId = chainIdParam ? Number(chainIdParam) : DEFAULT_CHAIN_ID;
    
    // Fetch holders from chain
    const { holders, totalHolders } = await getTokenHolders(tokenAddress, chainId, limit);
    
    return NextResponse.json({ holders, totalHolders });
  } catch (err) {
    console.error('Error fetching holders:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
