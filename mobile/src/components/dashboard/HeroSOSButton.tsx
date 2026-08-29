import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect, useState, useRef } from "react";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  interpolate 
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "../../theme/colors";
import { HardwareButtonDetector } from "../../services/hardware/HardwareButtonDetector";
import { EmergencyTriggerService } from "../../services/emergency/EmergencyTriggerService";

export default function HeroSOSButton() {
  const pulse = useSharedValue(0);
  const holdProgress = useSharedValue(0);
  const [tapHint, setTapHint] = useState<string>("POWER BUTTON TAP READY (3X)");
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const holdTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

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

  const holdProgressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(holdProgress.value, [0, 1], [1, 1.25]) }],
    borderColor: isHolding ? "#ef4444" : "rgba(255, 255, 255, 0.4)",
  }));

  const clearHoldTimers = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    holdProgress.value = withTiming(0, { duration: 200 });
  };

  const handlePressIn = () => {
    setIsHolding(true);
    setCountdown(3);
    holdProgress.value = withTiming(1, { duration: 3000, easing: Easing.linear });
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch {}
          return prev - 1;
        }
        return prev;
      });
    }, 1000);

    holdTimerRef.current = setTimeout(async () => {
      clearHoldTimers();
      setIsHolding(false);
      
      // 1. Trigger Direct Phone Call & Decentralized Mesh Broadcast
      await EmergencyTriggerService.triggerSOS();
      
      // 2. Open Live SOS Screen
      router.push("/sos");
    }, 3000);
  };

  const handlePressOut = () => {
    if (isHolding) {
      clearHoldTimers();
      setIsHolding(false);
      setCountdown(3);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

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
          style={({ pressed }) => [
            styles.button, 
            pressed && styles.buttonPressed,
            isHolding && styles.buttonHolding
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => {
            // Instant navigation if tapped quickly
            if (!isHolding) router.push("/sos");
          }}
        >
          <Animated.View style={[styles.innerGlow, holdProgressStyle]}>
            <MaterialIcons 
              name={isHolding ? "emergency-share" : "warning"} 
              size={36} 
              color={Colors.white} 
            />
            <Text style={styles.buttonText}>
              {isHolding ? `${countdown}s` : "SOS"}
            </Text>
            <Text style={styles.subLabel}>
              {isHolding ? "HOLDING TO BROADCAST" : "HOLD 3s FOR AID"}
            </Text>
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.tagRow}>
        <View style={styles.tacticalTag}>
          <View style={styles.liveDot} />
          <Text style={styles.tacticalText}>P2P MESH DISPATCH READY</Text>
        </View>

        <Pressable style={styles.powerBadge} onPress={handlePowerTapSim}>
          <MaterialIcons name="power-settings-new" size={13} color={Colors.primary} />
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
    marginVertical: 12,
  },
  buttonWrapper: {
    width: 144,
    height: 144,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseCircle: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: `${Colors.primary}18`,
    borderWidth: 1,
    borderColor: `${Colors.primary}35`,
  },
  button: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: Colors.dangerDark,
  },
  buttonHolding: {
    backgroundColor: "#b91c1c",
    borderColor: "#f87171",
    borderWidth: 4,
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
    color: "rgba(255,255,255,0.9)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 1,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
  },
  tacticalTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(39, 212, 199, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(39, 212, 199, 0.3)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentEmerald,
  },
  tacticalText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.accentCyan,
    letterSpacing: 0.8,
  },
  powerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(39, 212, 199, 0.08)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(39, 212, 199, 0.25)",
  },
  powerBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.accentCyan,
    letterSpacing: 0.8,
  },
});
