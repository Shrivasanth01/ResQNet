import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";

export interface EmergencyTypeOption {
  id: string;
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  description: string;
}

interface Props {
  option: EmergencyTypeOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function EmergencyTypeCard({ option, isSelected, onSelect }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed
      ]}
      onPress={() => onSelect(option.id)}
    >
      <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
        <MaterialIcons
          name={option.iconName}
          size={32}
          color={isSelected ? Colors.white : Colors.primary}
        />
      </View>
      <View style={styles.textBox}>
        <Text style={[styles.label, isSelected && styles.labelSelected]}>
          {option.label}
        </Text>
        <Text style={[styles.desc, isSelected && styles.descSelected]} numberOfLines={1}>
          {option.description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconBoxSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  textBox: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  labelSelected: {
    color: Colors.white,
  },
  desc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  descSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
});
