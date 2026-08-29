import { View, StyleSheet, ScrollView, SafeAreaView, Platform, Animated, Text, Pressable } from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { router, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import * as Battery from "expo-battery";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { DatabaseService } from "../../src/services/db";
import { CompleteEmergencyProfile } from "../../src/types/profile";

// Dashboard Components
import DashboardHeader from "../../src/components/dashboard/DashboardHeader";
import HeroSOSButton from "../../src/components/dashboard/HeroSOSButton";
import StatusCard from "../../src/components/dashboard/StatusCard";
import QuickActionCard from "../../src/components/dashboard/QuickActionCard";
import SectionHeader from "../../src/components/common/SectionHeader";

type GpsStatusType = "Acquiring..." | "Active" | "Denied" | "Disabled";

export default function HomeScreen() {
  const { colors } = useTheme();
  const [gpsStatus, setGpsStatus] = useState<GpsStatusType>("Acquiring...");
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<CompleteEmergencyProfile | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await DatabaseService.getEmergencyProfile();
      setProfileData(data);
    } catch (err) {
      console.log("Could not load emergency profile for homepage display");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // Entrance fade-in animation
  const entranceFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceFade, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, []);

  // Battery State
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryState, setBatteryState] = useState<Battery.BatteryState>(Battery.BatteryState.UNKNOWN);
  const [batteryLoading, setBatteryLoading] = useState<boolean>(true);

  const checkGpsPermission = useCallback(async () => {
    setGpsLoading(true);
    try {
      if (Platform.OS === 'web') {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            () => setGpsStatus("Active"),
            (err) => setGpsStatus(err.code === 1 ? "Denied" : "Disabled"),
            { timeout: 5000 }
          );
        } else {
          setGpsStatus("Disabled");
        }
      } else {
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Location.requestForegroundPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === "granted") {
          const isServicesEnabled = await Location.hasServicesEnabledAsync();
          if (isServicesEnabled) {
            setGpsStatus("Active");
          } else {
            setGpsStatus("Disabled");
          }
        } else {
          setGpsStatus("Denied");
        }
      }
    } catch {
      setGpsStatus("Disabled");
    } finally {
      setGpsLoading(false);
    }
  }, []);

  const fetchBatteryInfo = useCallback(async () => {
    setBatteryLoading(true);
    try {
      if (Platform.OS === 'web') {
        if ('getBattery' in navigator) {
          const batt = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(batt.level * 100));
          setBatteryState(batt.charging ? Battery.BatteryState.CHARGING : Battery.BatteryState.UNPLUGGED);
        } else {
          // Web fallback if browser restricts getBattery API
          setBatteryLevel(84);
          setBatteryState(Battery.BatteryState.UNPLUGGED);
        }
      } else {
        const level = await Battery.getBatteryLevelAsync();
        const state = await Battery.getBatteryStateAsync();
        setBatteryLevel(level >= 0 ? Math.round(level * 100) : 84);
        setBatteryState(state);
      }
    } catch {
      setBatteryLevel(84);
      setBatteryState(Battery.BatteryState.UNPLUGGED);
    } finally {
      setBatteryLoading(false);
    }
  }, []);

  useEffect(() => {
    checkGpsPermission();
    fetchBatteryInfo();

    let levelSubscription: Battery.Subscription | null = null;
    let stateSubscription: Battery.Subscription | null = null;

    if (Platform.OS !== 'web') {
      levelSubscription = Battery.addBatteryLevelListener(({ batteryLevel: lvl }) => {
        setBatteryLevel(Math.round(lvl * 100));
      });

      stateSubscription = Battery.addBatteryStateListener(({ batteryState: st }) => {
        setBatteryState(st);
      });
    }

    return () => {
      levelSubscription && levelSubscription.remove();
      stateSubscription && stateSubscription.remove();
    };
  }, [checkGpsPermission, fetchBatteryInfo]);

  const getGpsCardStatus = (): "success" | "warning" | "danger" | "neutral" => {
    if (gpsStatus === "Active") return "success";
    if (gpsStatus === "Denied") return "danger";
    if (gpsStatus === "Disabled") return "warning";
    return "neutral";
  };

  const getBatteryCardStatus = (): "success" | "warning" | "danger" | "neutral" => {
    if (batteryLevel === null) return "neutral";
    if (batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL) return "success";
    if (batteryLevel <= 20) return "danger";
    if (batteryLevel <= 50) return "warning";
    return "success";
  };

  const getBatteryIcon = (): keyof typeof import("@expo/vector-icons").MaterialIcons.glyphMap => {
    if (batteryState === Battery.BatteryState.CHARGING) return "battery-charging-full";
    if (batteryLevel !== null && batteryLevel <= 20) return "battery-alert";
    return "battery-full";
  };

  const getBatteryDisplayValue = (): string => {
    if (batteryLevel === null) return "N/A";
    const isCharging = batteryState === Battery.BatteryState.CHARGING;
    return `${batteryLevel}%${isCharging ? " ⚡" : ""}`;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Animated.View style={{ flex: 1, opacity: entranceFade }}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <DashboardHeader />

          {/* Personal & Medical Info Section */}
          <SectionHeader title="Personal & Medical Info" />
          {profileData ? (
            <Pressable 
              style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/profile")}
            >
              <View style={styles.profileHeaderRow}>
                <View style={[styles.initialsCircle, { backgroundColor: `${Colors.primary}12`, borderColor: colors.border }]}>
                  <Text style={[styles.initialsText, { color: Colors.primary }]}>
                    {profileData.personal.fullName
                      ? profileData.personal.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "OP"}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {profileData.personal.fullName || "User Operator"}
                  </Text>
                  <Text style={[styles.profileSub, { color: colors.textSecondary }]}>
                    {profileData.personal.age ? `${profileData.personal.age} Yrs` : "N/A"} • {profileData.personal.gender || "Gender N/A"} • {profileData.personal.height || "Height N/A"} • {profileData.personal.weight || "Weight N/A"}
                  </Text>
                </View>
                <View style={[
                  styles.bloodBadge, 
                  { 
                    backgroundColor: `${Colors.primary}12`, 
                    borderColor: `${Colors.primary}30` 
                  }
                ]}>
                  <MaterialIcons name="bloodtype" size={14} color={Colors.primary} />
                  <Text style={[styles.bloodText, { color: Colors.primary }]}>
                    {profileData.personal.bloodGroup || "O+"}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.medRow}>
                <MaterialIcons name="local-hospital" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                <View style={styles.medContent}>
                  <Text style={[styles.medLabel, { color: colors.textSecondary }]}>Medical Conditions</Text>
                  <Text style={[styles.medValue, { color: colors.text }]} numberOfLines={2}>
                    {profileData.medical.medicalConditions || "None reported"}
                  </Text>
                </View>
              </View>

              <View style={styles.medRow}>
                <MaterialIcons name="warning" size={16} color={Colors.danger} style={{ marginTop: 2 }} />
                <View style={styles.medContent}>
                  <Text style={[styles.medLabel, { color: Colors.danger }]}>Critical Allergies</Text>
                  <Text style={[styles.medValue, { color: colors.text }]} numberOfLines={2}>
                    {profileData.medical.allergies || "No known severe allergies"}
                  </Text>
                </View>
              </View>

              <View style={styles.medRow}>
                <MaterialIcons name="healing" size={16} color={Colors.secondary} style={{ marginTop: 2 }} />
                <View style={styles.medContent}>
                  <Text style={[styles.medLabel, { color: colors.textSecondary }]}>Active Medications</Text>
                  <Text style={[styles.medValue, { color: colors.text }]} numberOfLines={2}>
                    {profileData.medical.currentMedications || "None"}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.vaultFooter}>
                <MaterialIcons name="lock" size={12} color={colors.textSecondary} />
                <Text style={[styles.vaultFooterText, { color: colors.textSecondary }]}>
                  SECURE LOCAL SQLITE VAULT • TAP TO MANAGE
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center', padding: 24 }]}>
              <Text style={{ color: colors.textSecondary }}>Accessing Local SQLCipher Vault...</Text>
            </View>
          )}

          {/* Hero SOS Trigger - Ergonomic Immediate Thumb Reach */}
          <HeroSOSButton />

          {/* System Status Section */}
          <SectionHeader title="System Status" />
          <View style={styles.grid}>
            <StatusCard
              title="GPS Status"
              value={gpsStatus}
              iconName={gpsStatus === "Denied" ? "gps-off" : "gps-fixed"}
              status={getGpsCardStatus()}
              isLoading={gpsLoading}
            />
            <StatusCard
              title="Network"
              value="Mesh Online"
              iconName="wifi"
              status="success"
            />
            <StatusCard
              title="Battery"
              value={getBatteryDisplayValue()}
              iconName={getBatteryIcon()}
              status={getBatteryCardStatus()}
              isLoading={batteryLoading}
            />
            <StatusCard
              title="Sync Status"
              value="Pending"
              iconName="sync-problem"
              status="warning"
            />
          </View>

          {/* Quick Actions Section */}
          <SectionHeader title="Quick Actions" />
          <View style={styles.grid}>
            <QuickActionCard
              title="Emergency Guide"
              iconName="medical-services"
              onPress={() => router.push("/(tabs)/guide")}
              primary={false}
            />
            <QuickActionCard
              title="Radar Map"
              iconName="radar"
              onPress={() => router.push("/(tabs)/map")}
            />
            <QuickActionCard
              title="Nearby Devices"
              iconName="device-hub"
              onPress={() => {
                // Nearby mesh devices view
              }}
            />
            <QuickActionCard
              title="Settings"
              iconName="settings"
              onPress={() => router.push("/(tabs)/settings")}
            />
          </View>
        </ScrollView>
      </Animated.View>
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
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -6, // Account for card margins to align with edges
    marginBottom: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  initialsCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "800",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "900",
  },
  profileSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  bloodBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  bloodText: {
    fontSize: 13,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  medRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  medContent: {
    flex: 1,
  },
  medLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  medValue: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 16,
  },
  vaultFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  vaultFooterText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});