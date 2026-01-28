import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const snapshot = await db.collection('tokens').get();
    const tokens = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        address: d.id,
        ...data,
      };
    });

    return NextResponse.json({ tokens });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
