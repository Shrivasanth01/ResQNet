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
  const { colors } = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case "success": return Colors.success;
      case "warning": return Colors.warning;
      case "danger": return Colors.danger;
      default: return Colors.primary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor()}15` }]}>
        <MaterialIcons name={iconName} size={24} color={getStatusColor()} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>{title}</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={getStatusColor()} style={styles.loader} />
        ) : (
          <Text style={[styles.value, { color: getStatusColor() }]} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    minWidth: "45%",
    margin: 6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: "bold",
  },
  loader: {
    alignSelf: "flex-start",
  }
});
