import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "../../src/theme/colors";
import PrimaryButton from "../../src/components/buttons/PrimaryButton";
import SectionHeader from "../../src/components/common/SectionHeader";

interface PastReport {
  id: string;
  title: string;
  category: string;
  timestamp: string;
  severity: string;
  status: "Broadcasted" | "In Progress" | "Resolved";
  iconName: keyof typeof MaterialIcons.glyphMap;
}

const MOCK_REPORTS: PastReport[] = [
  {
    id: "RQ-8849",
    title: "Localized Flash Flooding on East River Road",
    category: "Flood Hazard",
    timestamp: "Today, 10:42 AM",
    severity: "High",
    status: "Broadcasted",
    iconName: "water",
  },
  {
    id: "RQ-7120",
    title: "Fallen Transformer Power Line",
    category: "Electrical Hazard",
    timestamp: "Yesterday, 3:15 PM",
    severity: "Critical",
    status: "In Progress",
    iconName: "bolt",
  },
  {
    id: "RQ-5402",
    title: "Minor Vehicle Collision Near Shelter",
    category: "Road Accident",
    timestamp: "Oct 14, 2026",
    severity: "Low",
    status: "Resolved",
    iconName: "minor-crash",
  },
];

export default function ReportsScreen() {
  const getStatusBg = (status: PastReport["status"]) => {
    switch (status) {
      case "Broadcasted": return `${Colors.primary}15`;
      case "In Progress": return `${Colors.warning}20`;
      case "Resolved": return `${Colors.success}15`;
    }
  };

  const getStatusColor = (status: PastReport["status"]) => {
    switch (status) {
      case "Broadcasted": return Colors.primary;
      case "In Progress": return Colors.warning;
      case "Resolved": return Colors.success;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Title Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Incident Log</Text>
            <Text style={styles.pageSubtitle}>Manage emergency reports broadcasted from this device</Text>
          </View>
        </View>

        {/* Action Banner */}
        <View style={styles.actionBox}>
          <View style={styles.actionTextGroup}>
            <MaterialIcons name="add-alert" size={32} color={Colors.white} />
            <View style={styles.actionTitleBox}>
              <Text style={styles.actionTitle}>Report New Emergency</Text>
              <Text style={styles.actionDesc}>Start our 4-step guided reporting workflow</Text>
            </View>
          </View>
          <View style={styles.btnWrapper}>
            <PrimaryButton
              title="Launch Wizard"
              onPress={() => router.push("/report")}
            />
          </View>
        </View>

        <SectionHeader title="Broadcast History" />

        {/* Report List */}
        <View style={styles.list}>
          {MOCK_REPORTS.map((item) => (
            <Pressable 
              key={item.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => {
                // Future detail drill-down view
              }}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name={item.iconName} size={24} color={Colors.primary} />
                </View>
                <View style={styles.titleCol}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.idText}>{item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.metaText}>{item.category} • Severity: <Text style={{ fontWeight: "700", color: item.severity === "Critical" || item.severity === "High" ? Colors.danger : Colors.text }}>{item.severity}</Text></Text>
                <Text style={styles.timeText}>{item.timestamp}</Text>
              </View>
            </Pressable>
          ))}
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
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  actionBox: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionTextGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  actionTitleBox: {
    marginLeft: 14,
    flex: 1,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
  },
  actionDesc: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  btnWrapper: {
    width: "100%",
  },
  list: {
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  idText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});