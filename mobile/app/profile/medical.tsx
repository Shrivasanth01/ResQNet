import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Switch, Platform } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";
import { DatabaseService } from "../../src/services/db";
import { MedicalInformation, UserProfile } from "../../src/types/profile";

import EditableField from "../../src/components/profile/EditableField";
import SectionHeader from "../../src/components/profile/SectionHeader";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";

export default function MedicalInfoScreen() {
  const { colors } = useTheme();
  const [medical, setMedical] = useState<Partial<MedicalInformation>>({});
  const [personal, setPersonal] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    DatabaseService.getEmergencyProfile().then((res) => {
      setMedical(res.medical);
      setPersonal(res.personal);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await DatabaseService.saveMedicalInformation(medical as MedicalInformation);
      if (personal && personal.id) {
        await DatabaseService.saveUserProfile(personal as UserProfile);
      }
      if (Platform.OS === 'web') {
        alert("Medical information encrypted and updated in SQLite database.");
        router.back();
      } else {
        Alert.alert("Vault Secured", "Medical information encrypted and updated in SQLite database.", [
          { text: "OK", onPress: () => router.back() }
        ]);
        setTimeout(() => router.back(), 500);
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        alert("Could not save medical vault data.");
      } else {
        Alert.alert("Error", "Could not save medical vault data.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <MaterialIcons name="arrow-back" size={26} color={colors.text} onPress={() => router.back()} />
        <Text style={[styles.topTitle, { color: colors.text }]}>Encrypted Medical Vault</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoBanner, { backgroundColor: `${Colors.secondary}15`, borderColor: `${Colors.secondary}40` }]}>
          <MaterialIcons name="verified-user" size={28} color={Colors.secondary} />
          <View style={styles.infoBannerText}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Local Cryptographic Storage</Text>
            <Text style={[styles.infoSub, { color: colors.textSecondary }]}>Your clinical history is encrypted using DataVaultCipher and never broadcast without explicit consent.</Text>
          </View>
        </View>

        <SectionHeader title="Clinical History & Allergies" subtitle="Vital data for attending emergency physicians" icon="local-hospital" />
        
        <EditableField
          label="Medical Conditions"
          value={medical.medicalConditions || ""}
          onChangeText={(val) => setMedical((prev) => ({ ...prev, medicalConditions: val }))}
          placeholder="e.g., Asthma, Insulin-dependent Diabetes, Hypertension"
          helperText="List chronic illnesses or conditions"
          multiline
          numberOfLines={3}
          style={{ minHeight: 70 }}
        />

        <EditableField
          label="Known Drug & Food Allergies (Critical)"
          value={medical.allergies || ""}
          onChangeText={(val) => setMedical((prev) => ({ ...prev, allergies: val }))}
          placeholder="e.g., Penicillin, Peanuts, Latex"
          helperText="Severe allergies will flash red on responder triage terminals"
          multiline
          numberOfLines={2}
          style={{ minHeight: 60 }}
        />

        <EditableField
          label="Current Active Medications & Dosages"
          value={medical.currentMedications || ""}
          onChangeText={(val) => setMedical((prev) => ({ ...prev, currentMedications: val }))}
          placeholder="e.g., Metformin 500mg daily, Albuterol emergency inhaler"
          helperText="Includes daily prescriptions and life-saving injectors"
          multiline
          numberOfLines={3}
          style={{ minHeight: 70 }}
        />

        <SectionHeader title="Physical Considerations" subtitle="Helps Search & Rescue plan extraction equipment" icon="accessible" />

        <EditableField
          label="Disabilities or Mobility Constraints"
          value={medical.disabilities || ""}
          onChangeText={(val) => setMedical((prev) => ({ ...prev, disabilities: val }))}
          placeholder="e.g., Wheelchair user, visually impaired, none"
        />

        <EditableField
          label="Pregnancy Status (Optional)"
          value={medical.pregnancyStatus || ""}
          onChangeText={(val) => setMedical((prev) => ({ ...prev, pregnancyStatus: val }))}
          placeholder="e.g., Not Applicable / 2nd Trimester (24 weeks)"
        />

        <SectionHeader title="Consent & Directives" subtitle="Control SOS radio relay access" icon="share" />

        <View style={[styles.switchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchText}>
            <Text style={[styles.switchTitle, { color: colors.text }]}>Emergency Medical Relay Consent</Text>
            <Text style={[styles.switchSub, { color: colors.textSecondary }]}>Allow tactical radio mesh nodes to transmit your blood type and allergies during confirmed SOS events.</Text>
          </View>
          <Switch
            value={personal.consentToShareMedical || false}
            onValueChange={(v) => setPersonal((prev) => ({ ...prev, consentToShareMedical: v }))}
            trackColor={{ false: colors.border, true: Colors.secondary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={[styles.switchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchText}>
            <Text style={[styles.switchTitle, { color: colors.text }]}>Registered Organ Donor</Text>
            <Text style={[styles.switchSub, { color: colors.textSecondary }]}>Display standard organ donor symbol on responder identification profile.</Text>
          </View>
          <Switch
            value={personal.organDonor || false}
            onValueChange={(v) => setPersonal((prev) => ({ ...prev, organDonor: v }))}
            trackColor={{ false: colors.border, true: Colors.danger }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Save Medical Vault"
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
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.secondary}15`,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Colors.secondary}40`,
    marginVertical: 14,
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 14,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
  },
  infoSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  switchBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  switchText: {
    flex: 1,
    marginRight: 14,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
  },
  switchSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 40,
  },
});
