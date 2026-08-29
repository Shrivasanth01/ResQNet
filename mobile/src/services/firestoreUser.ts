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
 * Always falls back to the in-memory store if Firestore is unreachable
 * or takes too long — never blocks the auth flow.
 */
export async function getUserDoc(uid: string): Promise<FirestoreUserDoc | null> {
  // First check the local mock store (instant)
  if (mockUserDocs[uid]) return mockUserDocs[uid];
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  try {
    const ref = doc(db, 'users', uid);
    // Race the Firestore call against a 3-second timeout so a slow/blocked
    // Firestore never freezes the auth flow.
    const snap = await Promise.race([
      getDoc(ref),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (snap && (snap as any).exists) {
      return (snap as any).data() as FirestoreUserDoc;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create a new user document (first-time user).
 * Returns the local doc immediately; Firestore write happens in background.
 */
export async function createUserDoc(uid: string, phoneNumber: string): Promise<FirestoreUserDoc> {
  const userData: FirestoreUserDoc = {
    uid,
    phoneNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profileCompleted: false,
  };

  // Always save to the local store first so the next reads are instant
  mockUserDocs[uid] = userData;

  // Try to persist to Firestore in the background (best-effort, non-blocking)
  if (isFirebaseConfigured() && db) {
    setTimeout(() => {
      try {
        const ref = doc(db, 'users', uid);
        setDoc(ref, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {
          // Firestore unavailable — already saved locally
        });
      } catch {
        // ignored
      }
    }, 100);
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
