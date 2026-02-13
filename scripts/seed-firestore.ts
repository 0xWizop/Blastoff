/**
 * Optional Firestore seed script. Uses .env.local for Firebase Admin.
 *
 * Run: npm run seed  (or npx tsx scripts/seed-firestore.ts)
 *
 * Currently a no-op: we do not seed mock tokens into TokenData.
 * TokenData is populated by the app when users create/launch tokens.
 * For one-off mock data in dev, use POST /api/admin/seed-mock-tokens with x-seed-secret.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  console.log('Seed script: no TokenData seeding (tokens come from create/launch).');
  console.log('To add mock tokens in dev, use POST /api/admin/seed-mock-tokens with x-seed-secret.');
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
