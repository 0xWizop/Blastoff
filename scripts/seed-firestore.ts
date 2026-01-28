import { config } from 'dotenv';
config({ path: '.env.local' });
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { mockTokens } from '../src/data/mockTokens.js';

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: getRequiredEnv('FIREBASE_PROJECT_ID'),
      clientEmail: getRequiredEnv('FIREBASE_CLIENT_EMAIL'),
      privateKey: getRequiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    }),
  });
}

async function seed() {
  const db = getFirestore(getApp());
  const tokensRef = db.collection('tokens');

  const chunks: typeof mockTokens[] = [];
  for (let i = 0; i < mockTokens.length; i += 450) {
    chunks.push(mockTokens.slice(i, i + 450));
  }

  let written = 0;
  for (const chunk of chunks) {
    const batch = db.batch();
    for (const t of chunk) {
      batch.set(
        tokensRef.doc(t.address),
        { ...t, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      written += 1;
    }
    await batch.commit();
  }

  console.log(`✅ Seeded ${written} tokens to Firestore`);
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
