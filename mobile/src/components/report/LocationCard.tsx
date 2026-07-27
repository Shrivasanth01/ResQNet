import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";

export interface LocationTelemetry {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
}

interface Props {
  location: LocationTelemetry | null;
  isLoading: boolean;
  onRefresh: () => void;
  error?: string | null;
}

export default function LocationCard({ location, isLoading, onRefresh, error }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="my-location" size={24} color={Colors.primary} />
          <Text style={styles.title}>GPS Coordinates</Text>
        </View>
        
        <Pressable
          style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}
          onPress={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialIcons name="refresh" size={22} color={Colors.primary} />
          )}
        </Pressable>
      </View>

      <View style={styles.divider} />

      {error ? (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={20} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : location ? (
        <View style={styles.telemetryGrid}>
          <View style={styles.col}>
            <Text style={styles.label}>LATITUDE</Text>
            <Text style={styles.val}>{location.latitude.toFixed(6)}°</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>LONGITUDE</Text>
            <Text style={styles.val}>{location.longitude.toFixed(6)}°</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>ACCURACY</Text>
            <Text style={styles.val}>
              {location.accuracy ? `±${location.accuracy.toFixed(1)}m` : "High"}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>CAPTURED AT</Text>
            <Text style={styles.val}>{location.timestamp}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Acquiring satellite lock...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginVertical: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginLeft: 10,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}10`,
  },
  refreshBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  telemetryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  col: {
    width: "48%",
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  val: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: `${Colors.danger}15`,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});
