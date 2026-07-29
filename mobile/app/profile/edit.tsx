import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Pressable, Platform } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";
import { DatabaseService } from "../../src/services/db";
import { UserProfile, BloodGroup } from "../../src/types/profile";
import { validateRequiredFields } from "../../src/utils/validation";

import EditableField from "../../src/components/profile/EditableField";
import SectionHeader from "../../src/components/profile/SectionHeader";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";
import DatePickerModal from "../../src/components/profile/DatePickerModal";

const BLOOD_GROUPS: BloodGroup[] = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Unknown"];
const GENDER_OPTIONS = [
  { label: "Male", icon: "male" as const },
  { label: "Female", icon: "female" as const },
  { label: "Other", icon: "transgender" as const },
];
const SKILLS_LIST = ["CPR Certified", "First Aid", "Volunteer Responder", "Doctor", "Nurse", "EMT / Paramedic", "Structural Engineer", "Amateur Radio Operator"];

const calculateAgeFromDob = (dobStr: string): string => {
  if (!dobStr || !/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) return "";
  const parts = dobStr.split("-").map(Number);
  const birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : "";
};

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    DatabaseService.getEmergencyProfile().then((res) => {
      setFormData(res.personal);
    });
  }, []);

  const toggleSkill = (skill: string) => {
    const current = formData.responderSkills || [];
    const exists = current.includes(skill);
    const next = exists ? current.filter((s) => s !== skill) : [...current, skill];
    setFormData((prev) => ({ ...prev, responderSkills: next }));
  };

  const handleDobChange = (dateStr: string) => {
    const autoAge = calculateAgeFromDob(dateStr);
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: dateStr,
      age: autoAge || prev.age,
    }));
  };

  const handleSelectDate = (dateStr: string, calculatedAge: number) => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: dateStr,
      age: String(calculatedAge),
    }));
  };

  const handleSave = async () => {
    setErrors({});
    const val = validateRequiredFields(formData);
    if (!val.isValid) {
      if (Platform.OS === 'web') {
        alert(val.error || "Please check required fields.");
      } else {
        Alert.alert("Validation Error", val.error || "Please check required fields.");
      }
      return;
    }

    setIsSaving(true);
    try {
      await DatabaseService.saveUserProfile(formData as UserProfile);
      if (Platform.OS === 'web') {
        alert("Personal profile and blood group updated in local SQLite vault.");
        router.back();
      } else {
        Alert.alert("Success", "Personal profile and blood group updated in local SQLite vault.", [
          { text: "OK", onPress: () => router.back() }
        ]);
        setTimeout(() => router.back(), 500);
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        alert("Failed to write to database.");
      } else {
        Alert.alert("Error", "Failed to write to database.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <MaterialIcons name="arrow-back" size={26} color={colors.text} onPress={() => router.back()} />
        <Text style={[styles.topTitle, { color: colors.text }]}>Edit Personal & Skills</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SectionHeader title="Personal Information" subtitle="Basic identity for rescue triage" icon="person" />
        
        <EditableField
          label="Full Name"
          required
          value={formData.fullName || ""}
          onChangeText={(val) => setFormData((prev) => ({ ...prev, fullName: val }))}
          placeholder="e.g., Alex Mercer"
        />

        {/* Date of Birth with Calendar Picker Button */}
        <View style={styles.dobRow}>
          <View style={{ flex: 1 }}>
            <EditableField
              label="Date of Birth"
              value={formData.dateOfBirth || ""}
              onChangeText={handleDobChange}
              placeholder="YYYY-MM-DD (e.g., 2006-11-27)"
              helperText={formData.age ? `Auto-detected Age: ${formData.age} Years` : "Tap calendar to select"}
            />
          </View>
          <Pressable 
            style={[styles.calendarBtn, { backgroundColor: `${Colors.primary}15`, borderColor: Colors.primary }]}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-month" size={24} color={Colors.primary} />
          </Pressable>
        </View>

        <DatePickerModal
          visible={showDatePicker}
          value={formData.dateOfBirth}
          onClose={() => setShowDatePicker(false)}
          onSelectDate={handleSelectDate}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <EditableField
              label="Age (Years)"
              value={formData.age || ""}
              onChangeText={(val) => setFormData((prev) => ({ ...prev, age: val }))}
              placeholder="Auto-calculated"
              keyboardType="numeric"
              helperText="Calculated from Date of Birth"
            />
          </View>
        </View>

        {/* Gender Selection Chips */}
        <Text style={[styles.label, { color: colors.text }]}>Gender *</Text>
        <View style={styles.genderGrid}>
          {GENDER_OPTIONS.map((g) => {
            const selected = (formData.gender || "").toLowerCase() === g.label.toLowerCase();
            return (
              <Pressable
                key={g.label}
                style={[
                  styles.genderChip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selected && styles.genderChipSelected,
                ]}
                onPress={() => setFormData((prev) => ({ ...prev, gender: g.label }))}
              >
                <MaterialIcons
                  name={g.icon}
                  size={20}
                  color={selected ? Colors.white : Colors.secondary}
                />
                <Text style={[styles.genderText, { color: colors.text }, selected && styles.genderTextSelected]}>
                  {g.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Blood Group *</Text>
        <View style={styles.bloodGrid}>
          {BLOOD_GROUPS.map((bg) => {
            const selected = formData.bloodGroup === bg;
            return (
              <Pressable
                key={bg}
                style={[
                  styles.bloodChip, 
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selected && styles.bloodChipSelected
                ]}
                onPress={() => setFormData((prev) => ({ ...prev, bloodGroup: bg }))}
              >
                <Text style={[styles.bloodText, { color: colors.text }, selected && styles.bloodTextSelected]}>{bg}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <EditableField
              label="Height"
              value={formData.height || ""}
              onChangeText={(val) => setFormData({ ...formData, height: val })}
              placeholder="e.g., 178 cm"
            />
          </View>
          <View style={styles.col}>
            <EditableField
              label="Weight"
              value={formData.weight || ""}
              onChangeText={(val) => setFormData({ ...formData, weight: val })}
              placeholder="e.g., 74 kg"
            />
          </View>
        </View>

        <SectionHeader title="Contact Info & Languages" subtitle="How dispatchers reach you" icon="contact-mail" />
        
        <EditableField
          label="Phone Number"
          required
          value={formData.phoneNumber || ""}
          onChangeText={(val) => setFormData({ ...formData, phoneNumber: val })}
          placeholder="+1 (555) 000-0000"
          keyboardType="phone-pad"
        />

        <EditableField
          label="Email Address"
          value={formData.email || ""}
          onChangeText={(val) => setFormData({ ...formData, email: val })}
          placeholder="user@resqnet.org"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <EditableField
          label="Languages Spoken"
          value={formData.languagesSpoken || ""}
          onChangeText={(val) => setFormData({ ...formData, languagesSpoken: val })}
          placeholder="English, Spanish, Hindi"
          helperText="Separated by commas"
        />

        <SectionHeader title="Responder Competencies" subtitle="Select your skills for incident matchmaking" icon="health-and-safety" />

        <View style={styles.skillGrid}>
          {SKILLS_LIST.map((skill) => {
            const isSelected = (formData.responderSkills || []).includes(skill);
            return (
              <Pressable
                key={skill}
                style={[styles.skillCard, isSelected && styles.skillCardSelected]}
                onPress={() => toggleSkill(skill)}
              >
                <MaterialIcons
                  name={isSelected ? "check-box" : "check-box-outline-blank"}
                  size={20}
                  color={isSelected ? Colors.secondary : Colors.textSecondary}
                />
                <Text style={[styles.skillCardText, isSelected && { color: Colors.text, fontWeight: "800" }]}>{skill}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Save to SQLite Vault"
            onPress={handleSave}
            isLoading={isSaving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
  dobRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 4,
  },
  calendarBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  genderGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  genderChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  genderChipSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  genderText: {
    fontSize: 14,
    fontWeight: "700",
  },
  genderTextSelected: {
    color: Colors.white,
    fontWeight: "900",
  },
  bloodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  bloodChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: "28%",
    alignItems: "center",
  },
  bloodChipSelected: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  bloodText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  bloodTextSelected: {
    color: Colors.white,
    fontWeight: "900",
  },
  skillGrid: {
    gap: 10,
    marginBottom: 24,
  },
  skillCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  skillCardSelected: {
    borderColor: Colors.secondary,
    backgroundColor: `${Colors.secondary}10`,
  },
  skillCardText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
});
