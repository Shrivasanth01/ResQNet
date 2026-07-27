import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withDelay 
} from "react-native-reanimated";
import { Colors } from "../../theme/colors";
import PrimaryButton from "../buttons/PrimaryButton";

interface Props {
  onReturnHome: () => void;
  reportId?: string;
}

export default function SuccessModal({ onReturnHome, reportId = "RQ-8849" }: Props) {
  const scale = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 6, stiffness: 100 }),
      withDelay(100, withSpring(1, { damping: 10 }))
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconCircle, animatedIconStyle]}>
        <MaterialIcons name="check" size={70} color={Colors.white} />
      </Animated.View>

      <Text style={styles.title}>Report Broadcasted!</Text>
      <Text style={styles.subtitle}>
        Your emergency report has been logged locally and broadcasted across available mesh nodes and emergency frequencies.
      </Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>INCIDENT ID: {reportId}</Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Return to Dashboard"
          onPress={onReturnHome}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  badge: {
    backgroundColor: `${Colors.primary}15`,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
    marginBottom: 40,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  footer: {
    width: "100%",
  },
});
