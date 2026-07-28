import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Platform } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../src/theme/colors";
import { DatabaseService } from "../../src/services/db";
import { EmergencyContact } from "../../src/types/profile";
import { validateEmergencyContacts } from "../../src/utils/validation";

import EditableField from "../../src/components/profile/EditableField";
import SectionHeader from "../../src/components/profile/SectionHeader";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    DatabaseService.getEmergencyProfile().then((res) => {
      if (res.contacts && res.contacts.length > 0) {
        setContacts(res.contacts);
      } else {
        setContacts([
          { id: "c1", name: "", relationship: "Spouse / Partner", phoneNumber: "", priorityOrder: 1 },
          { id: "c2", name: "", relationship: "Relative / Close Friend", phoneNumber: "", priorityOrder: 2 },
          { id: "c3", name: "", relationship: "Physician / Health Care", phoneNumber: "", priorityOrder: 3 },
        ]);
      }
    });
  }, []);

  const updateContact = (index: number, field: keyof EmergencyContact, val: string) => {
    const copy = [...contacts];
    copy[index] = { ...copy[index], [field]: val };
    setContacts(copy);
  };

  const handleSave = async () => {
    const validContacts = contacts.filter((c) => c.name.trim() || c.phoneNumber.trim());
    const val = validateEmergencyContacts(validContacts);
    
    if (!val.isValid) {
      if (Platform.OS === 'web') {
        alert(val.error || "Please complete at least one valid emergency contact.");
      } else {
        Alert.alert("Validation Notice", val.error || "Please complete at least one valid emergency contact.");
      }
      return;
    }

    setIsSaving(true);
    try {
      await DatabaseService.saveEmergencyContacts(validContacts);
      if (Platform.OS === 'web') {
        alert("Emergency contact hierarchy updated in SQLite outbox queue.");
        router.back();
      } else {
        Alert.alert("Contacts Updated", "Emergency contact hierarchy updated in SQLite outbox queue.", [
          { text: "OK", onPress: () => router.back() }
        ]);
        setTimeout(() => router.back(), 500);
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        alert("Could not save contacts to SQLite.");
      } else {
        Alert.alert("Error", "Could not save contacts to SQLite.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <MaterialIcons name="arrow-back" size={26} color={Colors.text} onPress={() => router.back()} />
        <Text style={styles.topTitle}>Edit Emergency Contacts</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBanner}>
          <MaterialIcons name="contact-emergency" size={28} color={Colors.primary} />
          <View style={styles.infoBannerText}>
            <Text style={styles.infoTitle}>Priority SOS Routing Architecture</Text>
            <Text style={styles.infoSub}>
              Contact #1 serves as your primary notification recipient during offline mesh relays and automatic fall detection events.
            </Text>
          </View>
        </View>

        {contacts.map((c, index) => {
          const isPrimary = c.priorityOrder === 1;
          return (
            <View key={c.id || index} style={[styles.contactBox, isPrimary && styles.primaryBox]}>
              <View style={styles.boxHeader}>
                <View style={styles.orderCircle}>
                  <Text style={styles.orderText}>#{c.priorityOrder}</Text>
                </View>
                <Text style={styles.boxTitle}>
                  {isPrimary ? "Primary Emergency Contact *" : `Secondary Contact #${c.priorityOrder} (Optional)`}
                </Text>
              </View>

              <EditableField
                label="Full Name"
                required={isPrimary}
                value={c.name}
                onChangeText={(val) => updateContact(index, "name", val)}
                placeholder="e.g., Dr. Elena Mercer / Marcus Vance"
              />

              <EditableField
                label="Relationship"
                required={isPrimary}
                value={c.relationship}
                onChangeText={(val) => updateContact(index, "relationship", val)}
                placeholder="e.g., Spouse, Brother, Primary Healthcare Provider"
              />

              <EditableField
                label="Phone Number (With Country Code)"
                required={isPrimary}
                value={c.phoneNumber}
                onChangeText={(val) => updateContact(index, "phoneNumber", val)}
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                helperText={isPrimary ? "Must be reachable via standard SMS or voice" : undefined}
              />
            </View>
          );
        })}

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Save Contacts Hierarchy"
            onPress={handleSave}
            isLoading={isSaving}
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
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.primary}12`,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    marginVertical: 14,
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 14,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
  },
  infoSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  contactBox: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  primaryBox: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: `${Colors.primary}04`,
  },
  boxHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  orderCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  orderText: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.white,
  },
  boxTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
});
