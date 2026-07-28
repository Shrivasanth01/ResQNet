import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";
import { Colors } from "../../src/theme/colors";
import { getPersonDetails, getLocationHistory, PersonRecord, LocationRecord } from "../../src/storage/database";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [dbPerson, setDbPerson] = useState<PersonRecord | null>(null);
  const [dbLocations, setDbLocations] = useState<LocationRecord[]>([]);
  const [showDbInspector, setShowDbInspector] = useState<boolean>(false);

  const loadDbData = async () => {
    const person = await getPersonDetails();
    const locs = await getLocationHistory(5);
    setDbPerson(person);
    setDbLocations(locs);
  };

  useEffect(() => {
    loadDbData();
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name || "Unknown"}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || "Unknown"}</Text>
        </View>
      </View>

      {/* SQLite Database Inspector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗄️ SQLite Storage Inspector</Text>
        <View style={styles.card}>
          <Pressable 
            style={styles.refreshBtn}
            onPress={() => {
              loadDbData();
              setShowDbInspector((prev) => !prev);
            }}
          >
            <Text style={styles.refreshBtnText}>
              {showDbInspector ? "Hide SQLite Records" : "Inspect Stored SQLite Records"}
            </Text>
          </Pressable>

          {showDbInspector && (
            <View style={styles.dbDetails}>
              <Text style={styles.subHeader}>Person Record (person_details table):</Text>
              {dbPerson ? (
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>Name: {dbPerson.name}</Text>
                  <Text style={styles.codeText}>Email: {dbPerson.email}</Text>
                  <Text style={styles.codeText}>Created: {dbPerson.createdAt}</Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>No person record in DB yet (log in/register to auto-store)</Text>
              )}

              <View style={styles.divider} />

              <Text style={styles.subHeader}>
                Location Records ({dbLocations.length}) (location_history table):
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
                <Text style={styles.emptyText}>No location history in DB yet (use Report Wizard GPS step to record)</Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <PrimaryButton
          title="Log Out"
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 20,
    paddingTop: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
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
});