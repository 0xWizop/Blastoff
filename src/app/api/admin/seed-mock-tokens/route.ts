import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firebaseAdmin';
import { mockTokens } from '@/data/mockTokens';

export const runtime = 'nodejs';

function isAuthorized(req: Request) {
  const secret = process.env.SEED_SECRET;
  if (!secret) return false;

  const headerSecret = req.headers.get('x-seed-secret');
  return headerSecret === secret;
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokensRef = db.collection('TokenData');

    let written = 0;
    const chunks: typeof mockTokens[] = [];
    for (let i = 0; i < mockTokens.length; i += 450) {
      chunks.push(mockTokens.slice(i, i + 450));
    }

    for (const chunk of chunks) {
      const batch = db.batch();
      for (const t of chunk) {
        const ref = tokensRef.doc(t.address);
        batch.set(
          ref,
          {
            ...t,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        written += 1;
      }
      await batch.commit();
    }

    return NextResponse.json({ ok: true, written });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
