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
import type {
  AuthState,
  User,
} from '../types/auth';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
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

      // Check Firestore for profile completion status
      let profileCompleted = false;
      try {
        const status = await checkUserStatus(firebaseUser.uid);
        profileCompleted = status.profileCompleted;
      } catch {
        // Firestore may fail offline — default to false
        profileCompleted = false;
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

  // ─── Auth Actions ───────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    await firebaseSignOut();
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
    <AuthContext.Provider value={{ ...state, logout, refreshAuthState }}>
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
