import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { UserProfile } from "../../types/profile";

interface Props {
  user: UserProfile;
  onEdit?: () => void;
  showSkillsOnly?: boolean;
}

export default function ProfileCard({ user, onEdit }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.infoBox}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.fullName}</Text>
            <View style={[styles.bloodBadge, { backgroundColor: `${Colors.danger}15` }]}>
              <Text style={[styles.bloodText, { color: Colors.danger }]}>
                {user.bloodGroup || "O+"}
              </Text>
            </View>
          </View>
          <Text style={styles.subText}>{user.age} yrs • {user.gender} • DOB: {user.dateOfBirth}</Text>
        </View>

        {onEdit && (
          <Pressable style={styles.editButton} onPress={onEdit}>
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <MaterialIcons name="straighten" size={16} color={Colors.textSecondary} />
          <Text style={styles.gridLabel}>Height: </Text>
          <Text style={styles.gridValue}>{user.height}</Text>
        </View>
        <View style={styles.gridItem}>
          <MaterialIcons name="monitor-weight" size={16} color={Colors.textSecondary} />
          <Text style={styles.gridLabel}>Weight: </Text>
          <Text style={styles.gridValue}>{user.weight}</Text>
        </View>
        <View style={styles.gridItem}>
          <MaterialIcons name="phone" size={16} color={Colors.textSecondary} />
          <Text style={styles.gridValue}>{user.phoneNumber}</Text>
        </View>
        <View style={styles.gridItem}>
          <MaterialIcons name="email" size={16} color={Colors.textSecondary} />
          <Text style={styles.gridValue}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.skillsHeading}>Responder Skills & Competencies:</Text>
      <View style={styles.skillChipRow}>
        {user.responderSkills && user.responderSkills.map((skill, index) => (
          <View key={index} style={styles.skillChip}>
            <MaterialIcons name="health-and-safety" size={14} color={Colors.secondary} />
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <MaterialIcons name="translate" size={14} color={Colors.textSecondary} />
        <Text style={styles.footerText}>Languages: {user.languagesSpoken}</Text>
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
