import type { LoginCredentials, RegisterData, User, AuthTokens } from '../types/auth';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Simulated network delay helper
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock user store (acts like a database for the mock)
const mockUserStore: (User & { password: string })[] = [];

/**
 * AUTH API SERVICE — MOCK IMPLEMENTATION
 * ========================================
 * This is the ONLY file that changes when the real FastAPI backend is ready.
 *
 * To switch to real API:
 *   1. Replace each function body with a fetch() or axios call to API_CONFIG.BASE_URL
 *   2. Map the API JSON response to the same return shape (AuthResponse)
 *   3. AuthContext, screens, and navigation remain 100% unchanged.
 *
 * The contract (function signatures + return types) must not change.
 */
export const authApi = {
  /**
   * Authenticate a user with email + password.
   * Throws an Error with a human-readable message on failure.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(700); // Simulates network round-trip

    const match = mockUserStore.find(
      (u) =>
        u.email.toLowerCase() === credentials.email.toLowerCase() &&
        u.password === credentials.password,
    );

    if (!match) {
      throw new Error('Invalid email or password.');
    }

    const { password: _omit, ...safeUser } = match;

    return {
      user: safeUser,
      tokens: {
        accessToken: `mock_token_${safeUser.id}_${Date.now()}`,
      },
    };
  },

  /**
   * Create a new user account.
   * Throws an Error if the email is already registered.
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    await delay(900);

    const exists = mockUserStore.some(
      (u) => u.email.toLowerCase() === data.email.toLowerCase(),
    );

    if (exists) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: User & { password: string } = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      password: data.password || "",
      createdAt: new Date().toISOString(),
    };

    mockUserStore.push(newUser);

    const { password: _omit, ...safeUser } = newUser;

    return {
      user: safeUser,
      tokens: {
        accessToken: `mock_token_${safeUser.id}_${Date.now()}`,
      },
    };
  },

  /**
   * Validate a stored token (e.g. on app launch).
   * Real implementation: GET /auth/me → 200 = valid, 401 = expired.
   */
  async validateToken(token: string): Promise<boolean> {
    await delay(100);
    return typeof token === 'string' && token.length > 0;
  },
};
