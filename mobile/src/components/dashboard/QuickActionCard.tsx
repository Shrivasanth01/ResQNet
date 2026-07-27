import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";

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
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        primary && styles.primaryContainer,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconWrapper, primary && styles.primaryIconWrapper]}>
        <MaterialIcons 
          name={iconName} 
          size={28} 
          color={primary ? Colors.white : Colors.primary} 
        />
      </View>
      <Text style={[styles.title, primary && styles.primaryTitle]} numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
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
    minHeight: 110,
  },
  primaryContainer: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  iconWrapper: {
    marginBottom: 12,
    backgroundColor: `${Colors.primary}10`,
    padding: 12,
    borderRadius: 12,
  },
  primaryIconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  primaryTitle: {
    color: Colors.white,
  },
});
