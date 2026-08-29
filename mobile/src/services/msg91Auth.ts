/**
 * ResQNet — MSG91 Phone OTP Service (Mobile-side)
 * ===================================================
 *
 * Sends OTP requests to our FastAPI backend (`/api/v1/auth/otp/send` and
 * `/api/v1/auth/otp/verify`) which proxies them to MSG91. The MSG91
 * auth key never leaves the server.
 *
 * Free tier: 5,000 SMS on MSG91 signup (no credit card). After that,
 * pay-as-you-go. See MSG91_SETUP.md.
 *
 * If the backend is in demo mode (MSG91 not enabled server-side),
 * the same flow works with a fixed OTP — check the response
 * `mode === 'demo'` to render a dev hint.
 */
import { API_CONFIG } from '../constants/app';

export type Msg91Mode = 'msg91' | 'demo';

export interface SendOTPResult {
  requestId: string;
  message: string;
  mode: Msg91Mode;
}

export interface VerifyOTPResult {
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
  mode: Msg91Mode;
}

// Local mirror of the requestId (so verify can find it even if the
// navigation params are lost)
let pendingRequestId: string | null = null;
let pendingPhone: string | null = null;
let pendingMode: Msg91Mode | null = null;

// Mock current user for AuthContext compatibility.
// Persisted to localStorage so the user stays logged in across page
// refreshes (otherwise the in-memory state is lost every reload).
const STORAGE_KEY_USER = '@resqnet/msg91_user';
const STORAGE_KEY_TOKEN = '@resqnet/msg91_token';

let mockCurrentUser: any = null;
const authListeners: Set<(user: any | null) => void> = new Set();

// On module load, try to restore the previous session from localStorage.
function restoreSession(): any | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    const user = JSON.parse(raw);
    // Re-attach getIdToken since functions don't survive JSON serialization
    const token = window.localStorage.getItem(STORAGE_KEY_TOKEN) || '';
    user.getIdToken = async () => token;
    return user;
  } catch {
    return null;
  }
}

function persistSession(user: any | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (user) {
    const { getIdToken: _omit, ...persistable } = user;
    window.localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(persistable));
    if (typeof _omit === 'function') {
      _omit().then((token: string) => {
        if (token) window.localStorage.setItem(STORAGE_KEY_TOKEN, token);
      }).catch(() => {});
    }
  } else {
    window.localStorage.removeItem(STORAGE_KEY_USER);
    window.localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
}

// Hydrate from localStorage at module-load time
mockCurrentUser = restoreSession();

function emitAuthChange(user: any | null): void {
  mockCurrentUser = user;
  persistSession(user);
  authListeners.forEach((fn) => fn(user));
}

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
      // FastAPI HTTPException: { "detail": "..." }
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
      // Network failure (CORS, offline, bad URL)
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
 * Send OTP to the given E.164 phone number (e.g. "+919876543210").
 * Throws on any failure with a human-readable message.
 */
export async function sendOTP(phoneNumber: string): Promise<void> {
  // Extract numeric country code (assume first 1-3 digits after the +)
  const digits = phoneNumber.replace(/\D/g, '');
  let countryCode = '91';
  if (phoneNumber.startsWith('+')) {
    // Try 1, 2, then 3 digit country code
    if (digits.length >= 11 && digits.startsWith('1')) countryCode = '1';
    else if (digits.length >= 12 && digits.startsWith('44')) countryCode = '44';
    else if (digits.length >= 11 && digits.startsWith('91')) countryCode = '91';
    else countryCode = digits.slice(0, 2);
  }

  const result = await postJSON<SendOTPResult>('/auth/otp/send', {
    phoneNumber,
    countryCode,
  });

  pendingRequestId = result.requestId;
  pendingPhone = phoneNumber;
  pendingMode = result.mode;
}

/**
 * Verify the 6-digit OTP code. On success, returns a Firebase-user-
 * compatible object so the rest of the app works unchanged.
 */
export async function verifyOTP(code: string): Promise<any> {
  if (!pendingPhone) {
    throw new Error('No pending OTP request. Please request a new code.');
  }

  const result = await postJSON<VerifyOTPResult>('/auth/otp/verify', {
    phoneNumber: pendingPhone,
    otp: code,
    requestId: pendingRequestId,
  });

  // Build a Firebase-User-shaped object so the existing AuthContext
  // and firestoreUser.ts keep working without changes.
  const user = {
    uid: result.user.uid,
    phoneNumber: result.user.phoneNumber,
    displayName: result.user.displayName,
    email: result.user.email,
    metadata: { creationTime: result.user.createdAt },
    getIdToken: async () => result.accessToken,
  };

  emitAuthChange(user);
  return user;
}

/**
 * Whether the backend is using real MSG91 or demo mode.
 * Useful for the UI to show a "demo" hint banner.
 */
export function isPendingDemoMode(): boolean {
  return pendingMode === 'demo';
}

export function hasPendingOTP(): boolean {
  return pendingRequestId !== null && pendingPhone !== null;
}

export function clearPendingOTP(): void {
  pendingRequestId = null;
  pendingPhone = null;
  pendingMode = null;
}

export function getCurrentUser(): any {
  return mockCurrentUser;
}

export async function signOut(): Promise<void> {
  clearPendingOTP();
  emitAuthChange(null);
}

export function onAuthChange(callback: (user: any | null) => void): () => void {
  authListeners.add(callback);
  // Fire current state asynchronously (mimics Firebase's onAuthStateChanged)
  setTimeout(() => callback(mockCurrentUser), 10);
  return () => {
    authListeners.delete(callback);
  };
}
