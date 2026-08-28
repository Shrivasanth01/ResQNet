/**
 * ResQNet — Firebase Phone Authentication Service
 * 
 * Handles OTP send/verify, RecaptchaVerifier lifecycle, and auth state listening.
 * Never stores OTP in localStorage. Never logs OTP values.
 */
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import { Platform } from 'react-native';

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize invisible RecaptchaVerifier for web.
 * Cleans up any existing verifier to prevent duplicates.
 */
function getRecaptchaVerifier(): RecaptchaVerifier {
  // Clean up existing verifier
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore cleanup errors
    }
    recaptchaVerifier = null;
  }

  // Ensure the container element exists (web only)
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
    callback: () => {
      // reCAPTCHA solved — will proceed with signInWithPhoneNumber
    },
    'expired-callback': () => {
      // reCAPTCHA expired — user needs to retry
    },
  });

  return recaptchaVerifier;
}

/**
 * Send OTP to the given phone number.
 * @param phoneNumber - Full international phone number (e.g., "+919876543210")
 * @returns Promise that resolves when OTP is sent
 */
export async function sendOTP(phoneNumber: string): Promise<void> {
  const verifier = getRecaptchaVerifier();
  confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
}

/**
 * Verify the OTP code entered by the user.
 * @param code - 6-digit OTP code
 * @returns The authenticated Firebase user
 */
export async function verifyOTP(code: string): Promise<FirebaseUser> {
  if (!confirmationResult) {
    throw new Error('No OTP request found. Please request a new OTP.');
  }

  const result = await confirmationResult.confirm(code);
  confirmationResult = null; // Clear after successful verification
  return result.user;
}

/**
 * Check if there is a pending OTP confirmation.
 */
export function hasPendingOTP(): boolean {
  return confirmationResult !== null;
}

/**
 * Clear any pending OTP confirmation (e.g., when changing phone number).
 */
export function clearPendingOTP(): void {
  confirmationResult = null;
}

/**
 * Get the currently authenticated Firebase user.
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Sign out from Firebase.
 */
export async function signOut(): Promise<void> {
  confirmationResult = null;
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore
    }
    recaptchaVerifier = null;
  }
  await firebaseSignOut(auth);
}

/**
 * Listen to Firebase auth state changes.
 * @param callback - Called with the Firebase user (or null) on state change
 * @returns Unsubscribe function
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
