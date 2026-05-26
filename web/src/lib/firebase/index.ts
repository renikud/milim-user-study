import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, writeBatch, doc } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDhX8O6T5v1wNVFQsQQ4j9_K9jQTNarf2s",
  authDomain: "phonikud-user-study.firebaseapp.com",
  projectId: "phonikud-user-study",
  storageBucket: "phonikud-user-study.firebasestorage.app",
  messagingSenderId: "689783511490",
  appId: "1:689783511490:web:c67b072cff4bc6754a9e5b",
  measurementId: "G-G6SD739KV4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface Submission {
  name: string;
  email: string;
  sentence_id: string;
  model_a: string;
  model_b: string;
  naturalness_cmos: number; // -3 to +3 (positive = A better)
  accuracy_cmos: number;    // -3 to +3 (positive = A better)
  timestamp?: Date;
}

export interface CommentSubmission {
  name: string;
  email: string;
  comments: string;
  sessionId: string;
  timestamp?: Date;
}

/**
 * Submit a rating to Firestore
 */
export async function submitSubmission(submission: Submission) {
  try {
    const docRef = await addDoc(collection(db, 'submissions'), {
      ...submission,
      timestamp: new Date()
    });
    console.log('Submission added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding submission:', error);
    throw error;
  }
}

/**
 * Submit multiple ratings in a batch (more efficient)
 */
export async function submitBatch(submissions: Submission[]): Promise<void> {
  try {
    const batch = writeBatch(db);

    submissions.forEach((submission) => {
      const docRef = doc(collection(db, 'submissions'));
      batch.set(docRef, {
        ...submission,
        timestamp: new Date()
      });
    });

    await batch.commit();
    console.log(`Batch of ${submissions.length} submissions added successfully`);
  } catch (error) {
    console.error('Error submitting batch:', error);
    throw error;
  }
}

/**
 * Submit user comments to Firestore
 */
export async function submitComments(commentData: CommentSubmission): Promise<void> {
  try {
    const docRef = await addDoc(collection(db, 'comments'), {
      ...commentData,
      timestamp: new Date()
    });
    console.log('Comments submitted with ID:', docRef.id);
  } catch (error) {
    console.error('Error submitting comments:', error);
    throw error;
  }
}
