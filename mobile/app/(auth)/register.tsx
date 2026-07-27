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

export default function RegisterScreen() {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleRegister(): Promise<void> {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join ResQNet — be ready when it matters
        </Text>

        <View style={styles.form}>
          <TextInputField
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

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
            placeholder="Create a password (min. 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInputField
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
          />
        </View>

        <Text
          onPress={() => router.back()}
          style={styles.footer}
          accessibilityRole="link"
        >
          {'Already have an account? '}
          <Text style={styles.footerLink}>Sign In</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: 36,
    fontSize: 15,
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
    marginTop: 28,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
});