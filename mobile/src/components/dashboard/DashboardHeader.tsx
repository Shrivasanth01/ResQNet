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
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.leftContent}>
        <View style={styles.badgeRow}>
          <View style={[styles.livePulseDot, { backgroundColor: Colors.accentEmerald }]} />
          <Text style={[styles.nodeBadge, { color: Colors.accentCyan }]}>RESQNET MESH • NODE #784 ONLINE</Text>
        </View>
        <Text style={[styles.greeting, { color: colors.text }]}>Welcome, {user?.name?.split(' ')[0] || "Operator"}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{currentDate} — Ed25519 Vault Active</Text>
      </View>

      <View style={styles.rightContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface, borderColor: Colors.borderBright }]}>
          <MaterialIcons name="shield" size={24} color={Colors.primary} />
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
    paddingVertical: 18,
    paddingHorizontal: 2,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leftContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nodeBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  greeting: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  date: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  rightContent: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
