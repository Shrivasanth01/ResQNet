import { View, Text, StyleSheet, Pressable, Switch } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { MedicalInformation } from "../../types/profile";

interface Props {
  medical: MedicalInformation;
  consentToShare: boolean;
  organDonor: boolean;
  onEdit?: () => void;
  onToggleConsent?: (value: boolean) => void;
}

export default function MedicalCard({ medical, consentToShare, organDonor, onEdit, onToggleConsent }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={styles.iconBox}>
            <MaterialIcons name="medical-services" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.title}>Encrypted Medical Vault</Text>
            <Text style={styles.subtitle}>Protected by local SQLCipher storage</Text>
          </View>
        </View>

        {onEdit && (
          <Pressable style={styles.editButton} onPress={onEdit}>
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Conditions & History:</Text>
        <Text style={styles.sectionBody}>{medical.medicalConditions || "None reported"}</Text>
      </View>

      <View style={[styles.section, styles.allergySection]}>
        <View style={styles.allergyHeader}>
          <MaterialIcons name="warning" size={16} color={Colors.warning} />
          <Text style={[styles.sectionTitle, { color: Colors.warning, marginBottom: 0 }]}>Known Allergies (Critical):</Text>
        </View>
        <Text style={[styles.sectionBody, styles.allergyText]}>{medical.allergies || "No known severe allergies"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Active Medications:</Text>
        <Text style={styles.sectionBody}>{medical.currentMedications || "None"}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Disabilities / Mobility:</Text>
          <Text style={styles.sectionBody}>{medical.disabilities || "None"}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Pregnancy Status:</Text>
          <Text style={styles.sectionBody}>{medical.pregnancyStatus || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.consentBox}>
        <View style={styles.consentTextGroup}>
          <View style={styles.consentTitleRow}>
            <MaterialIcons name="share" size={16} color={Colors.secondary} />
            <Text style={styles.consentTitle}>Emergency Data Broadcast Consent</Text>
          </View>
          <Text style={styles.consentSub}>
            Allows mesh nodes & triage teams to view blood type & allergies during verified SOS incidents.
          </Text>
        </View>
        <Switch
          value={consentToShare}
          onValueChange={onToggleConsent}
          trackColor={{ false: Colors.border, true: Colors.secondary }}
          thumbColor={Colors.white}
          disabled={!onToggleConsent}
        />
      </View>

      <View style={styles.donorRow}>
        <MaterialIcons name="favorite" size={16} color={organDonor ? Colors.danger : Colors.textSecondary} />
        <Text style={styles.donorText}>Organ Donor Registry: <Text style={styles.donorBold}>{organDonor ? "Registered Donor" : "Not Registered"}</Text></Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}40`,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    backgroundColor: `${Colors.textSecondary}08`,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  allergySection: {
    backgroundColor: `${Colors.warning}12`,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
  },
  allergyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  allergyText: {
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  sectionBody: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
    backgroundColor: `${Colors.textSecondary}08`,
    padding: 14,
    borderRadius: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  consentBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: `${Colors.secondary}10`,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.secondary}30`,
  },
  consentTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  consentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  consentTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text,
  },
  consentSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  donorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  donorText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  donorBold: {
    color: Colors.text,
    fontWeight: "800",
  },
});
