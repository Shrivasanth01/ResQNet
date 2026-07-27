import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import PrimaryButton from '../../src/components/buttons/PrimaryButton';
import TextInputField from '../../src/components/inputs/TextInputField';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  }

  async function handleLogin(): Promise<void> {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logo}>🛡️</Text>
        <Text style={styles.title}>ResQNet</Text>
        <Text style={styles.subtitle}>
          Communication When Everything Else Fails
        </Text>

        <View style={styles.form}>
          <TextInputField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInputField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
          />
        </View>

        <Text
          onPress={() => router.push('/(auth)/register')}
          style={styles.footer}
          accessibilityRole="link"
        >
          {"Don't have an account? "}
          <Text style={styles.footerLink}>Create one</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 25,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logo: {
    fontSize: 70,
    textAlign: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 15,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 36,
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    marginBottom: 14,
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
});