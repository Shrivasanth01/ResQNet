/**
 * ResQNet — Firestore User Document Service
 * 
 * Manages user documents in Firestore for first-time user detection
 * and profile completion tracking.
 * 
 * Collection: users/{firebaseUID}
 */
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface FirestoreUserDoc {
  uid: string;
  phoneNumber: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  profileCompleted: boolean;
  displayName?: string;
  email?: string;
}

/**
 * Get the user document from Firestore.
 * @returns The user doc data, or null if it doesn't exist.
 */
export async function getUserDoc(uid: string): Promise<FirestoreUserDoc | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as FirestoreUserDoc;
  }
  return null;
}

/**
 * Create a new user document in Firestore (first-time user).
 */
export async function createUserDoc(uid: string, phoneNumber: string): Promise<FirestoreUserDoc> {
  const ref = doc(db, 'users', uid);
  const userData: FirestoreUserDoc = {
    uid,
    phoneNumber,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    profileCompleted: false,
  };
  await setDoc(ref, userData);
  return userData;
}

/**
 * Mark the user's profile as completed in Firestore.
 */
export async function markProfileCompleted(uid: string, extraData?: { displayName?: string; email?: string }): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    profileCompleted: true,
    updatedAt: serverTimestamp(),
    ...(extraData || {}),
  });
}

/**
 * Check if a user document exists and whether profile is completed.
 * @returns { exists: boolean, profileCompleted: boolean }
 */
export async function checkUserStatus(uid: string): Promise<{ exists: boolean; profileCompleted: boolean }> {
  const userDoc = await getUserDoc(uid);
  if (!userDoc) {
    return { exists: false, profileCompleted: false };
  }
  return { exists: true, profileCompleted: userDoc.profileCompleted };
}
