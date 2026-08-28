import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect, useState } from "react";
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
import { HardwareButtonDetector } from "../../services/hardware/HardwareButtonDetector";

export default function HeroSOSButton() {
  const pulse = useSharedValue(0);
  const [tapHint, setTapHint] = useState<string>("POWER BUTTON TAP READY (3X)");

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

  const handlePowerTapSim = () => {
    HardwareButtonDetector.registerPowerButtonTap();
    const count = HardwareButtonDetector.getTapCount();
    setTapHint(`TAP REGISTERED (${count}/3)`);
    setTimeout(() => {
      setTapHint("POWER BUTTON TAP READY (3X)");
    }, 2500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonWrapper}>
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
      </View>

      <View style={styles.tagRow}>
        <View style={styles.tacticalTag}>
          <View style={styles.liveDot} />
          <Text style={styles.tacticalText}>P2P MESH DISPATCH READY</Text>
        </View>

        <Pressable style={styles.powerBadge} onPress={handlePowerTapSim}>
          <MaterialIcons name="power-settings-new" size={13} color={Colors.danger} />
          <Text style={styles.powerBadgeText}>{tapHint}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  buttonWrapper: {
    width: 148,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseCircle: {
    position: "absolute",
    top: 0,
    left: 0,
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
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
  },
  tacticalTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(225, 29, 72, 0.12)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.25)",
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
  powerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  powerBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.danger,
    letterSpacing: 0.8,
  },
});
