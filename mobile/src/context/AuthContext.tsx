import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { authApi } from '../api/authApi';
import { authStorage } from '../storage/authStorage';
import type {
  AuthState,
  LoginCredentials,
  RegisterData,
} from '../types/auth';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // true until the AsyncStorage check resolves
  });

  /**
   * On mount: restore any persisted session.
   * Sets isLoading → false when done, regardless of outcome.
   */
  useEffect(() => {
    async function restoreSession(): Promise<void> {
      try {
        const [token, user] = await Promise.all([
          authStorage.getToken(),
          authStorage.getUser(),
        ]);

        if (token && user) {
          const isValid = await authApi.validateToken(token);
          if (isValid) {
            setState({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        }

        // No valid session found — clear stale data
        await authStorage.clear();
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      } catch {
        // Storage read failed — treat as logged out
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    }

    restoreSession();
  }, []);

  // ─── Auth Actions ───────────────────────────────────────────────────────────

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const { user, tokens } = await authApi.login(credentials);
    await Promise.all([
      authStorage.saveToken(tokens.accessToken),
      authStorage.saveUser(user),
    ]);
    setState({ user, token: tokens.accessToken, isAuthenticated: true, isLoading: false });
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    const { user, tokens } = await authApi.register(data);
    await Promise.all([
      authStorage.saveToken(tokens.accessToken),
      authStorage.saveUser(user),
    ]);
    setState({ user, token: tokens.accessToken, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authStorage.clear();
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be called inside <AuthProvider>.');
  }
  return ctx;
}
