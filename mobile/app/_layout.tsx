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
          <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen name="sos" options={{ animation: "fade_from_bottom" }} />
          </Stack>
        </PowerButtonSOSListener>
      </AuthProvider>
    </ThemeProvider>
  );
}