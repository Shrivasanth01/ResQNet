import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../../theme/colors";
import TextInputField from "../../inputs/TextInputField";
import SeveritySelector, { SeverityLevel } from "../SeveritySelector";
import SectionHeader from "../../common/SectionHeader";

export interface IncidentDetailsData {
  title: string;
  description: string;
  peopleAffected: string;
  severity: SeverityLevel;
  hasPhoto: boolean;
}

interface Props {
  data: IncidentDetailsData;
  onChange: (updated: Partial<IncidentDetailsData>) => void;
}

export default function StepIncidentDetails({ data, onChange }: Props) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Incident Specifics" />

      <View style={styles.form}>
        <TextInputField
          label="Emergency Title"
          placeholder="e.g. Structure collapsed on Main St"
          value={data.title}
          onChangeText={(text) => onChange({ title: text })}
          autoCapitalize="sentences"
        />

        <TextInputField
          label="Detailed Description"
          placeholder="Describe visible danger, structural damage, or trapped individuals..."
          value={data.description}
          onChangeText={(text) => onChange({ description: text })}
          multiline
          numberOfLines={4}
          autoCapitalize="sentences"
        />

        <TextInputField
          label="Estimated People Affected"
          placeholder="e.g. 1, 5, 20+"
          value={data.peopleAffected}
          onChangeText={(text) => onChange({ peopleAffected: text })}
          keyboardType="numeric"
        />

        <SeveritySelector
          selectedSeverity={data.severity}
          onSelect={(sev) => onChange({ severity: sev })}
        />

        <View style={styles.photoSection}>
          <Text style={styles.photoLabel}>Scene Photography (Optional)</Text>
          
          <Pressable
            style={({ pressed }) => [
              styles.photoBox,
              data.hasPhoto && styles.photoBoxAttached,
              pressed && styles.pressed
            ]}
            onPress={() => onChange({ hasPhoto: !data.hasPhoto })}
          >
            {data.hasPhoto ? (
              <View style={styles.photoAttachedContent}>
                <MaterialIcons name="check-circle" size={36} color={Colors.success} />
                <View style={styles.photoTextGroup}>
                  <Text style={styles.attachedTitle}>scene_capture_01.jpg</Text>
                  <Text style={styles.attachedSubtitle}>Tap to remove photo</Text>
                </View>
                <MaterialIcons name="delete-outline" size={24} color={Colors.textSecondary} />
              </View>
            ) : (
              <View style={styles.photoPlaceholderContent}>
                <View style={styles.cameraIconBox}>
                  <MaterialIcons name="add-a-photo" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.addPhotoTitle}>Attach Scene Photo</Text>
                <Text style={styles.addPhotoSubtitle}>
                  Helps responders assess equipment needs
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    paddingBottom: 24,
  },
  photoSection: {
    marginTop: 16,
  },
  photoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 10,
  },
  photoBox: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  photoBoxAttached: {
    borderStyle: "solid",
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}10`,
    padding: 16,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  photoPlaceholderContent: {
    alignItems: "center",
  },
  cameraIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  addPhotoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  addPhotoSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  photoAttachedContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  photoTextGroup: {
    flex: 1,
    marginLeft: 14,
  },
  attachedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  attachedSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
