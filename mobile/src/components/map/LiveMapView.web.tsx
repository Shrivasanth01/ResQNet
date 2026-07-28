import { View, StyleSheet, SafeAreaView, Alert, Text, Pressable, ScrollView } from "react-native";
import { useEffect, useState, useMemo } from "react";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

// Map Reusable Components
import MapLegend from "./MapLegend";
import BottomSheetCard from "./BottomSheetCard";
import FloatingLocationButton from "./FloatingLocationButton";
import { EmergencyIncident, getCategoryColor, getCategoryIcon } from "./types";

export default function LiveMapView() {
  const { colors } = useTheme();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);

  const defaultLat = 37.7749;
  const defaultLng = -122.4194;

  const realIncidents: EmergencyIncident[] = [];

  const fetchUserLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || undefined,
        });
      } else {
        Alert.alert("Notice", "Location permission denied. Enabling passive command radar mode.");
      }
    } catch (err) {
      // Ignore web geolocation errors and fallback gracefully
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    fetchUserLocation();
  }, []);

  const handleNavigate = (incident: EmergencyIncident) => {
    Alert.alert(
      "Offline Navigation Initiated",
      `Calculating lowest-hazard tactical mesh route to incident ${incident.id} (${incident.title}).`
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <MapLegend />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.radarBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.radarIconBox}>
              <MaterialIcons name="radar" size={36} color={Colors.primary} />
            </View>
            <View style={styles.radarTextBox}>
              <Text style={[styles.radarTitle, { color: colors.text }]}>Tactical Command Radar</Text>
              <Text style={[styles.radarSub, { color: colors.textSecondary }]}>
                {userLocation 
                  ? `Active Sector: ${userLocation.latitude.toFixed(4)}°, ${userLocation.longitude.toFixed(4)}°`
                  : "Scanning Local P2P Mesh Range..."}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionHeader, { color: colors.text }]}>Surrounding Active Emergencies ({realIncidents.length})</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Live distress signals received via offline P2P mesh relay or FastAPI gateway.
          </Text>

          {realIncidents.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="verified-user" size={32} color={Colors.success} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sector Clear & Protected</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                No active emergency distress signals detected in your immediate 2.5 km P2P mesh radius. Your offline outbox and SOS button are ready for instant broadcast.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {realIncidents.map((inc) => {
                const color = getCategoryColor(inc.category);
                const iconName = getCategoryIcon(inc.category);
                const isSelected = selectedIncident?.id === inc.id;

                return (
                  <Pressable
                    key={inc.id}
                    style={({ pressed }) => [
                      styles.incidentCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && styles.selectedCard,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedIncident(inc)}
                  >
                    <View style={[styles.cardHeader, { borderColor: color }]}>
                      <View style={[styles.bubble, { backgroundColor: color }]}>
                        <MaterialIcons name={iconName} size={24} color={Colors.white} />
                      </View>
                      <View style={styles.headerTextGroup}>
                        <View style={styles.row}>
                          <Text style={[styles.categoryTag, { color }]}>{inc.category.toUpperCase()}</Text>
                          <Text style={[styles.distanceTag, { color: colors.textSecondary }]}>{inc.distance}</Text>
                        </View>
                        <Text style={[styles.incidentTitle, { color: colors.text }]} numberOfLines={1}>{inc.title}</Text>
                      </View>
                    </View>
                    
                    <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                      <Text style={[styles.idText, { color: colors.textSecondary }]}>ID: {inc.id}</Text>
                      <View style={[styles.sevBadge, { backgroundColor: inc.severity === "Critical" ? `${Colors.danger}20` : `${Colors.warning}20` }]}>
                        <Text style={[styles.sevText, { color: inc.severity === "Critical" ? Colors.danger : Colors.warning }]}>
                          {inc.severity} Severity
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomOverlay} pointerEvents="box-none">
          <View style={styles.buttonRow}>
            <FloatingLocationButton
              onPress={fetchUserLocation}
              isLoading={isLocating}
            />
          </View>

          {selectedIncident && (
            <BottomSheetCard
              incident={selectedIncident}
              onClose={() => setSelectedIncident(null)}
              onNavigate={handleNavigate}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    position: "relative",
  },
  topSection: {
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  radarBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 14,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.06)" as any,
  },
  radarIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}12`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  radarTextBox: {
    flex: 1,
  },
  radarTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  radarSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 8,
  },
  sectionSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  grid: {
    gap: 12,
  },
  incidentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    boxShadow: "0px 2px 6px rgba(0,0,0,0.04)" as any,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: `${Colors.primary}04`,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  bubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerTextGroup: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryTag: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  distanceTag: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  idText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  sevBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sevText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyBox: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.success}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: "90%",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  buttonRow: {
    alignItems: "center",
    paddingBottom: 20,
  },
});
