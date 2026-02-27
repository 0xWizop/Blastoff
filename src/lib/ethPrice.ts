import { DEFAULT_ETH_PRICE_USD_ESTIMATE } from '@/config/contracts';

let cachedPrice: number | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Get a best-effort ETH/USD price for launch defaults.
 * - Primary source: Coingecko simple price API.
 * - Fallback: DEFAULT_ETH_PRICE_USD_ESTIMATE from config.
 * - Light in-memory cache so we don't hammer the API.
 */
export async function getEthUsdPriceEstimate(): Promise<number> {
  const now = Date.now();
  if (cachedPrice != null && now - cachedAt < CACHE_TTL_MS) {
    return cachedPrice;
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { next: { revalidate: CACHE_TTL_MS / 1000 } }
    );
    if (!res.ok) {
      throw new Error(`Coingecko error: ${res.status}`);
    }
    const json = (await res.json()) as { ethereum?: { usd?: number } };
    const price = json.ethereum?.usd;
    if (typeof price === 'number' && price > 0) {
      cachedPrice = price;
      cachedAt = now;
      return price;
    }
  } catch {
    // Swallow and fall back to config estimate
  }

  cachedPrice = DEFAULT_ETH_PRICE_USD_ESTIMATE;
  cachedAt = now;
  return cachedPrice;
}

