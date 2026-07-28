import { View, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { EmergencyIncident, getCategoryColor, getCategoryIcon } from "./types";

export * from "./types";

interface Props {
  incident: EmergencyIncident;
  onPress: (incident: EmergencyIncident) => void;
  isSelected?: boolean;
}

export default function EmergencyMarker({ incident, onPress, isSelected = false }: Props) {
  const color = getCategoryColor(incident.category);
  const iconName = getCategoryIcon(incident.category);

  return (
    <Pressable onPress={() => onPress(incident)} style={styles.markerWrapper}>
      <View style={[styles.bubble, { backgroundColor: color }, isSelected && styles.selectedBubble]}>
        <MaterialIcons name={iconName} size={22} color={Colors.white} />
      </View>
      <View style={[styles.triangle, { borderTopColor: color }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  markerWrapper: {
    alignItems: "center",
    width: 44,
    height: 52,
    cursor: "pointer" as any,
  },
  bubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: Colors.white,
    boxShadow: "0px 2px 4px rgba(0,0,0,0.3)" as any,
  },
  selectedBubble: {
    transform: [{ scale: 1.15 }],
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
});
