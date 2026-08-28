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
    <View style={[
      styles.card, 
      { backgroundColor: colors.surface, borderColor: colors.border }
    ]}>
      <View style={styles.header}>
        <View style={styles.infoBox}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{user.fullName}</Text>
            <View style={[styles.bloodBadge, { backgroundColor: `${Colors.primary}12`, borderColor: `${Colors.primary}30` }]}>
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
          <Pressable style={[styles.editButton, { backgroundColor: `${Colors.primary}12` }]} onPress={onEdit}>
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}08`, borderColor: colors.border }]}>
          <MaterialIcons name="straighten" size={15} color={colors.textSecondary} />
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Height:</Text>
          <Text style={[styles.gridValue, { color: colors.text }]}>{user.height}</Text>
        </View>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}08`, borderColor: colors.border }]}>
          <MaterialIcons name="monitor-weight" size={15} color={colors.textSecondary} />
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Weight:</Text>
          <Text style={[styles.gridValue, { color: colors.text }]}>{user.weight}</Text>
        </View>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}08`, borderColor: colors.border }]}>
          <MaterialIcons name="phone" size={15} color={colors.textSecondary} />
          <Text style={[styles.gridValue, { color: colors.text }]}>{user.phoneNumber}</Text>
        </View>
        <View style={[styles.gridItem, { backgroundColor: `${colors.textSecondary}08`, borderColor: colors.border }]}>
          <MaterialIcons name="email" size={15} color={colors.textSecondary} />
          <Text style={[styles.gridValue, { color: colors.text }]} numberOfLines={1}>{user.email}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.skillsHeading, { color: colors.text }]}>Responder Skills & Competencies:</Text>
      <View style={styles.skillChipRow}>
        {user.responderSkills && user.responderSkills.map((skill, index) => (
          <View key={index} style={[styles.skillChip, { backgroundColor: `${Colors.primary}08`, borderColor: `${Colors.primary}20` }]}>
            <MaterialIcons name="health-and-safety" size={14} color={Colors.primary} />
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
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginVertical: 8,
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
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  bloodBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  bloodText: {
    fontWeight: "900",
    fontSize: 12,
  },
  subText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    borderRadius: 10,
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
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    paddingHorizontal: 10,
    borderRadius: 10,
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
