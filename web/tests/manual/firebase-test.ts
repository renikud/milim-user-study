/*
Manual Firebase smoke test.

Run:
  pnpm --dir web dlx tsx tests/manual/firebase-test.ts
*/

import { firebaseConfig } from '../../src/lib/firebase';
import { deleteApp, initializeApp } from 'firebase/app';
import { addDoc, collection, getDocs, getFirestore, terminate } from 'firebase/firestore';

function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  return (error as { code?: string }).code === 'permission-denied';
}

async function main() {
  const suffix = Date.now();
  const app = initializeApp(firebaseConfig, `manual-security-test-${suffix}`);
  const db = getFirestore(app);

  try {
    console.log('1) Testing submission...');
    await addDoc(collection(db, 'submissions'), {
      name: `Test User ${suffix}`,
      email: `test+${suffix}@example.com`,
      sentence_id: '0',
      model_a: 'styletts2',
      model_b: 'roboshaul',
      naturalness_cmos: 2,
      accuracy_cmos: -1,
      timestamp: new Date()
    });
    console.log('Submission successful!');

    console.log('2) Testing public read denial...');
    let deniedSubmissions = false;
    let deniedComments = false;

    try {
      await getDocs(collection(db, 'submissions'));
      console.error('ERROR: submissions read unexpectedly succeeded');
    } catch (error) {
      deniedSubmissions = isPermissionDenied(error);
      console.log(`submissions read blocked: ${deniedSubmissions}`);
    }

    try {
      await getDocs(collection(db, 'comments'));
      console.error('ERROR: comments read unexpectedly succeeded');
    } catch (error) {
      deniedComments = isPermissionDenied(error);
      console.log(`comments read blocked: ${deniedComments}`);
    }

    if (!deniedSubmissions || !deniedComments) {
      throw new Error('Security test failed: public read is not fully blocked.');
    }

    console.log('PASS: submit works and public reads are blocked for submissions/comments.');
  } finally {
    await terminate(db);
    await deleteApp(app);
  }
}

main().catch(console.error);
