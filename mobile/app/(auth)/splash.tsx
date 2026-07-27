import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Colors } from '../../src/theme/colors';
import { APP_CONFIG } from '../../src/constants/app';
import { useAuth } from '../../src/context/AuthContext';

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [timerDone, setTimerDone] = useState(false);
  const hasNavigated = useRef(false);

  // Minimum display time — always shows splash for at least SPLASH_DURATION_MS
  useEffect(() => {
    const timer = setTimeout(() => setTimerDone(true), APP_CONFIG.SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // Navigate only when BOTH conditions are met:
  // 1. The splash timer has finished
  // 2. The AsyncStorage auth check has resolved (isLoading === false)
  useEffect(() => {
    if (timerDone && !isLoading && !hasNavigated.current) {
      hasNavigated.current = true;
      router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
    }
  }, [timerDone, isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🛡️</Text>
      <Text style={styles.title}>ResQNet</Text>
      <Text style={styles.subtitle}>
        Communication When{'\n'}Everything Else Fails
      </Text>
      <ActivityIndicator
        style={styles.loader}
        color={Colors.primary}
        size="small"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 70,
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.primary,
  },
  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 18,
    lineHeight: 26,
  },
  loader: {
    position: 'absolute',
    bottom: 60,
  },
});