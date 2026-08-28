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
  const { colors } = useTheme();

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        !primary && { backgroundColor: colors.surface, borderColor: colors.border },
        primary && styles.primaryContainer,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconWrapper, primary ? styles.primaryIconWrapper : { backgroundColor: `${Colors.primary}10` }]}>
        <MaterialIcons 
          name={iconName} 
          size={22} 
          color={primary ? Colors.white : Colors.primary} 
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
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flex: 1,
    minWidth: "45%",
    margin: 5,
    minHeight: 104,
  },
  primaryContainer: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.94,
  },
  iconWrapper: {
    marginBottom: 10,
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryIconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 12.5,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  primaryTitle: {
    color: Colors.white,
  },
});
