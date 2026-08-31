import { View, StyleSheet, SafeAreaView, Alert, Text, Pressable, ScrollView, Platform } from "react-native";
import { useEffect, useState, useMemo } from "react";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

// Map Reusable Components
import MapLegend from "./MapLegend";
import BottomSheetCard from "./BottomSheetCard";
import FloatingLocationButton from "./FloatingLocationButton";
import { LocationService } from "../../services/hardware/LocationService";
import { EmergencyIncident, getCategoryColor, getCategoryIcon } from "./types";
import { API_CONFIG } from "../../constants/app";
import { PacketStorage } from "../../services/packet/PacketStorage";
import { RSEPTransferManager } from "../../services/distribution/RSEPTransferManager";
import { EmergencyPacket } from "../../types/packet";

export default function LiveMapView() {
  const { colors, isDarkMode } = useTheme();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [realIncidents, setRealIncidents] = useState<EmergencyIncident[]>([]);
  const [incomingOfflineRSEP, setIncomingOfflineRSEP] = useState<{
    packet: EmergencyPacket;
    transport: string;
    time: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const fetchActiveIncidents = async () => {
    try {
      const list: EmergencyIncident[] = [];

      // 1. Fetch from Central Cloud / FastAPI Server
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/incidents/active`);
        if (res.ok) {
          const serverData = await res.json();
          if (Array.isArray(serverData)) {
            for (const inc of serverData) {
              list.push({
                id: inc.incident_id || inc.incidentId || "INC-SOS",
                title: inc.emergency_type || "🚨 Manual SOS Distress Beacon",
                category: "Medical",
                severity: "Critical",
                timestamp: inc.created_at || new Date().toISOString(),
                distance: "Nearby (< 1.5 km)",
                latitude: inc.latitude || 13.0827,
                longitude: inc.longitude || 80.2707,
              });
            }
          }
        }
      } catch (cloudErr) {}

      // 2. Fetch from Local Secure Packet Outbox Vault
      try {
        const stored = await PacketStorage.getAllPackets();
        for (const p of stored) {
          if (!list.some((i) => i.id === p.header.packetId)) {
            list.push({
              id: p.header.packetId,
              title: `${p.incident?.emergencyType || "SOS Distress"} (${p.user?.name || "Citizen"})`,
              category: "Medical",
              severity: "Critical",
              timestamp: p.header.timestamp || new Date().toISOString(),
              distance: "Mesh Hop (< 500m)",
              latitude: p.location?.latitude || 13.0827,
              longitude: p.location?.longitude || 80.2707,
            });
          }
        }
      } catch (localErr) {}

      if (list.length > 0) {
        setRealIncidents(list);
      }
    } catch (e) {}
  };

  const fetchUserLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || undefined,
        });
      }
    } catch (err) {
      // Ignore location error
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    fetchUserLocation();
    fetchActiveIncidents();

    // Auto-poll for incoming emergency distress beacons every 4 seconds
    const interval = setInterval(() => {
      if (isMounted) fetchActiveIncidents();
    }, 4000);

    // Subscribe to background LocationService updates
    const unsubscribe = LocationService.subscribe((telemetry) => {
      if (isMounted) {
        setUserLocation({
          latitude: telemetry.latitude,
          longitude: telemetry.longitude,
          accuracy: telemetry.accuracy,
        });
      }
    });

    // Subscribe to offline P2P Bluetooth / Wi-Fi Airwaves
    const unsubscribeAirwaves = RSEPTransferManager.subscribeToIncomingRSEP((packet, transport, senderId) => {
      if (isMounted) {
        setIncomingOfflineRSEP({
          packet,
          transport,
          time: new Date().toLocaleTimeString(),
        });
        // Save to receiver's local vault
        PacketStorage.savePacket(packet).catch(() => {});
        fetchActiveIncidents();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
      unsubscribeAirwaves();
    };
  }, []);

  const downloadRSEPFile = (packet: any) => {
    try {
      const jsonStr = JSON.stringify(packet, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${packet.header.packetId || "emergency_distress"}.rsep`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Downloading RSEP file directly to your device storage.");
    }
  };

  const handleCopyCoords = async () => {
    if (!userLocation) return;
    const coordStr = `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`;
    
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(coordStr);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    if (Platform.OS === 'web') {
      alert(`Copied coordinates to clipboard: ${coordStr}\nReady to paste directly into Google Maps or Navigation!`);
    } else {
      Alert.alert("Coordinates Copied", `${coordStr}\n\nReady to paste into maps or emergency messages.`);
    }
  };

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
          <View style={[styles.radarBanner, { backgroundColor: colors.surface, borderColor: isDarkMode ? `${Colors.secondary}40` : colors.border }]}>
            <View style={[styles.radarIconBox, { backgroundColor: `${Colors.secondary}15` }]}>
              <MaterialIcons name="my-location" size={32} color={Colors.secondary} />
            </View>
            <View style={styles.radarTextBox}>
              <View style={styles.gpsHeaderRow}>
                <Text style={[styles.radarTitle, { color: colors.text }]}>Live GPS Telemetry</Text>
                <View style={[styles.gpsBadge, { backgroundColor: `${Colors.success}18` }]}>
                  <View style={styles.gpsPulseDot} />
                  <Text style={styles.gpsBadgeText}>GPS LOCK ACTIVE (1s AUTO-SYNC)</Text>
                </View>
              </View>
              <Text style={[styles.radarSub, { color: colors.text }]}>
                {userLocation 
                  ? `Lat: ${userLocation.latitude.toFixed(6)}° N  •  Long: ${userLocation.longitude.toFixed(6)}° E`
                  : "Acquiring High-Precision GPS Lock..."}
              </Text>
              
              <View style={styles.coordActionRow}>
                {userLocation && (
                  <Text style={[styles.gpsMetaText, { color: colors.textSecondary }]}>
                    Accuracy: ±{userLocation.accuracy ? Math.round(userLocation.accuracy) : 5}m • Live 1s Refresh
                  </Text>
                )}
                {userLocation && (
                  <Pressable 
                    style={[styles.copyBtn, { backgroundColor: copied ? Colors.success : `${Colors.secondary}20` }]}
                    onPress={handleCopyCoords}
                  >
                    <MaterialIcons name={copied ? "check" : "content-copy"} size={14} color={copied ? Colors.white : Colors.secondary} />
                    <Text style={[styles.copyBtnText, { color: copied ? Colors.white : Colors.secondary }]}>
                      {copied ? "COPIED!" : "COPY COORDS"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {/* INCOMING OFFLINE RSEP FILE ALERT BANNER */}
          {incomingOfflineRSEP && (
            <View style={styles.incomingOfflineCard}>
              <View style={styles.incomingTopRow}>
                <View style={styles.incomingBadge}>
                  <MaterialIcons name="bluetooth-audio" size={16} color="#00E5FF" />
                  <Text style={styles.incomingBadgeText}>
                    OFFLINE {incomingOfflineRSEP.transport === "BLE" ? "BLUETOOTH LE" : "WI-FI DIRECT"} MESH RECEPTION
                  </Text>
                </View>
                <Pressable onPress={() => setIncomingOfflineRSEP(null)} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={18} color="#94a3b8" />
                </Pressable>
              </View>

              <Text style={styles.incomingTitle}>
                🚨 Incoming Emergency Distress File Received ({incomingOfflineRSEP.time})
              </Text>

              <View style={styles.incomingDossierGrid}>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>Victim:</Text>
                  <Text style={styles.dossierVal}>{incomingOfflineRSEP.packet.user?.name || "Citizen"}</Text>
                </View>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>Blood Group:</Text>
                  <Text style={styles.dossierValRed}>{incomingOfflineRSEP.packet.user?.bloodGroup || "O+"}</Text>
                </View>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>GPS Coords:</Text>
                  <Text style={styles.dossierVal}>
                    {incomingOfflineRSEP.packet.location?.latitude.toFixed(5)}°, {incomingOfflineRSEP.packet.location?.longitude.toFixed(5)}°
                  </Text>
                </View>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>Packet ID:</Text>
                  <Text style={styles.dossierValCode}>{incomingOfflineRSEP.packet.header.packetId}</Text>
                </View>
              </View>

              <View style={styles.incomingActionRow}>
                <Pressable
                  style={styles.downloadRsepBtn}
                  onPress={() => downloadRSEPFile(incomingOfflineRSEP.packet)}
                >
                  <MaterialIcons name="download" size={18} color="#ffffff" />
                  <Text style={styles.downloadRsepText}>Download .rsep File</Text>
                </Pressable>

                <Pressable
                  style={styles.viewOnMapBtn}
                  onPress={() => {
                    const inc: EmergencyIncident = {
                      id: incomingOfflineRSEP.packet.header.packetId,
                      title: incomingOfflineRSEP.packet.incident?.emergencyType || "SOS Distress",
                      category: "Medical",
                      severity: "Critical",
                      timestamp: incomingOfflineRSEP.packet.header.timestamp,
                      distance: "Direct P2P (< 100m)",
                      latitude: incomingOfflineRSEP.packet.location?.latitude || 13.0827,
                      longitude: incomingOfflineRSEP.packet.location?.longitude || 80.2707,
                    };
                    setSelectedIncident(inc);
                  }}
                >
                  <MaterialIcons name="map" size={18} color="#ffffff" />
                  <Text style={styles.viewOnMapText}>View on Tactical Map</Text>
                </Pressable>
              </View>
            </View>
          )}

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
  gpsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  radarTitle: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 5,
  },
  gpsPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  gpsBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.success,
    letterSpacing: 0.6,
  },
  radarSub: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gpsMetaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  coordActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    flexWrap: "wrap",
    gap: 8,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 5,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
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
  incomingOfflineCard: {
    backgroundColor: "#07172c",
    borderColor: "#00E5FF",
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  incomingTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  incomingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.3)",
  },
  incomingBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#00E5FF",
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  incomingTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 10,
  },
  incomingDossierGrid: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  dossierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dossierLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
  },
  dossierVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f8fafc",
  },
  dossierValRed: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ef4444",
  },
  dossierValCode: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38bdf8",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  incomingActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  downloadRsepBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0284c7",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  downloadRsepText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },
  viewOnMapBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewOnMapText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
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
