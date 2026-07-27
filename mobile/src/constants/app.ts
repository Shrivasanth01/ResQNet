export const STORAGE_KEYS = {
  AUTH_TOKEN: '@resqnet/auth_token',
  USER: '@resqnet/user',
} as const;

export const API_CONFIG = {
  // Replace with your FastAPI server URL when backend is ready.
  // This is the ONLY value that needs updating for production.
  BASE_URL: 'http://localhost:8000/api/v1',
  TIMEOUT_MS: 10_000,
} as const;

export const APP_CONFIG = {
  SPLASH_DURATION_MS: 2500,
} as const;
