import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect, useState, useRef } from "react";
import { router, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../src/theme/colors";
import PrimaryButton from "../src/components/buttons/PrimaryButton";

type SOSState = "IDLE" | "COUNTING" | "ACTIVE";

export default function SOSScreen() {
  const [sosState, setSosState] = useState<SOSState>("IDLE");
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handlePressIn = () => {
    if (sosState === "ACTIVE") return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSosState("COUNTING");
    setCountdown(3);

    // Haptic tick every second
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return prev - 1;
        }
        return prev;
      });
    }, 1000);

    // Activate after 3 seconds
    timerRef.current = setTimeout(() => {
      clearTimers();
      setSosState("ACTIVE");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // TODO: Connect to backend to broadcast SOS and location
    }, 3000);
  };

  const handlePressOut = () => {
    if (sosState === "COUNTING") {
      clearTimers();
      setSosState("IDLE");
      setCountdown(3);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCancelSOS = () => {
    // TODO: Connect to backend to cancel active SOS
    setSosState("IDLE");
    setCountdown(3);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Emergency", headerStyle: { backgroundColor: Colors.danger }, headerTintColor: Colors.white }} />
      
      <View style={styles.content}>
        {sosState === "ACTIVE" ? (
          <View style={styles.activeContainer}>
            <MaterialIcons name="warning" size={80} color={Colors.danger} />
            <Text style={styles.activeTitle}>SOS ACTIVE</Text>
            <Text style={styles.activeSubtitle}>
              Emergency alert has been broadcasted to nearby devices and the network.
            </Text>
            
            <View style={styles.cancelContainer}>
              <PrimaryButton 
                title="Cancel Emergency" 
                onPress={handleCancelSOS} 
              />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.instruction}>
              {sosState === "IDLE" 
                ? "HOLD to activate Emergency SOS" 
                : `Release to cancel... ${countdown}`}
            </Text>
            
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={({ pressed }) => [
                styles.sosButton,
                pressed && styles.sosButtonPressed
              ]}
            >
              <View style={styles.sosButtonInner}>
                <Text style={styles.sosText}>SOS</Text>
              </View>
            </Pressable>
            
            {sosState === "IDLE" && (
              <Text style={styles.warning}>
                Use only in genuine emergencies. Misuse may result in account suspension.
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  instruction: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 40,
    textAlign: "center",
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.danger,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosButtonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: Colors.primaryDark,
  },
  sosButtonInner: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  sosText: {
    color: Colors.white,
    fontSize: 48,
    fontWeight: "900",
  },
  warning: {
    marginTop: 40,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  activeContainer: {
    alignItems: "center",
    width: "100%",
  },
  activeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.danger,
    marginTop: 20,
    marginBottom: 10,
  },
  activeSubtitle: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 60,
  },
  cancelContainer: {
    width: "100%",
    paddingHorizontal: 20,
  }
});