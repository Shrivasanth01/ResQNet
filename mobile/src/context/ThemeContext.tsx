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
  background: "#F9F8F6",     // Soft Ivory
  surface: "#FFFFFF",        // White
  text: "#1C1D21",           // Deep Charcoal
  textSecondary: "#6E717C",  // Muted Warm Slate
  border: "#E6E4E0",         // Soft Warm Border
};

export const DarkColors: ThemeColors = {
  ...DefaultColors,
  background: "#141517",     // Deep Charcoal Dark
  surface: "#1E2024",        // Warm Dark Obsidian Surface
  text: "#F3F2F0",           // Soft Off-White
  textSecondary: "#9E9EA7",  // Muted Gray Text
  border: "#2D2E33",         // Subtle Dark Neutral Border
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
