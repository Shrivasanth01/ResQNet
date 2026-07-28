import { View, StyleSheet, SafeAreaView, ScrollView, Alert, RefreshControl } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../src/theme/colors";
import { DatabaseService } from "../../src/services/db";
import { CompleteEmergencyProfile } from "../../src/types/profile";

// Reusable components
import ProfileAvatar from "../../src/components/profile/ProfileAvatar";
import ProgressIndicator from "../../src/components/profile/ProgressIndicator";
import ProfileCard from "../../src/components/profile/ProfileCard";
import MedicalCard from "../../src/components/profile/MedicalCard";
import EmergencyContactCard from "../../src/components/profile/EmergencyContactCard";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<CompleteEmergencyProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await DatabaseService.getEmergencyProfile();
      setProfileData(data);
    } catch (err) {
      Alert.alert("Database Notice", "Could not read local profile vault. Using emergency defaults.");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

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

  if (!profileData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <MaterialIcons name="arrow-back" size={26} color={Colors.text} onPress={() => router.back()} />
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="security" size={20} color={Colors.secondary} />
          <View>
            <View style={styles.row}>
              <MaterialIcons name="lock" size={16} color={Colors.secondary} />
              <View style={styles.titleGroup}>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.headerTitle}>Emergency Medical Vault</Text>
                </View>
              </View>
            </View>
            <Text style={styles.headerSub}>Offline SQLite Secure Repository</Text>
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
  footerAction: {
    marginTop: 20,
    marginBottom: 40,
  },
});
