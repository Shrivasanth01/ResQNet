import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  title: string;
  value: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  status?: "success" | "warning" | "danger" | "neutral";
  isLoading?: boolean;
}

export default function StatusCard({ 
  title, 
  value, 
  iconName, 
  status = "neutral",
  isLoading = false 
}: Props) {
  const { colors, isDarkMode } = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case "success": return Colors.success;
      case "warning": return Colors.warning;
      case "danger": return Colors.danger;
      default: return Colors.secondary;
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={[
      styles.container, 
      { backgroundColor: colors.surface, borderColor: isDarkMode ? `${statusColor}30` : colors.border }
    ]}>
      <View style={[styles.iconContainer, { backgroundColor: `${statusColor}18` }]}>
        <MaterialIcons name={iconName} size={24} color={statusColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>{title}</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={statusColor} style={styles.loader} />
        ) : (
          <View style={styles.valRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
              {value}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    flex: 1,
    minWidth: "45%",
    margin: 5,
    boxShadow: "0px 4px 14px rgba(0,0,0,0.06)" as any,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  valRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  value: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  loader: {
    alignSelf: "flex-start",
  }
});
