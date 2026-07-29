import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  title: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  primary?: boolean;
}

export default function QuickActionCard({ 
  title, 
  iconName, 
  onPress, 
  primary = false 
}: Props) {
  const { colors, isDarkMode } = useTheme();

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        !primary && { backgroundColor: colors.surface, borderColor: isDarkMode ? `${Colors.secondary}25` : colors.border },
        primary && styles.primaryContainer,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconWrapper, primary ? styles.primaryIconWrapper : { backgroundColor: `${Colors.secondary}15` }]}>
        <MaterialIcons 
          name={iconName} 
          size={26} 
          color={primary ? Colors.white : Colors.secondary} 
        />
      </View>
      <Text style={[styles.title, !primary && { color: colors.text }, primary && styles.primaryTitle]} numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    flex: 1,
    minWidth: "45%",
    margin: 5,
    minHeight: 112,
    boxShadow: "0px 4px 14px rgba(0,0,0,0.06)" as any,
  },
  primaryContainer: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  iconWrapper: {
    marginBottom: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryIconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.1,
  },
  primaryTitle: {
    color: Colors.white,
  },
});
