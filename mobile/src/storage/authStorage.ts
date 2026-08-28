import { STORAGE_KEYS } from '../constants/app';
import type { User } from '../types/auth';

let AsyncStorage: any = null;
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    AsyncStorage = {
      getItem: async (key: string) => window.localStorage.getItem(key),
      setItem: async (key: string, val: string) => window.localStorage.setItem(key, val),
      removeItem: async (key: string) => window.localStorage.removeItem(key),
      multiRemove: async (keys: string[]) => { keys.forEach(k => window.localStorage.removeItem(k)); }
    };
  } else {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  }
} catch {
  const memoryStore: Record<string, string> = {};
  AsyncStorage = {
    getItem: async (key: string) => memoryStore[key] || null,
    setItem: async (key: string, val: string) => { memoryStore[key] = val; },
    removeItem: async (key: string) => { delete memoryStore[key]; },
    multiRemove: async (keys: string[]) => { keys.forEach(k => delete memoryStore[k]); }
  };
}

/**
 * authStorage
 * -----------
 * Thin wrapper around AsyncStorage for auth data.
 * All keys are defined in constants/app.ts to avoid magic strings.
 */
export const authStorage = {
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
  },
};
