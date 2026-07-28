import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";

export type EmergencyCategory = "Medical" | "Fire" | "Flood" | "Road Accident" | "Other";

export interface EmergencyIncident {
  id: string;
  title: string;
  category: EmergencyCategory;
  severity: "Low" | "Medium" | "High" | "Critical";
  timestamp: string;
  distance: string;
  latitude: number;
  longitude: number;
}

export const getCategoryColor = (category: EmergencyCategory): string => {
  switch (category) {
    case "Medical": return Colors.emergency.medical;
    case "Fire": return Colors.emergency.fire;
    case "Flood": return Colors.emergency.flood;
    case "Road Accident": return Colors.emergency.accident;
    case "Other": return Colors.emergency.other;
    default: return Colors.primary;
  }
};

export const getCategoryIcon = (category: EmergencyCategory): keyof typeof MaterialIcons.glyphMap => {
  switch (category) {
    case "Medical": return "local-hospital";
    case "Fire": return "local-fire-department";
    case "Flood": return "water";
    case "Road Accident": return "minor-crash";
    case "Other": return "error-outline";
    default: return "warning";
  }
};
