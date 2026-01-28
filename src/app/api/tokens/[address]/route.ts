import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  try {
    const doc = await db.collection('tokens').doc(params.address).get();
    if (!doc.exists) {
      return NextResponse.json({ token: null }, { status: 404 });
    }

    return NextResponse.json({ token: { address: doc.id, ...doc.data() } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
