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
import { sendOTP, isDemoMode } from '../../src/services/firebaseAuth';
import { sendEmailOTP } from '../../src/services/emailAuth';
import PrimaryButton from '../../src/components/buttons/PrimaryButton';

type AuthTab = 'email' | 'phone';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
];

export default function PhoneLoginScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const isDemo = isDemoMode();

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

  function validateEmail(): string | null {
    const clean = email.trim().toLowerCase();
    if (!clean) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) return 'Enter a valid email address (e.g. user@gmail.com).';
    return null;
  }

  function validatePhone(): string | null {
    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits) return 'Phone number is required.';
    if (digits.length < 10) return 'Enter a valid 10-digit phone number.';
    return null;
  }

  async function handleSendCode(): Promise<void> {
    if (activeTab === 'email') {
      const emailError = validateEmail();
      if (emailError) {
        setError(emailError);
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const cleanEmail = email.trim().toLowerCase();
        await sendEmailOTP(cleanEmail);
        router.push({
          pathname: '/(auth)/verify-otp' as any,
          params: {
            authMethod: 'email',
            email: cleanEmail,
            maskedTarget: cleanEmail,
          },
        });
      } catch (err: any) {
        setError(err instanceof Error ? err.message : 'Failed to send email verification code.');
      } finally {
        setIsLoading(false);
      }
    } else {
      const phoneError = validatePhone();
      if (phoneError) {
        setError(phoneError);
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
            authMethod: 'phone',
            phoneNumber: fullNumber,
            maskedTarget: `${selectedCountry.code} ${formatPhoneDisplay(phoneNumber)}`,
          },
        });
      } catch (err: any) {
        const message = err instanceof Error ? err.message : 'Failed to send OTP.';
        if (message.includes('too-many-requests')) {
          setError('Too many attempts. Please try again later.');
        } else if (message.includes('invalid-phone-number')) {
          setError('Invalid phone number. Please check and try again.');
        } else {
          setError(message);
        }
      } finally {
        setIsLoading(false);
      }
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
        {/* Brand Header */}
        <View style={styles.brandSection}>
          <Text style={styles.logo}>🛡️</Text>
          <Text style={styles.title}>ResQNet</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            Emergency Mesh & Triage Network{'\n'}Communication When Everything Else Fails
          </Text>
        </View>

        {/* Tab Switcher: Email vs Phone */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'email' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('email');
              setError(null);
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === 'email' && styles.tabButtonTextActive]}>
              📧 Gmail / Email
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'phone' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('phone');
              setError(null);
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === 'phone' && styles.tabButtonTextActive]}>
              📱 Phone SMS
            </Text>
          </Pressable>
        </View>

        {/* Form Container */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>
            {activeTab === 'email' ? 'Sign in with Email' : 'Sign in with Phone'}
          </Text>
          <Text style={styles.formDescription}>
            {activeTab === 'email'
              ? "We'll send a 6-digit verification code to your Gmail address."
              : "We'll send a one-time verification code to confirm your phone."}
          </Text>

          {activeTab === 'email' ? (
            /* Email Input */
            <View style={styles.emailContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                ref={emailInputRef}
                style={styles.emailInput}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                placeholder="yourname@gmail.com"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                accessibilityLabel="Email address"
              />
            </View>
          ) : (
            /* Phone Input */
            <>
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
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonSpacing}>
            <PrimaryButton
              title="Send Verification Code"
              onPress={handleSendCode}
              loading={isLoading}
              disabled={activeTab === 'email' ? !email.trim() : phoneNumber.length < 10}
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

        {/* Invisible reCAPTCHA container for web fallback */}
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
    paddingVertical: 36,
    justifyContent: 'center',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  demoBanner: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  demoBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
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
    marginBottom: 24,
  },
  logo: {
    fontSize: 54,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  divider: {
    width: 44,
    height: 3,
    backgroundColor: Colors.primary,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 2,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // Tab Switcher
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.background,
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
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Email Input
  emailContainer: {
    marginBottom: 16,
  },
  emailInput: {
    height: 54,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
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
    marginBottom: 16,
    gap: 10,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  countryCode: {
    fontSize: 15,
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
    marginTop: -8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryOptionActive: {
    backgroundColor: `${Colors.primary}08`,
  },
  countryOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  countryOptionCode: {
    fontSize: 14,
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
    fontSize: 18,
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
    marginTop: 20,
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
