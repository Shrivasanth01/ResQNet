import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, RefreshControl, Platform } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";
import { Colors } from "../../src/theme/colors";
import { getPersonDetails, getLocationHistory, savePersonDetails, saveLocationRecord, PersonRecord, LocationRecord } from "../../src/storage/database";
import { DatabaseService } from "../../src/services/db";
import { CompleteEmergencyProfile } from "../../src/types/profile";

// Reusable components
import ProfileCard from "../../src/components/profile/ProfileCard";
import ProgressIndicator from "../../src/components/profile/ProgressIndicator";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<CompleteEmergencyProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // SQLite Inspector state
  const [dbPerson, setDbPerson] = useState<PersonRecord | null>(null);
  const [dbLocations, setDbLocations] = useState<LocationRecord[]>([]);
  const [showDbInspector, setShowDbInspector] = useState<boolean>(false);

  const loadDbInspectorData = async () => {
    let person = await getPersonDetails();
    if (!person && user) {
      const newPerson = { name: user.name, email: user.email, createdAt: user.createdAt || new Date().toISOString() };
      await savePersonDetails(newPerson);
      person = newPerson;
    }
    const locs = await getLocationHistory(5);
    setDbPerson(person);
    setDbLocations(locs);
  };

  const handleAddSampleLocation = async () => {
    try {
      let lat = 12.9716;
      let lng = 77.5946;
      if (Platform.OS === 'web' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        });
      }
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      await saveLocationRecord({ latitude: lat, longitude: lng, accuracy: 5.0, timestamp: timeStr });
      await loadDbInspectorData();
    } catch {
      // Fallback
    }
  };

  const loadData = async () => {
    try {
      const res = await DatabaseService.getEmergencyProfile();
      setProfile(res);
    } catch (err) {
      // Default will render if offline
    }
    await loadDbInspectorData();
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <View style={styles.headerTitleGroup}>
          <MaterialIcons name="admin-panel-settings" size={26} color={Colors.primary} />
          <View>
            <Text style={styles.mainTitle}>Profile & App Settings</Text>
            <Text style={styles.subTitle}>Local Data Foundation & Medical Vault</Text>
          </View>
        </View>
        <Pressable onPress={loadData} style={styles.refreshIcon}>
          <MaterialIcons name="refresh" size={24} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <ProgressIndicator profile={profile} />

        {profile && (
          <ProfileCard
            user={profile.personal}
            onEdit={() => router.push("/profile/edit" as any)}
          />
        )}

        <Text style={styles.sectionTitle}>Emergency Medical Vault & Management</Text>
        <View style={styles.menuBox}>
          <Pressable style={styles.menuRow} onPress={() => router.push("/profile" as any)}>
            <View style={[styles.menuIcon, { backgroundColor: `${Colors.secondary}20` }]}>
              <MaterialIcons name="verified-user" size={22} color={Colors.secondary} />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuTitle}>Master Medical Vault</Text>
              <Text style={styles.menuSub}>View complete encrypted emergency profile</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.menuRow} onPress={() => router.push("/profile/edit" as any)}>
            <View style={[styles.menuIcon, { backgroundColor: `${Colors.primary}15` }]}>
              <MaterialIcons name="person" size={22} color={Colors.primary} />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuTitle}>Personal & Responder Skills</Text>
              <Text style={styles.menuSub}>Name, blood group, DOB, medical competencies</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.menuRow} onPress={() => router.push("/profile/medical" as any)}>
            <View style={[styles.menuIcon, { backgroundColor: `${Colors.danger}15` }]}>
              <MaterialIcons name="medical-services" size={22} color={Colors.danger} />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuTitle}>Clinical History & Allergies</Text>
              <Text style={styles.menuSub}>Conditions, medications, data broadcast consent</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.menuRow} onPress={() => router.push("/profile/contacts" as any)}>
            <View style={[styles.menuIcon, { backgroundColor: `${Colors.warning}20` }]}>
              <MaterialIcons name="contact-phone" size={22} color={Colors.warning} />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuTitle}>Emergency Contacts Vault</Text>
              <Text style={styles.menuSub}>Manage Priority #1 to #3 notification list</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* SQLite Storage Inspector */}
        <Text style={styles.sectionTitle}>🗄️ SQLite Storage Inspector</Text>
        <View style={styles.menuBox}>
          <View style={{ padding: 16 }}>
            <Pressable 
              style={styles.refreshBtn}
              onPress={() => {
                loadDbInspectorData();
                setShowDbInspector((prev) => !prev);
              }}
            >
              <Text style={styles.refreshBtnText}>
                {showDbInspector ? "Hide SQLite Records" : "Inspect Stored SQLite Records"}
              </Text>
            </Pressable>

            {showDbInspector && (
              <View style={styles.dbDetails}>
                <Text style={styles.subHeader}>Person Record (person_details SQLite table):</Text>
                {profile?.personal ? (
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>Name: {profile.personal.fullName} ({profile.personal.bloodGroup})</Text>
                    <Text style={styles.codeText}>Email: {profile.personal.email}</Text>
                    <Text style={styles.codeText}>Phone: {profile.personal.phoneNumber}</Text>
                    <Text style={styles.codeText}>Details: {profile.personal.age} yrs • {profile.personal.height} • {profile.personal.weight}</Text>
                    <Text style={styles.codeText}>Skills: {profile.personal.responderSkills?.join(', ')}</Text>
                    <Text style={styles.codeText}>Sync Hash: {profile.personal.syncHash}</Text>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No person record in DB yet</Text>
                )}

                <View style={styles.divider} />

                <Text style={styles.subHeader}>
                  Location Records ({dbLocations.length}) (location_history SQLite table):
                </Text>
                {dbLocations.length > 0 ? (
                  dbLocations.map((loc, i) => (
                    <View key={i} style={styles.codeBox}>
                      <Text style={styles.codeText}>
                        #{i + 1} Lat: {loc.latitude.toFixed(4)}°, Lng: {loc.longitude.toFixed(4)}°
                      </Text>
                      <Text style={styles.codeText}>Time: {loc.timestamp}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No location history in DB yet</Text>
                )}

                <Pressable 
                  style={styles.addLocBtn}
                  onPress={handleAddSampleLocation}
                >
                  <Text style={styles.addLocBtnText}>+ Record Current Location into SQLite DB</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Application Intelligence Architecture</Text>
        <View style={styles.menuBox}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <MaterialIcons name="memory" size={20} color={Colors.secondary} />
              <View>
                <Text style={styles.statusTitle}>Local SQLite Outbox Storage</Text>
                <Text style={styles.statusSub}>ACID relational tables ready for FastAPI sync</Text>
              </View>
            </View>
            <View style={styles.badgeGreen}>
              <Text style={styles.badgeGreenText}>ONLINE</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <MaterialIcons name="bluetooth" size={20} color={Colors.primary} />
              <View>
                <Text style={styles.statusTitle}>P2P Mesh Broadcast Mode</Text>
                <Text style={styles.statusSub}>BLE GATT & Wi-Fi Direct peer relaying</Text>
              </View>
            </View>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeBlueText}>READY</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <MaterialIcons name="sensors" size={20} color={Colors.warning} />
              <View>
                <Text style={styles.statusTitle}>Multi-Sensor ECS Trigger</Text>
                <Text style={styles.statusSub}>Auto distress broadcast when confidence &ge; 85%</Text>
              </View>
            </View>
            <View style={styles.badgeAmber}>
              <Text style={styles.badgeAmberText}>ACTIVE</Text>
            </View>
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <PrimaryButton title="Log Out of Command Session" onPress={handleLogout} />
          <Text style={styles.versionText}>ResQNet Platform v1.0.0-PROD • Phase 1 Vault Active</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },
  subTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  refreshIcon: {
    padding: 6,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  menuBox: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuTextGroup: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  menuSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 18,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  statusSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeGreen: {
    backgroundColor: `${Colors.secondary}20`,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.secondary}40`,
  },
  badgeGreenText: {
    color: Colors.secondary,
    fontSize: 11,
    fontWeight: "800",
  },
  badgeBlue: {
    backgroundColor: `${Colors.primary}20`,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  badgeBlueText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  badgeAmber: {
    backgroundColor: `${Colors.warning}20`,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.warning}40`,
  },
  badgeAmberText: {
    color: Colors.warning,
    fontSize: 11,
    fontWeight: "800",
  },
  logoutContainer: {
    marginTop: 28,
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 16,
    fontWeight: "600",
  },
  refreshBtn: {
    backgroundColor: `${Colors.primary}15`,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  refreshBtnText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  dbDetails: {
    marginTop: 16,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 8,
  },
  addLocBtn: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  addLocBtnText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
});