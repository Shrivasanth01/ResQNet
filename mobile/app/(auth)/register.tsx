import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import PrimaryButton from '../../src/components/buttons/PrimaryButton';
import TextInputField from '../../src/components/inputs/TextInputField';
import MedicalDropdown from '../../src/components/inputs/MedicalDropdown';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const MEDICAL_CONDITIONS_OPTIONS = ['NILL', 'Asthma', 'Diabetes', 'Hypertension', 'Heart Disease', 'Epilepsy', 'Other (Type custom...)'];
const ALLERGIES_OPTIONS = ['NILL', 'Penicillin', 'Peanuts', 'Sulfa Drugs', 'Aspirin', 'Latex', 'Other (Type custom...)'];
const MEDICATIONS_OPTIONS = ['NILL', 'Albuterol Inhaler', 'Insulin', 'Metformin', 'Amlodipine', 'Beta Blockers', 'Other (Type custom...)'];

export default function RegisterScreen() {
  const { register } = useAuth();

  // Step 1: Account Credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Physical Vitals & Medical Details
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  // Step 3: Emergency Contacts
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    // Section 1 — Personal & Account
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (!phoneNumber.trim()) return 'Phone number is required.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';

    // Section 2 — Vitals & Medical
    if (!dateOfBirth.trim()) return 'Date of birth is required.';
    if (!age.trim()) return 'Age is required.';
    if (!height.trim()) return 'Height is required.';
    if (!weight.trim()) return 'Weight is required.';
    if (!medicalConditions.trim()) return 'Medical conditions are required (enter "None" if not applicable).';
    if (!allergies.trim()) return 'Allergies field is required (enter "None" if not applicable).';
    if (!currentMedications.trim()) return 'Current medications field is required (enter "None" if not applicable).';

    // Section 3 — Emergency Contact
    if (!emergencyContactName.trim()) return 'Emergency contact name is required.';
    if (!emergencyContactRelation.trim()) return 'Emergency contact relationship is required.';
    if (!emergencyContactPhone.trim()) return 'Emergency contact phone number is required.';

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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: dateOfBirth.trim(),
        age: age.trim(),
        gender,
        height: height.trim(),
        weight: weight.trim(),
        bloodGroup,
        medicalConditions: medicalConditions.trim(),
        allergies: allergies.trim(),
        currentMedications: currentMedications.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactRelation: emergencyContactRelation.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
      });
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
        <View style={styles.header}>
          <Text style={styles.badge}>RESQNET PATIENT & MEDICAL INTAKE</Text>
          <Text style={styles.title}>Create Account Profile</Text>
          <Text style={styles.subtitle}>
            All fields marked with * are mandatory. Your medical vault ensures emergency triage readiness.
          </Text>
        </View>

        <View style={styles.form}>
          {/* 👤 Section 1: Personal & Account Identity */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>👤 Personal & Account Identity</Text>
            
            <TextInputField
              label="Full Name *"
              placeholder="e.g. Shri Vasanth"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <TextInputField
              label="Email Address *"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInputField
              label="Phone Number *"
              placeholder="+91 9876543210"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <TextInputField
                  label="Password *"
                  placeholder="Min. 6 chars"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              <View style={styles.halfCol}>
                <TextInputField
                  label="Confirm Password *"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          {/* 🩺 Section 2: Physical Vitals & Medical Details */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>🩺 Physical Vitals & Medical Info</Text>

            <TextInputField
              label="Date of Birth *"
              placeholder="DD/MM/YYYY"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              keyboardType="numeric"
            />

            <View style={styles.row}>
              <View style={styles.thirdCol}>
                <TextInputField
                  label="Age *"
                  placeholder="e.g. 24"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.thirdCol}>
                <TextInputField
                  label="Height (cm) *"
                  placeholder="e.g. 175"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.thirdCol}>
                <TextInputField
                  label="Weight (kg) *"
                  placeholder="e.g. 70"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Gender Selection */}
            <Text style={styles.inputLabel}>Gender *</Text>
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

            {/* Blood Group Selection */}
            <Text style={styles.inputLabel}>Blood Group *</Text>
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

            <MedicalDropdown
              label="Medical Conditions"
              required
              options={MEDICAL_CONDITIONS_OPTIONS}
              placeholder="Select condition or type custom..."
              value={medicalConditions}
              onChangeText={setMedicalConditions}
            />

            <MedicalDropdown
              label="Known Allergies"
              required
              options={ALLERGIES_OPTIONS}
              placeholder="Select allergy or type custom..."
              value={allergies}
              onChangeText={setAllergies}
            />

            <MedicalDropdown
              label="Current Medications"
              required
              options={MEDICATIONS_OPTIONS}
              placeholder="Select medication or type custom..."
              value={currentMedications}
              onChangeText={setCurrentMedications}
            />
          </View>

          {/* 🚨 Section 3: Emergency Contacts */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>🚨 Primary Emergency Contact</Text>

            <TextInputField
              label="Contact Full Name *"
              placeholder="e.g. Jane Doe"
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
            />

            <TextInputField
              label="Relationship *"
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
            title="Create Account & Save Profile"
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
    backgroundColor: 'rgba(39, 212, 199, 0.1)',
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
  footer: {
    marginTop: 24,
    marginBottom: 32,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
});