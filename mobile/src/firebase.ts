/**
 * ResQNet — Firebase Configuration
 *
 * Initializes Firebase App, Auth, and Firestore using environment variables.
 * Environment variables use the EXPO_PUBLIC_ prefix for Expo compatibility.
 *
 * NOTE: Phone OTP authentication is delegated to MSG91 via the FastAPI
 * backend (see src/services/msg91Auth.ts). Firebase here is only used
 * for Firestore (user profile documents) and is auto-initialized lazily.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '';
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';

/**
 * Check if valid Firebase credentials are configured in .env.
 * If MSG91 is the active OTP provider, Firebase is optional (only
 * needed if you also use Firestore for user docs).
 */
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    apiKey &&
    apiKey !== 'your_api_key_here' &&
    !apiKey.includes('your_') &&
    projectId &&
    projectId !== 'your_project_id'
  );
};

// Lazy Firebase init — only initialize when we actually have valid config
// to avoid console noise and CORS issues in MSG91-only deployments.
let _app: ReturnType<typeof getApp> | null = null;
let _auth: ReturnType<typeof getAuth> | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;

function getFirebaseApp() {
  if (_app) return _app;
  if (!isFirebaseConfigured()) return null;
  const config = {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  };
  _app = getApps().length === 0 ? initializeApp(config) : getApp();
  return _app;
}

function getFirebaseAuth() {
  if (_auth) return _auth;
  const app = getFirebaseApp();
  if (!app) return null;
  _auth = getAuth(app);
  return _auth;
}

function getFirebaseDb() {
  if (_db) return _db;
  const app = getFirebaseApp();
  if (!app) return null;
  _db = getFirestore(app);
  return _db;
}

// Backwards-compatible exports. These will be null when Firebase
// is not configured (which is fine — call sites must check first).
export const app = getFirebaseApp() as any;
export const auth = getFirebaseAuth() as any;
export const db = getFirebaseDb() as any;

/**
 * Check if MSG91 is the configured OTP provider.
 * True when EXPO_PUBLIC_OTP_PROVIDER=msg91 (or anything other than
 * 'firebase'/'demo'). When true, all phone OTP flows go through
 * the FastAPI backend MSG91 proxy.
 */
export const isMsg91Configured = (): boolean => {
  const provider = (process.env.EXPO_PUBLIC_OTP_PROVIDER || 'msg91').toLowerCase();
  return provider !== 'firebase' && provider !== 'demo';
};
