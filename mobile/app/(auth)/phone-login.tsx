import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useRef } from 'react';
import { Colors } from '../../src/theme/colors';
import { sendOTP } from '../../src/services/firebaseAuth';
import { isFirebaseConfigured } from '../../src/firebase';
import PrimaryButton from '../../src/components/buttons/PrimaryButton';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
];

export default function PhoneLoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const isConfigured = isFirebaseConfigured();

  function formatPhoneDisplay(num: string): string {
    const digits = num.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  }

  function handlePhoneChange(text: string): void {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 10) {
      setPhoneNumber(digits);
      setError(null);
    }
  }

  function validatePhone(): string | null {
    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits) return 'Phone number is required.';
    if (digits.length < 10) return 'Enter a valid 10-digit phone number.';
    return null;
  }

  async function handleSendOTP(): Promise<void> {
    const validationError = validatePhone();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const fullNumber = `${selectedCountry.code}${phoneNumber}`;
      await sendOTP(fullNumber);
      router.push({
        pathname: '/(auth)/verify-otp' as any,
        params: {
          phoneNumber: fullNumber,
          maskedNumber: `${selectedCountry.code} ${formatPhoneDisplay(phoneNumber)}`,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP.';
      if (message.includes('too-many-requests')) {
        setError('Too many attempts. Please try again later.');
      } else if (message.includes('invalid-phone-number')) {
        setError('Invalid phone number. Please check and try again.');
      } else if (message.includes('app-not-authorized')) {
        setError('App not authorized. Please contact support.');
      } else {
        setError(message);
      }
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
        {/* Demo Mode / Environment Notice */}
        {!isConfigured && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerTitle}>💡 Dev / Demo Mode Enabled</Text>
            <Text style={styles.demoBannerText}>
              Firebase credentials are not set in `.env`. You can test immediately using any 10-digit phone number (Use test OTP: <Text style={styles.demoBold}>123456</Text>).
            </Text>
          </View>
        )}

        {/* Brand Header */}
        <View style={styles.brandSection}>
          <Text style={styles.logo}>🛡️</Text>
          <Text style={styles.title}>ResQNet</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            Communication When{'\n'}Everything Else Fails
          </Text>
        </View>

        {/* Phone Form */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Sign in with Phone</Text>
          <Text style={styles.formDescription}>
            We'll send you a one-time verification code to confirm your identity.
          </Text>

          {/* Country Code Selector */}
          <Text style={styles.inputLabel}>Country</Text>
          <Pressable
            style={styles.countrySelector}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.countryName}>{selectedCountry.name}</Text>
            <Text style={styles.countryCode}>{selectedCountry.code}</Text>
            <Text style={styles.chevron}>▾</Text>
          </Pressable>

          {showCountryPicker && (
            <View style={styles.countryDropdown}>
              {COUNTRY_CODES.map((country) => (
                <Pressable
                  key={country.code}
                  style={[
                    styles.countryOption,
                    selectedCountry.code === country.code && styles.countryOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedCountry(country);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryOptionName}>{country.name}</Text>
                  <Text style={styles.countryOptionCode}>{country.code}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Phone Number Input */}
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.codeChip}>
              <Text style={styles.codeChipText}>{selectedCountry.code}</Text>
            </View>
            <TextInput
              ref={phoneInputRef}
              style={styles.phoneInput}
              value={formatPhoneDisplay(phoneNumber)}
              onChangeText={handlePhoneChange}
              placeholder="98765 43210"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
              maxLength={11}
              autoFocus
              accessibilityLabel="Phone number"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonSpacing}>
            <PrimaryButton
              title="Send Verification Code"
              onPress={handleSendOTP}
              loading={isLoading}
              disabled={phoneNumber.length < 10}
            />
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to ResQNet's{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>

        {/* Invisible reCAPTCHA container */}
        <View nativeID="recaptcha-container" style={styles.recaptchaContainer} />
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
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  demoBanner: {
    backgroundColor: `${Colors.warning}15`,
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  demoBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.warning,
    marginBottom: 4,
  },
  demoBannerText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  demoBold: {
    fontWeight: '800',
    color: Colors.primary,
  },

  // Brand
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 12,
    letterSpacing: -0.5,
  },
  divider: {
    width: 48,
    height: 3,
    backgroundColor: Colors.primary,
    marginTop: 14,
    marginBottom: 14,
    borderRadius: 2,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },

  // Form
  formSection: {
    width: '100%',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  formDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Country Selector
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 20,
    gap: 10,
  },
  countryFlag: {
    fontSize: 22,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  chevron: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },

  // Country Dropdown
  countryDropdown: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: -12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryOptionActive: {
    backgroundColor: `${Colors.primary}08`,
  },
  countryOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  countryOptionCode: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  // Phone Input
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  codeChip: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 14,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeChipText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
    height: 54,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 1,
  },

  // Error
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
  },

  // Button
  buttonSpacing: {
    marginTop: 8,
  },

  // Terms
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 24,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // reCAPTCHA
  recaptchaContainer: {
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
});
