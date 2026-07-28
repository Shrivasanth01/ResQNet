import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as DefaultColors } from '../theme/colors';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  white: string;
  black: string;
  emergency: typeof DefaultColors.emergency;
}

export const LightColors: ThemeColors = {
  ...DefaultColors,
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
};

export const DarkColors: ThemeColors = {
  ...DefaultColors,
  background: "#0F172A",
  surface: "#1E293B",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  border: "#334155",
};

interface ThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDarkMode: false,
  toggleTheme: () => {},
  colors: LightColors,
});

const STORAGE_KEY = '@resqnet_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'dark') setIsDarkMode(true);
    });
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  const colors = isDarkMode ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
