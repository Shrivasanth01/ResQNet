import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";
import { Colors } from "../../src/theme/colors";

export default function SettingsScreen() {
  const { user, logout } = useAuth();

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
});