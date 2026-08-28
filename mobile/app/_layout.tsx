import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { initDatabase } from '../src/storage/database';
import PowerButtonSOSListener from '../src/components/hardware/PowerButtonSOSListener';

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <PowerButtonSOSListener>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="sos" />
          </Stack>
        </PowerButtonSOSListener>
      </AuthProvider>
    </ThemeProvider>
  );
}