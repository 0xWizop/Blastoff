import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

function getFirebaseAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = getRequiredEnv('FIREBASE_PROJECT_ID');
  const clientEmail = getRequiredEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = getRequiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const firebaseAdminApp = getFirebaseAdminApp();
export const db = getFirestore(firebaseAdminApp);
