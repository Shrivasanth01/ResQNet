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
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.infoBox}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{user.fullName}</Text>
            <View style={[styles.bloodBadge, { backgroundColor: `${Colors.danger}15` }]}>
              <Text style={[styles.bloodText, { color: Colors.danger }]}>
                {user.bloodGroup || "O+"}
              </Text>
            </View>
          </View>
          <Text style={[styles.subText, { color: colors.textSecondary }]}>{user.age} yrs • {user.gender} • DOB: {user.dateOfBirth}</Text>
        </View>

        {onEdit && (
          <Pressable style={styles.editButton} onPress={onEdit}>
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}15` }]}>
          <MaterialIcons name="straighten" size={16} color={colors.textSecondary} />
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Height: </Text>
          <Text style={[styles.gridValue, { color: colors.text }]}>{user.height}</Text>
        </View>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}15` }]}>
          <MaterialIcons name="monitor-weight" size={16} color={colors.textSecondary} />
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Weight: </Text>
          <Text style={[styles.gridValue, { color: colors.text }]}>{user.weight}</Text>
        </View>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}15` }]}>
          <MaterialIcons name="phone" size={16} color={colors.textSecondary} />
          <Text style={[styles.gridValue, { color: colors.text }]}>{user.phoneNumber}</Text>
        </View>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}15` }]}>
          <MaterialIcons name="email" size={16} color={colors.textSecondary} />
          <Text style={[styles.gridValue, { color: colors.text }]}>{user.email}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.skillsHeading, { color: colors.text }]}>Responder Skills & Competencies:</Text>
      <View style={styles.skillChipRow}>
        {user.responderSkills && user.responderSkills.map((skill, index) => (
          <View key={index} style={styles.skillChip}>
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
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 8,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.05)" as any,
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
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },
  bloodBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.danger}30`,
  },
  bloodText: {
    fontWeight: "900",
    fontSize: 13,
  },
  subText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: "500",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "47%",
    backgroundColor: `${Colors.textSecondary}08`,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  gridLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  gridValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    my: 16,
    marginVertical: 16,
  },
  skillsHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text,
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
    backgroundColor: `${Colors.secondary}15`,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: `${Colors.secondary}30`,
  },
  skillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
});
