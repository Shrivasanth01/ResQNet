import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Colors } from "../../theme/colors";
import { MaterialIcons } from "@expo/vector-icons";

export default function DashboardHeader() {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      setCurrentDate(now.toLocaleDateString(undefined, options));
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <View style={styles.badgeRow}>
          <View style={styles.livePulseDot} />
          <Text style={styles.nodeBadge}>RESQNET MESH NODE #784</Text>
        </View>
        <Text style={[styles.greeting, { color: colors.text }]}>Welcome, {user?.name?.split(' ')[0] || "Operator"}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{currentDate} • Local Vault Online</Text>
      </View>

      <View style={styles.rightContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface, borderColor: isDarkMode ? `${Colors.secondary}40` : colors.border }]}>
          <MaterialIcons name="shield" size={26} color={Colors.secondary} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  leftContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.success,
  },
  nodeBadge: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.success,
    letterSpacing: 0.8,
  },
  greeting: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  rightContent: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.08)" as any,
  },
});
