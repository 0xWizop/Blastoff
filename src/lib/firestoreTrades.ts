import { db } from './firebaseAdmin';
import type { Trade } from './chainUtils';

const COLLECTION = 'TokenTrades';

type TradeDoc = Trade & {
  chainId: number;
};

function buildTradeId(trade: Trade, chainId: number) {
  const addr = (trade.tokenAddress || '').toLowerCase();
  return `${chainId}-${addr}-${trade.txHash}-${trade.blockNumber}-${trade.type}`;
}

export async function saveTradesToStore(trades: Trade[], chainId: number): Promise<void> {
  if (!trades.length) return;

  const batch = db.batch();
  for (const trade of trades) {
    const id = buildTradeId(trade, chainId);
    const ref = db.collection(COLLECTION).doc(id);
    const doc: TradeDoc = {
      ...trade,
      chainId,
    };
    batch.set(ref, doc, { merge: true });
  }

  await batch.commit().catch((err) => {
    console.error('Failed to persist trades to Firestore', err);
  });
}

export async function getTradesFromStore(
  tokenAddress: string,
  chainId: number,
  limit: number
): Promise<Trade[]> {
  const addr = tokenAddress.toLowerCase();

  const snapshot = await db
    .collection(COLLECTION)
    .where('tokenAddress', '==', addr)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get()
    .catch((err) => {
      console.error('Failed to read trades from Firestore', err);
      return null;
    });

  if (!snapshot || snapshot.empty) return [];

  const trades: Trade[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data() as TradeDoc;
    trades.push({
      id: data.id,
      type: data.type,
      tokenAddress: data.tokenAddress,
      walletAddress: data.walletAddress,
      amount: data.amount,
      price: data.price,
      totalValue: data.totalValue,
      txHash: data.txHash,
      timestamp: data.timestamp,
      blockNumber: data.blockNumber,
    });
  });

  return trades;
}

