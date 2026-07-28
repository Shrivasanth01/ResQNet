import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { EmergencyIncident, getCategoryColor, getCategoryIcon } from "./types";
import PrimaryButton from "../buttons/PrimaryButton";

interface Props {
  incident: EmergencyIncident | null;
  onClose: () => void;
  onNavigate: (incident: EmergencyIncident) => void;
}

export default function BottomSheetCard({ incident, onClose, onNavigate }: Props) {
  if (!incident) return null;

  const categoryColor = getCategoryColor(incident.category);
  const categoryIcon = getCategoryIcon(incident.category);

  const getSeverityColor = (severity: EmergencyIncident["severity"]): string => {
    switch (severity) {
      case "Critical": return Colors.danger;
      case "High": return "#FF7043"; // Deep Orange
      case "Medium": return Colors.warning;
      case "Low": return Colors.secondary;
      default: return Colors.textSecondary;
    }
  };

  const severityColor = getSeverityColor(incident.severity);

  return (
    <View style={styles.container}>
      {/* Top Handle / Close Bar */}
      <View style={styles.topRow}>
        <View style={styles.pillHandle} />
        <Pressable 
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]} 
          onPress={onClose}
        >
          <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Incident Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: `${categoryColor}15`, borderColor: `${categoryColor}40` }]}>
          <MaterialIcons name={categoryIcon} size={32} color={categoryColor} />
        </View>
        
        <View style={styles.headerTextCol}>
          <View style={styles.metaRow}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {incident.category.toUpperCase()}
            </Text>
            <Text style={styles.idText}>• {incident.id}</Text>
          </View>
          <Text style={styles.titleText} numberOfLines={2}>{incident.title}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Telemetry Grid */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>SEVERITY</Text>
          <View style={[styles.severityBadge, { backgroundColor: `${severityColor}20` }]}>
            <Text style={[styles.severityText, { color: severityColor }]}>
              {incident.severity}
            </Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>DISTANCE</Text>
          <View style={styles.valueRow}>
            <MaterialIcons name="near-me" size={16} color={Colors.secondary} style={styles.metricIcon} />
            <Text style={styles.metricValue}>{incident.distance}</Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>REPORTED</Text>
          <View style={styles.valueRow}>
            <MaterialIcons name="access-time" size={16} color={Colors.textSecondary} style={styles.metricIcon} />
            <Text style={styles.metricValue}>{incident.timestamp}</Text>
          </View>
        </View>
      </View>

      {/* Actions Footer */}
      <View style={styles.footer}>
        <PrimaryButton
          title="Navigate to Scene"
          onPress={() => onNavigate(incident)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  topRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  pillHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  closeBtn: {
    position: "absolute",
    right: 0,
    padding: 6,
    borderRadius: 15,
    backgroundColor: `${Colors.textSecondary}15`,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerTextCol: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  idText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginLeft: 6,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 23,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  metricItem: {
    flex: 1,
    alignItems: "flex-start",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 14,
    fontWeight: "800",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricIcon: {
    marginRight: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  footer: {
    width: "100%",
  },
});
