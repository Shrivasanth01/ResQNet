import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Colors } from '../../src/theme/colors';
import { verifyOTP, sendOTP, clearPendingOTP } from '../../src/services/firebaseAuth';
import { verifyEmailOTP, sendEmailOTP, clearPendingEmailOTP } from '../../src/services/emailAuth';
import { isFirebaseConfigured } from '../../src/firebase';
import { checkUserStatus, createUserDoc } from '../../src/services/firestoreUser';
import { useAuth } from '../../src/context/AuthContext';
import PrimaryButton from '../../src/components/buttons/PrimaryButton';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyOTPScreen() {
  const { authMethod = 'email', email, phoneNumber, maskedTarget, maskedNumber } = useLocalSearchParams<{
    authMethod?: 'email' | 'phone';
    email?: string;
    phoneNumber?: string;
    maskedTarget?: string;
    maskedNumber?: string;
  }>();
  const { refreshAuthState } = useAuth();
  const isConfigured = isFirebaseConfigured();
  const isEmailAuth = authMethod === 'email';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayTarget = maskedTarget || (isEmailAuth ? email : maskedNumber || phoneNumber) || '';

  // Start countdown timer on mount
  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCountdown(): void {
    setResendTimer(RESEND_COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleOtpChange(index: number, value: string): void {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    if (value.length > 1) {
      // Handle paste — distribute digits across fields
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH - index);
      for (let i = 0; i < digits.length; i++) {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digits[i];
        }
      }
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    setError(null);
  }

  function handleKeyPress(index: number, key: string): void {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(): Promise<void> {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      let authedUser: any;
      if (isEmailAuth) {
        authedUser = await verifyEmailOTP(otpCode, email);
      } else {
        authedUser = await verifyOTP(otpCode);
      }

      const uid = authedUser.uid || authedUser.id;
      const userPhone = phoneNumber || authedUser.phoneNumber || '';
      const userEmail = email || authedUser.email || '';

      // Default to profile-completion flow
      let goToProfile = true;

      try {
        const status = await Promise.race([
          checkUserStatus(uid),
          new Promise<{ exists: boolean; profileCompleted: boolean }>((resolve) =>
            setTimeout(() => resolve({ exists: false, profileCompleted: false }), 2000)
          ),
        ]);
        if (!status.exists) {
          createUserDoc(uid, userPhone).catch(() => {});
          goToProfile = true;
        } else {
          goToProfile = !status.profileCompleted;
        }
      } catch {
        goToProfile = true;
      }

      refreshAuthState().catch(() => {});

      if (!goToProfile) {
        router.replace('/(tabs)');
      } else {
        router.replace({
          pathname: '/(auth)/complete-profile' as any,
          params: { phoneNumber: userPhone, email: userEmail },
        });
      }
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Verification failed.';
      if (message.includes('invalid-verification-code') || message.includes('code-expired')) {
        setError('Invalid or expired code. Please try again.');
      } else if (message.includes('too-many-requests')) {
        setError('Too many attempts. Please wait and try again.');
      } else {
        setError(message);
      }
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend(): Promise<void> {
    if (resendTimer > 0) return;

    setIsResending(true);
    setError(null);

    try {
      if (isEmailAuth) {
        if (!email) return;
        clearPendingEmailOTP();
        await sendEmailOTP(email);
      } else {
        if (!phoneNumber) return;
        clearPendingOTP();
        await sendOTP(phoneNumber);
      }
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      startCountdown();
    } catch (err: any) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  function handleChangeTarget(): void {
    if (isEmailAuth) {
      clearPendingEmailOTP();
    } else {
      clearPendingOTP();
    }
    router.back();
  }

  const isOtpComplete = otp.every((d) => d !== '');

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{isEmailAuth ? '📧' : '📱'}</Text>
          </View>
          <Text style={styles.title}>
            {isEmailAuth ? 'Verify Your Email' : 'Verify Your Number'}
          </Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit verification code to
          </Text>
          <Text style={styles.phoneDisplay}>{displayTarget}</Text>
        </View>

        {/* OTP Input Grid */}
        <View style={styles.otpContainer}>
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpCell,
                otp[index] ? styles.otpCellFilled : null,
                error ? styles.otpCellError : null,
              ]}
              value={otp[index]}
              onChangeText={(value) => handleOtpChange(index, value)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              selectTextOnFocus
              accessibilityLabel={`Digit ${index + 1}`}
              autoFocus={index === 0}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Verify Button */}
        <View style={styles.buttonSection}>
          <PrimaryButton
            title="Verify & Continue"
            onPress={handleVerify}
            loading={isVerifying}
            disabled={!isOtpComplete}
          />
        </View>

        {/* Resend / Change Email or Phone */}
        <View style={styles.actionsRow}>
          {resendTimer > 0 ? (
            <Text style={styles.timerText}>
              Resend code in{' '}
              <Text style={styles.timerBold}>{resendTimer}s</Text>
            </Text>
          ) : (
            <Pressable onPress={handleResend} disabled={isResending}>
              <Text style={styles.resendLink}>
                {isResending ? 'Sending...' : 'Resend Code'}
              </Text>
            </Pressable>
          )}

          <View style={styles.actionDot} />

          <Pressable onPress={handleChangeTarget}>
            <Text style={styles.changeLink}>
              {isEmailAuth ? 'Change Email' : 'Change Number'}
            </Text>
          </Pressable>
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
    paddingVertical: 40,
    justifyContent: 'center',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneDisplay: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  demoHintBox: {
    marginTop: 14,
    backgroundColor: `${Colors.primary}12`,
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  demoHintText: {
    fontSize: 13,
    color: Colors.text,
  },
  demoHintBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  demoHintCode: {
    fontWeight: '900',
    color: Colors.primary,
  },

  // OTP Container
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  otpCell: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  otpCellFilled: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  otpCellError: {
    borderColor: Colors.danger,
  },

  // Error
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },

  // Button
  buttonSection: {
    marginBottom: 24,
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  timerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timerBold: {
    fontWeight: '700',
    color: Colors.text,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  changeLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // reCAPTCHA
  recaptchaContainer: {
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
});
