import { View, Text, StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { EmergencyCategory, getCategoryColor, getCategoryIcon } from "./types";

const CATEGORIES: EmergencyCategory[] = [
  "Medical",
  "Fire",
  "Flood",
  "Road Accident",
  "Other",
];

export default function MapLegend() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerLeft}>
          <MaterialIcons name="layers" size={20} color={Colors.primary} />
          <Text style={styles.headerTitle}>Marker Legend</Text>

          {!isExpanded && (
            <View style={styles.dotsRow}>
              {CATEGORIES.map((cat) => (
                <View
                  key={cat}
                  style={[styles.dot, { backgroundColor: getCategoryColor(cat) }]}
                />
              ))}
            </View>
          )}
        </View>

        <MaterialIcons
          name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={22}
          color={Colors.textSecondary}
        />
      </Pressable>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.divider} />
          <View style={styles.grid}>
            {CATEGORIES.map((category) => {
              const color = getCategoryColor(category);
              const iconName = getCategoryIcon(category);

              return (
                <View key={category} style={styles.legendItem}>
                  <View style={[styles.iconBox, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
                    <MaterialIcons name={iconName} size={16} color={color} />
                  </View>
                  <Text style={styles.labelText}>{category}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  pressed: {
    opacity: 0.8,
    backgroundColor: `${Colors.primary}05`,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginLeft: 8,
  },
  dotsRow: {
    flexDirection: "row",
    marginLeft: 12,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  legendItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
});
