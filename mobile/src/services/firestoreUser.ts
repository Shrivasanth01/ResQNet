/**
 * ResQNet — Firestore User Document Service
 * 
 * Manages user documents in Firestore (or local storage fallback in demo mode)
 * for first-time user detection and profile completion tracking.
 * 
 * Collection: users/{firebaseUID}
 */
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export interface FirestoreUserDoc {
  uid: string;
  phoneNumber: string;
  createdAt: any;
  updatedAt: any;
  profileCompleted: boolean;
  displayName?: string;
  email?: string;
}

// Demo mode in-memory / localStorage store
const mockUserDocs: Record<string, FirestoreUserDoc> = {};

/**
 * Get the user document from Firestore or Demo Store.
 */
export async function getUserDoc(uid: string): Promise<FirestoreUserDoc | null> {
  if (!isFirebaseConfigured()) {
    return mockUserDocs[uid] || null;
  }

  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as FirestoreUserDoc;
    }
    return null;
  } catch {
    return mockUserDocs[uid] || null;
  }
}

/**
 * Create a new user document (first-time user).
 */
export async function createUserDoc(uid: string, phoneNumber: string): Promise<FirestoreUserDoc> {
  const userData: FirestoreUserDoc = {
    uid,
    phoneNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profileCompleted: false,
  };

  if (!isFirebaseConfigured()) {
    mockUserDocs[uid] = userData;
    return userData;
  }

  try {
    const ref = doc(db, 'users', uid);
    await setDoc(ref, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch {
    mockUserDocs[uid] = userData;
  }

  return userData;
}

/**
 * Mark the user's profile as completed.
 */
export async function markProfileCompleted(uid: string, extraData?: { displayName?: string; email?: string }): Promise<void> {
  if (!mockUserDocs[uid]) {
    mockUserDocs[uid] = {
      uid,
      phoneNumber: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profileCompleted: true,
      ...(extraData || {}),
    };
  } else {
    mockUserDocs[uid] = {
      ...mockUserDocs[uid],
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
      ...(extraData || {}),
    };
  }

  if (isFirebaseConfigured()) {
    try {
      const ref = doc(db, 'users', uid);
      await updateDoc(ref, {
        profileCompleted: true,
        updatedAt: serverTimestamp(),
        ...(extraData || {}),
      });
    } catch {
      // Fallback saved in mockUserDocs
    }
  }
}

/**
 * Check if a user document exists and whether profile is completed.
 */
export async function checkUserStatus(uid: string): Promise<{ exists: boolean; profileCompleted: boolean }> {
  const userDoc = await getUserDoc(uid);
  if (!userDoc) {
    return { exists: false, profileCompleted: false };
  }
  return { exists: true, profileCompleted: userDoc.profileCompleted };
}
