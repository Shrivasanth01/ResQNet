import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";

export interface ReviewItem {
  label: string;
  value: string;
  highlight?: boolean;
}

interface Props {
  title: string;
  items: ReviewItem[];
  onEdit?: () => void;
  iconName?: keyof typeof MaterialIcons.glyphMap;
}

export default function ReviewCard({ title, items, onEdit, iconName = "check-circle-outline" }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <MaterialIcons name={iconName} size={22} color={Colors.primary} />
          <Text style={styles.title}>{title}</Text>
        </View>
        
        {onEdit && (
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
          >
            <Text style={styles.editText}>Edit</Text>
            <MaterialIcons name="edit" size={14} color={Colors.primary} style={styles.editIcon} />
          </Pressable>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.body}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={[styles.itemValue, item.highlight && styles.itemValueHighlight]}>
              {item.value || "None"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginLeft: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  editText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  editIcon: {
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  body: {
    paddingVertical: 4,
  },
  row: {
    marginBottom: 10,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
  },
  itemValueHighlight: {
    color: Colors.danger,
    fontWeight: "700",
  },
});
