import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect } from "react";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  interpolate 
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "../../theme/colors";

export default function HeroSOSButton() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.35]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.6, 0.05]),
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.7]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0]),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.pulseCircle, animatedStyle2]} />
      <Animated.View style={[styles.pulseCircle, animatedStyle1]} />

      <Pressable 
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => router.push("/sos")}
      >
        <View style={styles.innerGlow}>
          <MaterialIcons name="warning" size={44} color={Colors.white} />
          <Text style={styles.buttonText}>SOS</Text>
          <Text style={styles.subLabel}>BROADCAST</Text>
        </View>
      </Pressable>

      <View style={styles.tacticalTag}>
        <View style={styles.liveDot} />
        <Text style={styles.tacticalText}>P2P MESH DISPATCH READY</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    height: 220,
  },
  pulseCircle: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: `${Colors.primary}35`,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}60`,
  },
  button: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  buttonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: Colors.primaryDark,
  },
  innerGlow: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  subLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 1,
  },
  tacticalTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(225, 29, 72, 0.12)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.25)",
    marginTop: 22,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  tacticalText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 0.8,
  },
});
