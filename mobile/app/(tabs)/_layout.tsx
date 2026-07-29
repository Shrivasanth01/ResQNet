import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";

export default function TabLayout() {
  const { colors, isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
          boxShadow: isDarkMode ? "0px -4px 20px rgba(0,0,0,0.5)" : "0px -4px 16px rgba(0,0,0,0.06)",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Command",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="grid-view"
              size={size + 2}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: "Radar Map",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="radar"
              size={size + 2}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Incident Log",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="assignment-turned-in"
              size={size + 2}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="guide"
        options={{
          title: "Survival Manual",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="menu-book"
              size={size + 2}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings & DB",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="admin-panel-settings"
              size={size + 2}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}