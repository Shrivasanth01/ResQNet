import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Pressable, Platform } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../src/theme/colors";
import { DatabaseService } from "../../src/services/db";
import { UserProfile, BloodGroup } from "../../src/types/profile";
import { validateRequiredFields } from "../../src/utils/validation";

import EditableField from "../../src/components/profile/EditableField";
import SectionHeader from "../../src/components/profile/SectionHeader";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";

const BLOOD_GROUPS: BloodGroup[] = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Unknown"];
const SKILLS_LIST = ["CPR Certified", "First Aid", "Volunteer Responder", "Doctor", "Nurse", "EMT / Paramedic", "Structural Engineer", "Amateur Radio Operator"];

export default function EditProfileScreen() {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    DatabaseService.getEmergencyProfile().then((res) => {
      setFormData(res.personal);
    });
  }, []);

  const toggleSkill = (skill: string) => {
    const current = formData.responderSkills || [];
    const exists = current.includes(skill);
    const next = exists ? current.filter((s) => s !== skill) : [...current, skill];
    setFormData({ ...formData, responderSkills: next });
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
        alert("Personal profile and responder competencies updated in local SQLite vault.");
        router.back();
      } else {
        Alert.alert("Success", "Personal profile and responder competencies updated in local SQLite vault.", [
          { text: "OK", onPress: () => router.back() }
        ]);
        // Fallback navigation for native
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <MaterialIcons name="arrow-back" size={26} color={Colors.text} onPress={() => router.back()} />
        <Text style={styles.topTitle}>Edit Personal & Skills</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SectionHeader title="Personal Information" subtitle="Basic identity for rescue triage" icon="person" />
        
        <EditableField
          label="Full Name"
          required
          value={formData.fullName || ""}
          onChangeText={(val) => setFormData({ ...formData, fullName: val })}
          placeholder="e.g., Alex Mercer"
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <EditableField
              label="Age (Years)"
              value={formData.age || ""}
              onChangeText={(val) => setFormData({ ...formData, age: val })}
              placeholder="29"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.col}>
            <EditableField
              label="Gender"
              value={formData.gender || ""}
              onChangeText={(val) => setFormData({ ...formData, gender: val })}
              placeholder="e.g., Male/Female/Other"
            />
          </View>
        </View>

        <EditableField
          label="Date of Birth"
          value={formData.dateOfBirth || ""}
          onChangeText={(val) => setFormData({ ...formData, dateOfBirth: val })}
          placeholder="YYYY-MM-DD (e.g., 1997-04-12)"
        />

        <Text style={styles.label}>Blood Group *</Text>
        <View style={styles.bloodGrid}>
          {BLOOD_GROUPS.map((bg) => {
            const selected = formData.bloodGroup === bg;
            return (
              <Pressable
                key={bg}
                style={[styles.bloodChip, selected && styles.bloodChipSelected]}
                onPress={() => setFormData({ ...formData, bloodGroup: bg })}
              >
                <Text style={[styles.bloodText, selected && styles.bloodTextSelected]}>{bg}</Text>
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
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
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
