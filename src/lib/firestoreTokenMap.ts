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

  return {
    address: data.contractID && data.contractID !== 'error' ? data.contractID : docId,
    id: docId,
    name: data.name || 'Unknown',
    symbol: data.symbol || '???',
    logoUrl: data.image || '',
    description: data.description || '',
    creatorAddress: data.creatorAddress || data.account || null,
    totalSupply: data.totalSupply || 0,
    volume24h: data.volume || 0,
    marketCap: data.marketCap || 0,
    price: data.price || data.priceUsd || 0,
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
