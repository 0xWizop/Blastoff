import { DEFAULT_INITIAL_MARKET_CAP, DEFAULT_INITIAL_PRICE, DEFAULT_TOTAL_SUPPLY } from '@/config/contracts';

/**
 * Map Firestore TokenData document to frontend Token shape.
 * Shared by /api/tokens, /api/tokens/trending, and /api/tokens/[address].
 */
export function mapTokenData(docId: string, data: FirebaseFirestore.DocumentData) {
  let createdAt = data.createdAt;
  let startTime = 0;
  if (createdAt && typeof createdAt === 'object' && '_seconds' in createdAt) {
    startTime = createdAt._seconds * 1000;
    createdAt = new Date(startTime).toISOString();
  } else if (typeof createdAt === 'string') {
    startTime = new Date(createdAt).getTime();
  }

  // Derive sensible defaults so tokens without on-chain activity still show a launch price and mcap.
  const totalSupply = (data.totalSupply as number | undefined) || DEFAULT_TOTAL_SUPPLY;
  const basePrice =
    (data.price as number | undefined) ||
    (data.priceUsd as number | undefined) ||
    DEFAULT_INITIAL_PRICE;
  const baseMarketCap =
    (data.marketCap as number | undefined) ||
    (basePrice * totalSupply) ||
    DEFAULT_INITIAL_MARKET_CAP;

  return {
    address: data.contractID && data.contractID !== 'error' ? data.contractID : docId,
    id: docId,
    name: data.name || 'Unknown',
    symbol: data.symbol || '???',
    logoUrl: data.image || '',
    description: data.description || '',
    creatorAddress: data.creatorAddress || data.account || null,
    totalSupply,
    volume24h: data.volume || 0,
    marketCap: baseMarketCap,
    price: basePrice,
    priceChange24h: data.priceChange24h || data.change24h || 0,
    status: data.status || 'LIVE',
    createdAt,
    startTime,
    endTime: startTime + (30 * 24 * 60 * 60 * 1000),
    raised: data.raised || 0,
    hardCap: data.hardCap || 100,
    softCap: data.softCap || 10,
    website: data.website || '',
    twitter: data.twitter || '',
    telegram: data.telegram || '',
    discord: data.discord || '',
  };
}
