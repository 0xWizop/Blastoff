import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const snapshot = await db
      .collection('tokens')
      .orderBy('volume24h', 'desc')
      .limit(5)
      .get();

    const tokens = snapshot.docs.map((d) => ({
      address: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ tokens });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
