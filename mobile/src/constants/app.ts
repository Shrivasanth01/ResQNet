export const STORAGE_KEYS = {
  AUTH_TOKEN: '@resqnet/auth_token',
  USER: '@resqnet/user',
  // Persisted flag so the app remembers the user already completed
  // their profile across page refreshes. Without this, the auth
  // check would re-prompt for profile details on every reload.
  PROFILE_COMPLETED: '@resqnet/profile_completed',
} as const;

export const API_CONFIG = {
  // FastAPI server URL. Defaults to localhost:8001 because the dev
  // machine has port 8000 held by an orphaned socket. Override with
  // the EXPO_PUBLIC_API_BASE_URL env var for production.
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8001/api/v1',
  TIMEOUT_MS: 10_000,
} as const;

export const APP_CONFIG = {
  SPLASH_DURATION_MS: 2500,
} as const;
