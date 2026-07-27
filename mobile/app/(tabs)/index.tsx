import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { Colors } from "../../src/theme/colors";

// Dashboard Components
import DashboardHeader from "../../src/components/dashboard/DashboardHeader";
import HeroSOSButton from "../../src/components/dashboard/HeroSOSButton";
import StatusCard from "../../src/components/dashboard/StatusCard";
import QuickActionCard from "../../src/components/dashboard/QuickActionCard";
import ActivityTimeline, { ActivityEvent } from "../../src/components/dashboard/ActivityTimeline";
import SectionHeader from "../../src/components/common/SectionHeader";

const MOCK_ACTIVITIES: ActivityEvent[] = [
  {
    id: "1",
    title: "GPS location broadcasted to mesh",
    timestamp: "2 mins ago",
    iconName: "my-location",
    isRecent: true,
  },
  {
    id: "2",
    title: "Emergency guide updated offline",
    timestamp: "1 hour ago",
    iconName: "menu-book",
  },
  {
    id: "3",
    title: "SOS practice alert cancelled",
    timestamp: "Yesterday, 4:15 PM",
    iconName: "notifications-off",
  },
  {
    id: "4",
    title: "Background synchronization completed",
    timestamp: "Yesterday, 2:00 PM",
    iconName: "sync",
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader />
        
        <HeroSOSButton />

        {/* System Status Section */}
        <SectionHeader title="System Status" />
        <View style={styles.grid}>
          <StatusCard
            title="GPS Status"
            value="Active"
            iconName="gps-fixed"
            status="success"
          />
          <StatusCard
            title="Network"
            value="Mesh Online"
            iconName="wifi"
            status="success"
          />
          <StatusCard
            title="Battery"
            value="84%"
            iconName="battery-charging-full"
            status="success"
          />
          <StatusCard
            title="Sync Status"
            value="Pending"
            iconName="sync-problem"
            status="warning"
          />
        </View>

        {/* Quick Actions Section */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.grid}>
          <QuickActionCard
            title="Emergency Guide"
            iconName="medical-services"
            onPress={() => router.push("/(tabs)/guide")}
            primary={false}
          />
          <QuickActionCard
            title="My Reports"
            iconName="description"
            onPress={() => router.push("/(tabs)/reports")}
          />
          <QuickActionCard
            title="Nearby Devices"
            iconName="device-hub"
            onPress={() => {
              // Can integrate nearby mesh devices view later
            }}
          />
          <QuickActionCard
            title="Settings"
            iconName="settings"
            onPress={() => router.push("/(tabs)/settings")}
          />
        </View>

        {/* Recent Activity Section */}
        <SectionHeader title="Recent Activity" />
        <ActivityTimeline events={MOCK_ACTIVITIES} />
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
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -6, // Account for card margins to align with edges
    marginBottom: 16,
  },
});