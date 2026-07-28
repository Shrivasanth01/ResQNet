import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, RefreshControl } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";
import { Colors } from "../../src/theme/colors";
import { DatabaseService } from "../../src/services/db";
import { CompleteEmergencyProfile } from "../../src/types/profile";

// Reusable components
import ProfileCard from "../../src/components/profile/ProfileCard";
import ProgressIndicator from "../../src/components/profile/ProgressIndicator";

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<CompleteEmergencyProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await DatabaseService.getEmergencyProfile();
      setProfile(res);
    } catch (err) {
      // Default will render if offline
    }
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
});