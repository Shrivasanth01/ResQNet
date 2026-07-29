import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import { UserProfile } from "../../types/profile";

interface Props {
  user: UserProfile;
  onEdit?: () => void;
  showSkillsOnly?: boolean;
}

export default function ProfileCard({ user, onEdit }: Props) {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[
      styles.card, 
      { backgroundColor: colors.surface, borderColor: isDarkMode ? `${Colors.secondary}30` : colors.border }
    ]}>
      <View style={styles.header}>
        <View style={styles.infoBox}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{user.fullName}</Text>
            <View style={[styles.bloodBadge, { backgroundColor: `${Colors.primary}18`, borderColor: `${Colors.primary}40` }]}>
              <MaterialIcons name="bloodtype" size={14} color={Colors.primary} />
              <Text style={[styles.bloodText, { color: Colors.primary }]}>
                {user.bloodGroup || "O+"}
              </Text>
            </View>
          </View>
          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            {user.age} Yrs • {user.gender} • DOB: {user.dateOfBirth}
          </Text>
        </View>

        {onEdit && (
          <Pressable style={styles.editButton} onPress={onEdit}>
            <MaterialIcons name="edit" size={18} color={Colors.secondary} />
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}10`, borderColor: colors.border }]}>
          <MaterialIcons name="straighten" size={16} color={Colors.secondary} />
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Height:</Text>
          <Text style={[styles.gridValue, { color: colors.text }]}>{user.height}</Text>
        </View>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}10`, borderColor: colors.border }]}>
          <MaterialIcons name="monitor-weight" size={16} color={Colors.secondary} />
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Weight:</Text>
          <Text style={[styles.gridValue, { color: colors.text }]}>{user.weight}</Text>
        </View>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}10`, borderColor: colors.border }]}>
          <MaterialIcons name="phone" size={16} color={Colors.secondary} />
          <Text style={[styles.gridValue, { color: colors.text }]}>{user.phoneNumber}</Text>
        </View>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}10`, borderColor: colors.border }]}>
          <MaterialIcons name="email" size={16} color={Colors.secondary} />
          <Text style={[styles.gridValue, { color: colors.text }]} numberOfLines={1}>{user.email}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.skillsHeading, { color: colors.text }]}>Responder Skills & Competencies:</Text>
      <View style={styles.skillChipRow}>
        {user.responderSkills && user.responderSkills.map((skill, index) => (
          <View key={index} style={[styles.skillChip, { backgroundColor: `${Colors.secondary}15`, borderColor: `${Colors.secondary}35` }]}>
            <MaterialIcons name="health-and-safety" size={14} color={Colors.secondary} />
            <Text style={[styles.skillText, { color: colors.text }]}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <MaterialIcons name="translate" size={14} color={colors.textSecondary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Languages: {user.languagesSpoken}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    marginVertical: 8,
    boxShadow: "0px 4px 16px rgba(0,0,0,0.06)" as any,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  bloodBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  bloodText: {
    fontWeight: "900",
    fontSize: 13,
  },
  subText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${Colors.secondary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  gridValue: {
    fontSize: 12,
    fontWeight: "800",
    flexShrink: 1,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  skillsHeading: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },
  skillChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
  },
  skillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
