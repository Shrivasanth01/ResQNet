import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors } from "../../theme/colors";

export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";

interface Props {
  selectedSeverity: SeverityLevel;
  onSelect: (severity: SeverityLevel) => void;
}

const SEVERITIES: { label: SeverityLevel; color: string }[] = [
  { label: "Low", color: Colors.secondary },
  { label: "Medium", color: Colors.warning },
  { label: "High", color: "#FF7043" }, // Deep orange
  { label: "Critical", color: Colors.danger },
];

export default function SeveritySelector({ selectedSeverity, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Severity Level</Text>
      <View style={styles.grid}>
        {SEVERITIES.map(({ label, color }) => {
          const isSelected = selectedSeverity === label;
          return (
            <Pressable
              key={label}
              style={({ pressed }) => [
                styles.pill,
                isSelected ? { backgroundColor: color, borderColor: color } : styles.unselectedPill,
                pressed && styles.pressed,
              ]}
              onPress={() => onSelect(label)}
            >
              <View
                style={[
                  styles.indicator,
                  { backgroundColor: isSelected ? Colors.white : color },
                ]}
              />
              <Text style={[styles.pillText, isSelected && styles.selectedPillText]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  pill: {
    flex: 1,
    minWidth: "46%",
    margin: 4,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  unselectedPill: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  pillText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  selectedPillText: {
    color: Colors.white,
    fontWeight: "700",
  },
});
