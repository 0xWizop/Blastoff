import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

// Map Firebase TokenData fields to frontend Token format
function mapTokenData(docId: string, data: FirebaseFirestore.DocumentData) {
  // Handle Firestore timestamp
  let createdAt = data.createdAt;
  let startTime = 0;
  if (createdAt && typeof createdAt === 'object' && '_seconds' in createdAt) {
    startTime = createdAt._seconds * 1000;
    createdAt = new Date(startTime).toISOString();
  } else if (typeof createdAt === 'string') {
    startTime = new Date(createdAt).getTime();
  }

  return {
    // Use contractID as address if available, otherwise use doc ID
    address: data.contractID && data.contractID !== 'error' ? data.contractID : docId,
    id: docId,
    name: data.name || 'Unknown',
    symbol: data.symbol || '???',
    logoUrl: data.image || '',
    description: data.description || '',
    creatorAddress: data.creatorAddress || data.account || null,
    totalSupply: data.totalSupply || 0,
    volume24h: data.volume || 0,
    // Default values for missing fields
    marketCap: data.marketCap || 0,
    price: data.price || data.priceUsd || 0,
    priceChange24h: data.priceChange24h || data.change24h || 0,
    status: data.status || 'LIVE',
    createdAt,
    startTime,
    endTime: startTime + (30 * 24 * 60 * 60 * 1000), // Default 30 days from start
    raised: data.raised || 0,
    hardCap: data.hardCap || 100,
    softCap: data.softCap || 10,
    // Social links
    website: data.website || '',
    twitter: data.twitter || '',
    telegram: data.telegram || '',
    discord: data.discord || '',
  };
}

export async function GET() {
  try {
    const snapshot = await db.collection('TokenData').get();
    const tokens = snapshot.docs.map((d) => mapTokenData(d.id, d.data()));

    return NextResponse.json({ tokens });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
