import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as DefaultColors } from '../theme/colors';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  secondaryLight?: string;
  accentCyan?: string;
  accentEmerald?: string;
  success: string;
  warning: string;
  danger: string;
  dangerDark?: string;
  background: string;
  surface: string;
  surfaceElevated?: string;
  text: string;
  textSecondary: string;
  textMuted?: string;
  border: string;
  borderBright?: string;
  white: string;
  black: string;
  emergency: typeof DefaultColors.emergency;
}

export const LightColors: ThemeColors = {
  ...DefaultColors,
  background: "#071014",     // Deep Tactical Obsidian
  surface: "#0B181D",        // Glassmorphic Obsidian Card
  text: "#E7F0F1",           // Crisp Glowing White-Cyan
  textSecondary: "#7E989D",  // Muted Slate Cyan
  border: "#173036",         // Cyber Teal Border
};

export const DarkColors: ThemeColors = {
  ...DefaultColors,
  background: "#04090C",     // Ultra Dark Tactical Abyss
  surface: "#081419",        // Deep Obsidian Card
  text: "#F1FCFA",           // Electric Pure White-Mint
  textSecondary: "#6E8C91",  // Dim Cyan Slate
  border: "#122A2F",         // Subtle Cyber Teal Border
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
