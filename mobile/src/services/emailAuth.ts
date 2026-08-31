/**
 * ResQNet — Email (Gmail) OTP Service (100% Free)
 * ===============================================
 *
 * Sends OTP requests to our FastAPI backend (`/api/v1/auth/email-otp/send` and
 * `/api/v1/auth/email-otp/verify`) which sends real emails via standard Gmail SMTP
 * or works in Free Demo Mode (code: 123456) when offline/testing.
 */
import { API_CONFIG } from '../constants/app';
import {
  emitAuthChange,
  getCurrentUser as msg91GetCurrentUser,
  onAuthChange as msg91OnAuthChange,
} from './msg91Auth';

export type EmailOTPMode = 'smtp' | 'demo';

export interface SendEmailOTPResult {
  requestId: string;
  message: string;
  mode: EmailOTPMode;
}

export interface VerifyEmailOTPResult {
  verified: boolean;
  accessToken: string;
  user: {
    id: string;
    uid: string;
    phoneNumber: string;
    displayName: string;
    email: string;
    createdAt: string;
  };
  mode: EmailOTPMode;
}

let pendingRequestId: string | null = null;
let pendingEmail: string | null = null;
let pendingMode: EmailOTPMode | null = null;

async function postJSON<T>(path: string, body: any): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_CONFIG.TIMEOUT_MS);
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Server returned non-JSON (HTTP ${res.status}).`);
    }
    if (!res.ok) {
      const detail = data?.detail || `Request failed (HTTP ${res.status})`;
      const err: any = new Error(detail);
      err.status = res.status;
      err.detail = detail;
      err.payload = data;
      throw err;
    }
    return data as T;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    if (e instanceof TypeError) {
      throw new Error(
        `Could not reach the auth server at ${API_CONFIG.BASE_URL}. ` +
          'Make sure the backend is running (port 8000).'
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send OTP to the given Email address (e.g. "user@gmail.com").
 */
export async function sendEmailOTP(email: string): Promise<SendEmailOTPResult> {
  const cleanEmail = email.trim().toLowerCase();
  const result = await postJSON<SendEmailOTPResult>('/auth/email-otp/send', {
    email: cleanEmail,
  });

  pendingRequestId = result.requestId;
  pendingEmail = cleanEmail;
  pendingMode = result.mode;

  return result;
}

/**
 * Verify the Email OTP code.
 */
export async function verifyEmailOTP(otp: string, email?: string): Promise<any> {
  const targetEmail = (email || pendingEmail || '').trim().toLowerCase();
  if (!targetEmail) {
    throw new Error('No pending email OTP request found. Please request a new code.');
  }

  const result = await postJSON<VerifyEmailOTPResult>('/auth/email-otp/verify', {
    email: targetEmail,
    otp: otp.trim(),
    requestId: pendingRequestId || undefined,
  });

  const rawUser = result.user;
  const user: any = {
    uid: rawUser.uid || rawUser.id,
    phoneNumber: rawUser.phoneNumber || '',
    displayName: rawUser.displayName || targetEmail.split('@')[0],
    email: targetEmail,
    emailVerified: true,
    isAnonymous: false,
    metadata: { creationTime: rawUser.createdAt },
    providerData: [
      {
        providerId: 'email-otp',
        uid: rawUser.uid || rawUser.id,
        displayName: rawUser.displayName,
        email: targetEmail,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    getIdToken: async () => result.accessToken,
    getIdTokenResult: async () => ({
      token: result.accessToken,
      authTime: rawUser.createdAt,
      issuedAtTime: rawUser.createdAt,
      expirationTime: new Date(Date.now() + 7 * 86400000).toISOString(),
      claims: {},
      signInProvider: 'email-otp',
    }),
  };

  pendingRequestId = null;
  pendingEmail = null;
  pendingMode = null;

  emitAuthChange(user);
  return user;
}

export function hasPendingEmailOTP(): boolean {
  return pendingEmail !== null;
}

export function clearPendingEmailOTP(): void {
  pendingRequestId = null;
  pendingEmail = null;
  pendingMode = null;
}

export function getPendingEmail(): string | null {
  return pendingEmail;
}

export function getPendingEmailMode(): EmailOTPMode | null {
  return pendingMode;
}

export function getCurrentUser(): any | null {
  return msg91GetCurrentUser();
}

export async function signOut(): Promise<void> {
  clearPendingEmailOTP();
  emitAuthChange(null);
}

export function onAuthStateChanged(cb: (user: any | null) => void): () => void {
  return msg91OnAuthChange(cb);
}

export interface CloudUserProfile {
  exists: boolean;
  profileCompleted: boolean;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  profile?: {
    age: string;
    bloodGroup: string;
    medicalConditions: string;
    allergies: string;
    emergencyContacts: any[];
  };
}

/**
 * Checks if a profile is already saved for this Gmail address on the central cloud database.
 */
export async function fetchProfileByEmail(email: string): Promise<CloudUserProfile> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${API_CONFIG.BASE_URL}/users/profile-by-email/${encodeURIComponent(cleanEmail)}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[emailAuth] Cloud profile lookup notice:', e);
  }
  return { exists: false, profileCompleted: false };
}

/**
 * Permanently saves the user's complete profile to the cloud database linked to their Gmail.
 */
export async function saveProfileToCloud(payload: any): Promise<boolean> {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/users/save-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log('[emailAuth] Profile saved to cloud vault permanently for email:', payload.email);
      return true;
    }
  } catch (e) {
    console.warn('[emailAuth] Cloud profile save deferred:', e);
  }
  return false;
}

