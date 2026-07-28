import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
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
    <Marker
      coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
      onPress={() => onPress(incident)}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.markerWrapper}>
        <View style={[styles.bubble, { backgroundColor: color }, isSelected && styles.selectedBubble]}>
          <MaterialIcons name={iconName} size={22} color={Colors.white} />
        </View>
        <View style={[styles.triangle, { borderTopColor: color }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerWrapper: {
    alignItems: "center",
    width: 44,
    height: 52,
  },
  bubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
