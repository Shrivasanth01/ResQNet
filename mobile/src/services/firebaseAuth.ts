/**
 * ResQNet — Firebase Phone Authentication Service
 * 
 * Handles OTP send/verify, RecaptchaVerifier lifecycle, and auth state listening.
 * Supports both Live Firebase Mode (when .env has valid keys) and Dev Demo Mode (for instant offline testing).
 */
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { Platform } from 'react-native';

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

// Demo mode state
let mockPendingPhone: string | null = null;
let mockCurrentUser: FirebaseUser | null = null;
const authListeners: Set<(user: FirebaseUser | null) => void> = new Set();

/**
 * Initialize invisible RecaptchaVerifier for web.
 */
function getRecaptchaVerifier(): RecaptchaVerifier {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore cleanup errors
    }
    recaptchaVerifier = null;
  }

  if (Platform.OS === 'web') {
    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      container.style.display = 'none';
      document.body.appendChild(container);
    }
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {},
  });

  return recaptchaVerifier;
}

/**
 * Send OTP to the given phone number.
 */
export async function sendOTP(phoneNumber: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    // Dev Demo Mode fallback
    await new Promise((resolve) => setTimeout(resolve, 600));
    mockPendingPhone = phoneNumber;
    return;
  }

  const verifier = getRecaptchaVerifier();
  confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
}

/**
 * Verify the OTP code entered by the user.
 */
export async function verifyOTP(code: string): Promise<FirebaseUser> {
  if (!isFirebaseConfigured()) {
    // Dev Demo Mode verification (accepts any 6-digit code or test OTP 123456)
    if (!mockPendingPhone) {
      throw new Error('No pending OTP request found. Please request a new OTP.');
    }
    if (code.length !== 6) {
      throw new Error('Invalid OTP code. Must be 6 digits.');
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanPhone = mockPendingPhone.replace(/\D/g, '');
    const fakeUid = `user_phone_${cleanPhone}`;

    const mockUser: Partial<FirebaseUser> = {
      uid: fakeUid,
      phoneNumber: mockPendingPhone,
      displayName: `User ${cleanPhone.slice(-4)}`,
      email: `${fakeUid}@resqnet.app`,
      metadata: { creationTime: new Date().toISOString() } as any,
      getIdToken: async () => `mock_token_${fakeUid}_${Date.now()}`,
    };

    mockCurrentUser = mockUser as FirebaseUser;
    mockPendingPhone = null;

    // Notify listeners
    authListeners.forEach((fn) => fn(mockCurrentUser));
    return mockCurrentUser;
  }

  if (!confirmationResult) {
    throw new Error('No OTP request found. Please request a new OTP.');
  }

  const result = await confirmationResult.confirm(code);
  confirmationResult = null;
  return result.user;
}

/**
 * Check if there is a pending OTP confirmation.
 */
export function hasPendingOTP(): boolean {
  if (!isFirebaseConfigured()) {
    return mockPendingPhone !== null;
  }
  return confirmationResult !== null;
}

/**
 * Clear any pending OTP confirmation.
 */
export function clearPendingOTP(): void {
  confirmationResult = null;
  mockPendingPhone = null;
}

/**
 * Get the currently authenticated Firebase user.
 */
export function getCurrentUser(): FirebaseUser | null {
  if (!isFirebaseConfigured()) {
    return mockCurrentUser;
  }
  return auth.currentUser;
}

/**
 * Sign out from Firebase or Demo mode.
 */
export async function signOut(): Promise<void> {
  confirmationResult = null;
  mockPendingPhone = null;
  mockCurrentUser = null;

  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore
    }
    recaptchaVerifier = null;
  }

  if (isFirebaseConfigured()) {
    await firebaseSignOut(auth);
  } else {
    authListeners.forEach((fn) => fn(null));
  }
}

/**
 * Listen to Firebase auth state changes (or Demo mode changes).
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  if (!isFirebaseConfigured()) {
    authListeners.add(callback);
    // Fire initial state
    setTimeout(() => callback(mockCurrentUser), 10);
    return () => authListeners.delete(callback);
  }

  return onAuthStateChanged(auth, callback);
}
