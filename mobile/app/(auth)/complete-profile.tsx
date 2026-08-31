import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import { markProfileCompleted } from '../../src/services/firestoreUser';
import { getCurrentUser } from '../../src/services/firebaseAuth';
import { saveProfileToCloud } from '../../src/services/emailAuth';
import { saveCompleteProfile, createNewUserProfile } from '../../src/storage/database';
import { authStorage } from '../../src/storage/authStorage';
import PrimaryButton from '../../src/components/buttons/PrimaryButton';
import TextInputField from '../../src/components/inputs/TextInputField';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export default function CompleteProfileScreen() {
  const { phoneNumber, email: paramEmail } = useLocalSearchParams<{
    phoneNumber?: string;
    email?: string;
  }>();
  const { refreshAuthState } = useAuth();

  // Step 1: Personal Identity
  const [name, setName] = useState('');
  const [email, setEmail] = useState(paramEmail || '');
  const [phone, setPhone] = useState(phoneNumber || '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');

  // Step 2: Physical & Medical
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  // Step 3: Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!name.trim()) return 'Full name is required.';
    if (!age.trim()) return 'Age is required.';
    if (!emergencyContactPhone.trim()) return 'Emergency contact phone is required.';
    return null;
  }

  async function handleComplete(): Promise<void> {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const firebaseUser = getCurrentUser();
      if (!firebaseUser) {
        setError('Authentication expired. Please log in again.');
        return;
      }

      // Build registration data
      const registrationData = {
        name: name.trim(),
        email: email.trim() || `${firebaseUser.uid}@resqnet.app`,
        phoneNumber: phone.trim() || phoneNumber || firebaseUser.phoneNumber || '',
        age: age.trim(),
        gender,
        height: height.trim(),
        weight: weight.trim(),
        bloodGroup,
        medicalConditions: medicalConditions.trim() || 'None reported',
        allergies: allergies.trim() || 'None reported',
        currentMedications: currentMedications.trim() || 'None',
        emergencyContactName: emergencyContactName.trim() || 'Primary Emergency Contact',
        emergencyContactRelation: emergencyContactRelation.trim() || 'Family',
        emergencyContactPhone: emergencyContactPhone.trim(),
      };

      // Save to local SQLite vault (this is local and fast)
      const userEmail = registrationData.email;
      const profile = createNewUserProfile(registrationData.name, userEmail, registrationData);
      await saveCompleteProfile(profile, userEmail);

      // Save permanently to Central Cloud Database linked to this Gmail
      saveProfileToCloud(registrationData).catch(() => {});

      // Persist the "profile complete" flag locally so subsequent page
      // refreshes don't bounce the user back to this form even if
      // Firestore is slow or unreachable.
      await authStorage.setProfileCompleted(true);

      // Mark profile completed in Firestore — best-effort, non-blocking
      // so a slow/unreachable Firestore never freezes the UI.
      Promise.race([
        markProfileCompleted(firebaseUser.uid, {
          displayName: registrationData.name,
          email: userEmail,
        }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]).catch(() => {
        // Firestore failed — already saved locally, ignore
      });

      // Refresh auth context state (also non-blocking)
      refreshAuthState().catch(() => {});

      // Navigate to dashboard immediately
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>RESQNET EMERGENCY PROFILE</Text>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            This information is stored locally on your device for emergency triage readiness.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Section 1: Personal Identity */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>👤 Personal Identity</Text>

            <TextInputField
              label="Full Name *"
              placeholder="e.g. Shri Vasanth"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <TextInputField
              label="Email Address"
              placeholder="name@example.com (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <TextInputField
                  label="Age *"
                  placeholder="e.g. 24"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfCol}>
                <TextInputField
                  label="Phone"
                  placeholder="+91..."
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Gender Selection */}
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[styles.chip, gender === g && styles.chipActive]}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Section 2: Physical & Medical */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>🩺 Physical & Medical Info</Text>

            <View style={styles.row}>
              <View style={styles.thirdCol}>
                <TextInputField
                  label="Height (cm)"
                  placeholder="175"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.thirdCol}>
                <TextInputField
                  label="Weight (kg)"
                  placeholder="70"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Blood Group Selection */}
            <Text style={styles.inputLabel}>Blood Group</Text>
            <View style={styles.chipRow}>
              {BLOOD_GROUPS.map((bg) => (
                <Pressable
                  key={bg}
                  onPress={() => setBloodGroup(bg)}
                  style={[styles.chip, bloodGroup === bg && styles.chipActiveBlood]}
                >
                  <Text style={[styles.chipText, bloodGroup === bg && styles.chipTextActiveBlood]}>
                    🩸 {bg}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInputField
              label="Medical Conditions"
              placeholder="e.g. Asthma, Diabetes, or None"
              value={medicalConditions}
              onChangeText={setMedicalConditions}
            />

            <TextInputField
              label="Known Allergies"
              placeholder="e.g. Penicillin, Peanuts, or None"
              value={allergies}
              onChangeText={setAllergies}
            />

            <TextInputField
              label="Current Medications"
              placeholder="e.g. Albuterol Inhaler, or None"
              value={currentMedications}
              onChangeText={setCurrentMedications}
            />
          </View>

          {/* Section 3: Emergency Contact */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>🚨 Primary Emergency Contact</Text>

            <TextInputField
              label="Contact Full Name"
              placeholder="e.g. Jane Doe"
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
            />

            <TextInputField
              label="Relationship"
              placeholder="e.g. Parent / Spouse / Sibling"
              value={emergencyContactRelation}
              onChangeText={setEmergencyContactRelation}
            />

            <TextInputField
              label="Emergency Phone Number *"
              placeholder="+91 9900011122"
              value={emergencyContactPhone}
              onChangeText={setEmergencyContactPhone}
              keyboardType="phone-pad"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton
            title="Save Profile & Enter ResQNet"
            onPress={handleComplete}
            loading={isLoading}
          />
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  form: {
    width: '100%',
  },
  cardSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  thirdCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  chipActiveBlood: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  chipTextActiveBlood: {
    color: Colors.white,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});
