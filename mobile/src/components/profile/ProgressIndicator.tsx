import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import { CompleteEmergencyProfile } from "../../types/profile";

interface Props {
  profile: CompleteEmergencyProfile | null;
}

export default function ProgressIndicator({ profile }: Props) {
  const { colors } = useTheme();

  if (!profile) return null;

  let score = 0;
  const total = 5;

  if (profile.personal.fullName && profile.personal.phoneNumber) score++;
  if (profile.personal.bloodGroup && profile.personal.bloodGroup !== "Unknown") score++;
  if (profile.medical.medicalConditions || profile.medical.allergies) score++;
  if (profile.contacts && profile.contacts.length >= 2) score++;
  if (profile.personal.responderSkills && profile.personal.responderSkills.length > 0) score++;

  const percentage = Math.min(100, Math.round((score / total) * 100));
  const isComplete = percentage >= 100;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons 
            name={isComplete ? "verified-user" : "security-update-warning"} 
            size={22} 
            color={isComplete ? Colors.secondary : Colors.primary} 
          />
          <Text style={[styles.title, { color: colors.text }]}>Emergency Profile Readiness</Text>
        </View>
        <Text style={[styles.percentage, { color: isComplete ? Colors.secondary : Colors.primary }]}>
          {percentage}%
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: `${colors.textSecondary}25` }]}>
        <View 
          style={[
            styles.bar, 
            { width: `${percentage}%`, backgroundColor: isComplete ? Colors.secondary : Colors.primary }
          ]} 
        />
      </View>

      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
        {isComplete 
          ? "Medical Vault completely encrypted and ready for offline P2P mesh relay & AI emergency triage." 
          : "Complete your medical conditions and at least 2 emergency contacts to achieve full disaster readiness."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
  },
  percentage: {
    fontSize: 16,
    fontWeight: "900",
  },
  track: {
    height: 10,
    backgroundColor: `${Colors.textSecondary}20`,
    borderRadius: 5,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 5,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
    fontWeight: "500",
  },
});
