/**
 * ResQNet — Firebase Configuration
 * 
 * Initializes Firebase App, Auth, and Firestore using environment variables.
 * Environment variables use the EXPO_PUBLIC_ prefix for Expo compatibility.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '';
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';

/**
 * Check if valid Firebase credentials are configured in .env
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

const firebaseConfig = {
  apiKey: isFirebaseConfigured() ? apiKey : 'AIzaSyDemoPlaceholderKeyForDevelopment123',
  authDomain: isFirebaseConfigured() ? authDomain : 'resqnet-demo.firebaseapp.com',
  projectId: isFirebaseConfigured() ? projectId : 'resqnet-demo',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'resqnet-demo.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
