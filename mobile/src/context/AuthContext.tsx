import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onAuthChange, signOut as firebaseSignOut, getCurrentUser } from '../services/firebaseAuth';
import { checkUserStatus } from '../services/firestoreUser';
import { authStorage } from '../storage/authStorage';
import { authApi } from '../api/authApi';
import type {
  AuthState,
  User,
  LoginCredentials,
  RegisterData,
} from '../types/auth';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    profileCompleted: false,
  });

  /**
   * Resolve auth state from Firebase + Firestore.
   * Called on mount via onAuthStateChanged and also manually via refreshAuthState().
   */
  const resolveAuthState = useCallback(async (): Promise<void> => {
    try {
      const firebaseUser = getCurrentUser();

      if (!firebaseUser) {
        // Not authenticated
        await authStorage.clear();
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          profileCompleted: false,
        });
        return;
      }

      // Firebase user exists — build our User object
      const token = await firebaseUser.getIdToken();
      const user: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        phoneNumber: firebaseUser.phoneNumber || '',
        firebaseUid: firebaseUser.uid,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      };

      // Decide if the profile is complete. Trust the local flag first
      // (it was set the moment the user saved their profile) so a
      // slow/unreachable Firestore never sends them back to the form.
      let profileCompleted = await authStorage.getProfileCompleted();

      if (!profileCompleted) {
        // Local flag missing — check Firestore once (with a 3s cap)
        // so first-launch users still get the right answer.
        try {
          const status = await Promise.race([
            checkUserStatus(firebaseUser.uid),
            new Promise<{ profileCompleted: boolean }>((resolve) =>
              setTimeout(() => resolve({ profileCompleted: false }), 3000)
            ),
          ]);
          profileCompleted = status.profileCompleted;
          if (profileCompleted) {
            // Cache the result so future reloads skip the network call
            await authStorage.setProfileCompleted(true);
          }
        } catch {
          // Firestore failed — keep the local answer (false) and move on
        }
      }

      // Persist to storage for backward compatibility
      await Promise.all([
        authStorage.saveToken(token),
        authStorage.saveUser(user),
      ]);

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        profileCompleted,
      });
    } catch {
      // Auth check failed — treat as logged out
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        profileCompleted: false,
      });
    }
  }, []);

  /**
   * On mount: listen to Firebase auth state changes.
   * This handles initial session restoration and subsequent sign-in/out events.
   */
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        await resolveAuthState();
      } else {
        await authStorage.clear();
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          profileCompleted: false,
        });
      }
    });

    return () => unsubscribe();
  }, [resolveAuthState]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const res = await authApi.login(credentials);
    await authStorage.saveUser(res.user);
    await authStorage.saveToken(res.tokens.accessToken);
    setState({
      user: res.user,
      token: res.tokens.accessToken,
      isAuthenticated: true,
      isLoading: false,
      profileCompleted: true,
    });
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    const res = await authApi.register(data);
    await authStorage.saveUser(res.user);
    await authStorage.saveToken(res.tokens.accessToken);
    setState({
      user: res.user,
      token: res.tokens.accessToken,
      isAuthenticated: true,
      isLoading: false,
      profileCompleted: false,
    });
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await firebaseSignOut();
    // authStorage.clear() now also removes the profile-completed flag,
    // so signing out puts the user back to a clean state.
    await authStorage.clear();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      profileCompleted: false,
    });
  }, []);

  const refreshAuthState = useCallback(async (): Promise<void> => {
    await resolveAuthState();
  }, [resolveAuthState]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshAuthState }}>
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
