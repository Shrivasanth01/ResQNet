/**
 * ResQNet — Phone Authentication Service
 * ========================================
 *
 * Unified OTP service. Defaults to MSG91 (via FastAPI proxy) when
 * configured; falls back to Firebase Phone Auth; falls back to a
 * local Demo Mode for instant dev testing.
 *
 * To switch the active provider, set in .env:
 *   EXPO_PUBLIC_OTP_PROVIDER=msg91   (default, real SMS)
 *   EXPO_PUBLIC_OTP_PROVIDER=firebase (Firebase Phone Auth)
 *   EXPO_PUBLIC_OTP_PROVIDER=demo     (any 6-digit code, no SMS)
 */
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth, isFirebaseConfigured, isMsg91Configured } from '../firebase';
import * as msg91 from './msg91Auth';

type User = any;

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

let mockPendingPhone: string | null = null;
let mockCurrentUser: FirebaseUser | null = null;
const authListeners: Set<(user: any | null) => void> = new Set();

function activeProvider(): 'msg91' | 'firebase' | 'demo' {
  if (isMsg91Configured()) return 'msg91';
  if (isFirebaseConfigured()) return 'firebase';
  return 'demo';
}

/**
 * Initialize invisible RecaptchaVerifier for web (Firebase only).
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

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
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
  const provider = activeProvider();

  // ─── MSG91 (recommended) ──────────────────────────────────────────────
  if (provider === 'msg91') {
    return msg91.sendOTP(phoneNumber);
  }

  // ─── Demo Mode fallback ───────────────────────────────────────────────
  if (provider === 'demo') {
    await new Promise((resolve) => setTimeout(resolve, 600));
    mockPendingPhone = phoneNumber;
    return;
  }

  // ─── Firebase Phone Auth ──────────────────────────────────────────────
  const verifier = getRecaptchaVerifier();
  confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
}

/**
 * Verify the OTP code entered by the user.
 */
export async function verifyOTP(code: string): Promise<any> {
  const provider = activeProvider();

  // ─── MSG91 ────────────────────────────────────────────────────────────
  if (provider === 'msg91') {
    return msg91.verifyOTP(code);
  }

  // ─── Demo Mode ────────────────────────────────────────────────────────
  if (provider === 'demo') {
    if (!mockPendingPhone) {
      throw new Error('No pending OTP request found. Please request a new OTP.');
    }
    if (code.length !== 6) {
      throw new Error('Invalid OTP code. Must be 6 digits.');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    const cleanPhone = mockPendingPhone.replace(/\D/g, '');
    const fakeUid = `user_phone_${cleanPhone}`;
    const mockUser: any = {
      uid: fakeUid,
      phoneNumber: mockPendingPhone,
      displayName: `User ${cleanPhone.slice(-4)}`,
      email: `${fakeUid}@resqnet.app`,
      metadata: { creationTime: new Date().toISOString() },
      getIdToken: async () => `demo_token_${fakeUid}_${Date.now()}`,
    };
    mockCurrentUser = mockUser;
    mockPendingPhone = null;
    authListeners.forEach((fn) => fn(mockCurrentUser));
    return mockCurrentUser;
  }

  // ─── Firebase ─────────────────────────────────────────────────────────
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
  const provider = activeProvider();
  if (provider === 'msg91') return msg91.hasPendingOTP();
  if (provider === 'demo') return mockPendingPhone !== null;
  return confirmationResult !== null;
}

/**
 * Clear any pending OTP confirmation.
 */
export function clearPendingOTP(): void {
  const provider = activeProvider();
  if (provider === 'msg91') return msg91.clearPendingOTP();
  confirmationResult = null;
  mockPendingPhone = null;
}

/**
 * Get the currently authenticated Firebase user (or mock/MSG91 user).
 */
export function getCurrentUser(): any {
  const provider = activeProvider();
  if (provider === 'msg91') return msg91.getCurrentUser();
  if (provider === 'demo') return mockCurrentUser;
  return auth.currentUser;
}

/**
 * Sign out from the active provider.
 */
export async function signOut(): Promise<void> {
  const provider = activeProvider();

  if (provider === 'msg91') {
    return msg91.signOut();
  }

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

  if (provider === 'firebase') {
    await firebaseSignOut(auth);
  } else {
    authListeners.forEach((fn) => fn(null));
  }
}

/**
 * Listen to auth state changes.
 */
export function onAuthChange(callback: (user: any | null) => void): () => void {
  const provider = activeProvider();

  if (provider === 'msg91') {
    return msg91.onAuthChange(callback);
  }

  if (provider === 'demo') {
    authListeners.add(callback);
    setTimeout(() => callback(mockCurrentUser), 10);
    return () => authListeners.delete(callback);
  }

  return onAuthStateChanged(auth, callback);
}

/**
 * Which provider is currently active (for UI hints / banner logic).
 */
export function getActiveProvider(): 'msg91' | 'firebase' | 'demo' {
  return activeProvider();
}

/**
 * True when running against the local demo (no real SMS sent).
 */
export function isDemoMode(): boolean {
  return activeProvider() === 'demo';
}
