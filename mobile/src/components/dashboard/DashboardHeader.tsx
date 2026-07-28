import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Colors } from "../../theme/colors";
import { MaterialIcons } from "@expo/vector-icons";

export default function DashboardHeader() {
  const { user } = useAuth();
  const { colors } = useTheme();
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
    const interval = setInterval(updateDate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <Text style={[styles.greeting, { color: colors.text }]}>Ready, {user?.name?.split(' ')[0] || "User"}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{currentDate}</Text>
      </View>
      <View style={styles.rightContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="security" size={28} color={Colors.primary} />
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
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  leftContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  rightContent: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  iconContainer: {
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
