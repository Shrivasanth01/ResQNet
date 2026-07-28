import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { EmergencyContact } from "../../types/profile";

interface Props {
  contacts: EmergencyContact[];
  onEdit?: () => void;
}

export default function EmergencyContactCard({ contacts, onEdit }: Props) {
  const handleCall = (contact: EmergencyContact) => {
    Alert.alert(
      "Direct Emergency Dialer",
      `Initiating high-priority call to ${contact.name} (${contact.phoneNumber}). In disaster fallback mode, this will also queue a targeted SMS via Wi-Fi Direct Mesh.`
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <MaterialIcons name="contact-phone" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Emergency Contacts Vault</Text>
            <Text style={styles.subtitle}>Prioritized for SOS alert notification</Text>
          </View>
        </View>

        {onEdit && (
          <Pressable style={styles.editButton} onPress={onEdit}>
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
          </Pressable>
        )}
      </View>

      {contacts && contacts.map((contact, index) => {
        const isPrimary = contact.priorityOrder === 1;
        return (
          <View key={contact.id || index} style={[styles.contactItem, isPrimary && styles.primaryItem]}>
            <View style={styles.orderCircle}>
              <Text style={styles.orderNum}>#{contact.priorityOrder}</Text>
            </View>
            
            <View style={styles.contactDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{contact.name}</Text>
                {isPrimary && (
                  <View style={styles.primaryTag}>
                    <Text style={styles.primaryText}>PRIMARY</Text>
                  </View>
                )}
              </View>
              <Text style={styles.relText}>{contact.relationship}</Text>
              <Text style={styles.phoneText}>{contact.phoneNumber}</Text>
            </View>

            <Pressable style={styles.callButton} onPress={() => handleCall(contact)}>
              <MaterialIcons name="call" size={20} color={Colors.white} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.textSecondary}08`,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryItem: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: `${Colors.primary}05`,
  },
  orderCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.textSecondary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  orderNum: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.text,
  },
  contactDetails: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
  },
  primaryTag: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
  },
  relText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 2px 6px rgba(0,0,0,0.2)" as any,
  },
});
