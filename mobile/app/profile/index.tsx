import { View, StyleSheet, SafeAreaView, ScrollView, Alert, RefreshControl, Text, Pressable, Platform } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";
import { DatabaseService } from "../../src/services/db";
import { CompleteEmergencyProfile } from "../../src/types/profile";
import { UltraLowDataEncoder } from "../../src/services/packet/UltraLowDataEncoder";

// Reusable components
import ProfileAvatar from "../../src/components/profile/ProfileAvatar";
import ProgressIndicator from "../../src/components/profile/ProgressIndicator";
import ProfileCard from "../../src/components/profile/ProfileCard";
import MedicalCard from "../../src/components/profile/MedicalCard";
import EmergencyContactCard from "../../src/components/profile/EmergencyContactCard";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [profileData, setProfileData] = useState<CompleteEmergencyProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showExporter, setShowExporter] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await DatabaseService.getEmergencyProfile();
      setProfileData(data);
    } catch (err) {
      Alert.alert("Database Notice", "Could not read local profile vault. Using emergency defaults.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleToggleConsent = async (newValue: boolean) => {
    if (profileData) {
      const updatedUser = { ...profileData.personal, consentToShareMedical: newValue };
      await DatabaseService.saveUserProfile(updatedUser);
      setProfileData({ ...profileData, personal: updatedUser });
      Alert.alert("Consent Updated", `Emergency medical sharing is now ${newValue ? "ENABLED" : "DISABLED"} for SOS mesh relaying.`);
    }
  };

  const handleSharePacket = async () => {
    if (!profileData) return;
    const { json, bytes } = UltraLowDataEncoder.toMinifiedJson(profileData);
    const fileName = `resqnet_packet_${profileData.personal.fullName.toLowerCase().replace(/\s+/g, '_')}.resq`;

    if (Platform.OS === 'web' && 'share' in navigator) {
      try {
        const file = new File([json], fileName, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'ResQNet Ultra-Low Emergency Packet',
            text: `ResQNet Offline Emergency Profile Packet (${bytes} bytes)`,
            files: [file],
          });
          return;
        } else {
          await navigator.share({
            title: 'ResQNet Ultra-Low Emergency Packet',
            text: json,
          });
          return;
        }
      } catch (e) {
        // User cancelled or fallback to download
      }
    }

    // Web download fallback
    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      alert(`Downloaded ultra-low emergency packet file: ${fileName} (${bytes} bytes). Shareable via Bluetooth / Wi-Fi Direct!`);
    } else {
      Alert.alert("Ultra-Low Mesh Packet Generated", `Payload Size: ${bytes} Bytes\nFile: ${fileName}\n\nReady for offline Bluetooth & Wi-Fi Direct mesh dispatch.`);
    }
  };

  if (!profileData) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]} />
      </SafeAreaView>
    );
  }

  const { json, bytes } = UltraLowDataEncoder.toMinifiedJson(profileData);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <MaterialIcons name="arrow-back" size={26} color={colors.text} onPress={() => router.back()} />
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="security" size={20} color={Colors.secondary} />
          <View>
            <View style={styles.row}>
              <MaterialIcons name="lock" size={16} color={Colors.secondary} />
              <View style={styles.titleGroup}>
                <View style={styles.headerTextWrap}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Emergency Medical Vault</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Offline SQLite Secure Repository</Text>
          </View>
        </View>
        <MaterialIcons name="refresh" size={24} color={Colors.primary} onPress={loadProfile} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <ProfileAvatar
          fullName={profileData.personal.fullName}
          photoUrl={profileData.personal.photographUrl}
          onEditPhoto={() => Alert.alert("Photo Placeholder", "Camera & avatar selection simulated for hackathon demo.")}
        />

        <ProgressIndicator profile={profileData} />

        {/* Ultra-Low Data Shareable Packet Card */}
        <View style={[styles.exportCard, { backgroundColor: colors.surface, borderColor: Colors.secondary }]}>
          <View style={styles.exportHeader}>
            <View style={styles.exportIconCircle}>
              <MaterialIcons name="bluetooth-searching" size={24} color={Colors.secondary} />
            </View>
            <View style={styles.exportTextGroup}>
              <Text style={[styles.exportTitle, { color: colors.text }]}>Ultra-Low Mesh File Exporter</Text>
              <Text style={[styles.exportSub, { color: colors.textSecondary }]}>
                Compress profile into tiny <Text style={{ fontWeight: "800", color: Colors.secondary }}>{bytes} Bytes</Text> file for Bluetooth & Wi-Fi Direct
              </Text>
            </View>
          </View>

          <View style={styles.exportActions}>
            <Pressable style={styles.shareBtn} onPress={handleSharePacket}>
              <MaterialIcons name="share" size={18} color={Colors.white} />
              <Text style={styles.shareBtnText}>Share via Bluetooth / Wi-Fi Direct</Text>
            </Pressable>
            <Pressable style={[styles.toggleBtn, { backgroundColor: `${colors.textSecondary}15` }]} onPress={() => setShowExporter(!showExporter)}>
              <Text style={[styles.toggleBtnText, { color: colors.text }]}>{showExporter ? "Hide Code" : "Inspect Code"}</Text>
            </Pressable>
          </View>

          {showExporter && (
            <View style={[styles.payloadBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.payloadLabel, { color: colors.textSecondary }]}>
                Minified Emergency Packet JSON ({bytes} B):
              </Text>
              <Text style={[styles.payloadText, { color: colors.text }]}>{json}</Text>
            </View>
          )}
        </View>

        <ProfileCard
          user={profileData.personal}
          onEdit={() => router.push("/profile/edit" as any)}
        />

        <MedicalCard
          medical={profileData.medical}
          consentToShare={profileData.personal.consentToShareMedical}
          organDonor={profileData.personal.organDonor}
          onEdit={() => router.push("/profile/medical" as any)}
          onToggleConsent={handleToggleConsent}
        />

        <EmergencyContactCard
          contacts={profileData.contacts}
          onEdit={() => router.push("/profile/contacts" as any)}
        />

        <View style={styles.footerAction}>
          <PrimaryButton
            title="Return to Command Center"
            onPress={() => router.replace("/(tabs)" as any)}
          />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titleGroup: {
    justifyContent: "center",
  },
  headerTextWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  exportCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    marginVertical: 10,
  },
  exportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  exportIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${Colors.secondary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exportTextGroup: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  exportSub: {
    fontSize: 12,
    marginTop: 2,
  },
  exportActions: {
    flexDirection: "row",
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareBtnText: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: 13,
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBtnText: {
    fontWeight: "700",
    fontSize: 13,
  },
  payloadBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  payloadLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  payloadText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  footerAction: {
    marginTop: 20,
    marginBottom: 40,
  },
});
