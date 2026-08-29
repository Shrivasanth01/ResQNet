import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect, useState, useRef } from "react";
import { router, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../src/theme/colors";
import PrimaryButton from "../src/components/buttons/PrimaryButton";
import { EmergencyMediaRecorder } from "../src/services/hardware/EmergencyMediaRecorder";
import EmergencyCameraView from "../src/components/hardware/EmergencyCameraView";
import { PacketBuilder } from "../src/services/packet/PacketBuilder";
import { PacketQueue } from "../src/services/packet/PacketQueue";
import { CommunicationEngine } from "../src/services/communication/CommunicationEngine";
import { LocationService } from "../src/services/hardware/LocationService";

type SOSState = "IDLE" | "COUNTING" | "ACTIVE";

export default function SOSScreen() {
  const [sosState, setSosState] = useState<SOSState>("ACTIVE");
  const [countdown, setCountdown] = useState(3);
  const [deliveryStatusText, setDeliveryStatusText] = useState<string>("Sending emergency alert...");
  const [ackReceived, setAckReceived] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const executeSOSDelivery = async () => {
    setDeliveryStatusText("Sending emergency alert...");
    setAckReceived(false);
    try {
      const loc = LocationService.getLatestLocation();
      const packet = await PacketBuilder.buildEmergencyPacket({
        emergencyType: "Manual SOS Distress Broadcast",
        severity: "CRITICAL",
        ecs: 100,
        isAutomatic: false,
        triggerSource: "MANUAL_SOS_BUTTON",
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        accuracy: loc?.accuracy,
        locationSource: loc ? "LIVE" : "CACHED",
      });

      await PacketQueue.enqueue(packet);

      const result = await CommunicationEngine.deliverPacket(packet);
      if (result.success) {
        if (result.method === "INTERNET") {
          setDeliveryStatusText("Emergency alert delivered to ResQNet server.");
          setAckReceived(true);
        } else {
          setDeliveryStatusText(`Emergency alert relayed via ${result.method}.`);
        }
      } else {
        setDeliveryStatusText("No connection available. Emergency alert stored and will retry automatically.");
      }
    } catch (err: any) {
      setDeliveryStatusText("Emergency alert stored in offline queue. Retrying...");
    }
  };

  useEffect(() => {
    if (sosState === "ACTIVE") {
      EmergencyMediaRecorder.startRecording();
      executeSOSDelivery();
    }

    return () => {
      clearTimers();
      EmergencyMediaRecorder.stopRecording();
    };
  }, [sosState]);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handlePressIn = () => {
    if (sosState === "ACTIVE") return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSosState("COUNTING");
    setCountdown(3);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return prev - 1;
        }
        return prev;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      clearTimers();
      setSosState("ACTIVE");
      EmergencyMediaRecorder.startRecording();
      executeSOSDelivery();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    EmergencyMediaRecorder.stopRecording();
    setSosState("IDLE");
    setCountdown(3);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Emergency SOS Active", headerStyle: { backgroundColor: Colors.danger }, headerTintColor: Colors.white }} />
      
      <View style={styles.content}>
        {sosState === "ACTIVE" ? (
          <View style={styles.activeContainer}>
            <MaterialIcons name="warning" size={64} color={Colors.danger} />
            <Text style={styles.activeTitle}>SOS BROADCAST ACTIVE</Text>
            
            {/* Real Delivery Status Banner */}
            <View style={[styles.statusBanner, ackReceived && styles.statusBannerAck]}>
              <MaterialIcons name={ackReceived ? "check-circle" : "sync"} size={18} color={Colors.white} />
              <Text style={styles.statusBannerText}>{deliveryStatusText}</Text>
            </View>

            <Text style={styles.activeSubtitle}>
              Live distress telemetry, coordinates, and emergency audio/video stream are being captured and broadcasted.
            </Text>

            {/* Live Audio & Video Recording View */}
            <EmergencyCameraView />
            
            <View style={styles.cancelContainer}>
              <PrimaryButton 
                title="Cancel Emergency & Stop Recording" 
                onPress={handleCancelSOS} 
              />
            </View>
          </View>
        ) : (
          <View style={styles.idleWrapper}>
            <View style={styles.topInfo}>
              <View style={styles.emergencyPill}>
                <View style={styles.emergencyDot} />
                <Text style={styles.emergencyPillText}>TACTICAL MESH READY</Text>
              </View>
              
              <Text style={styles.instruction}>
                {sosState === "IDLE" 
                  ? "Emergency Distress Trigger" 
                  : `Dispatching in ${countdown}...`}
              </Text>
              
              <Text style={styles.warning}>
                {sosState === "IDLE" 
                  ? "Press and hold the SOS button below to transmit encrypted telemetry and GPS coordinates to all nearby mesh gateways."
                  : "Keep holding until countdown finishes, or release immediately to cancel."}
              </Text>
            </View>
            
            <View style={styles.thumbReachZone}>
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
                  <Text style={styles.sosSubHint}>{sosState === "IDLE" ? "HOLD 3 SEC" : `${countdown}S`}</Text>
                </View>
              </Pressable>
              
              <Text style={styles.tapInstruction}>
                {sosState === "IDLE" ? "• Touch & hold thumb to broadcast •" : `Release anytime to cancel`}
              </Text>
            </View>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  idleWrapper: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
  },
  topInfo: {
    alignItems: "center",
    paddingTop: 10,
    maxWidth: 380,
  },
  emergencyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(200, 55, 45, 0.1)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(200, 55, 45, 0.25)",
    marginBottom: 16,
  },
  emergencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.danger,
  },
  emergencyPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.danger,
    letterSpacing: 0.9,
  },
  instruction: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  warning: {
    fontSize: 13.5,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  thumbReachZone: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingBottom: 20,
  },
  sosButton: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: Colors.danger,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  sosButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: Colors.primaryDark,
  },
  sosButtonInner: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  sosText: {
    color: Colors.white,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  sosSubHint: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 2,
  },
  tapInstruction: {
    marginTop: 18,
    fontSize: 11.5,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  activeContainer: {
    alignItems: "center",
    width: "100%",
  },
  activeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.danger,
    marginTop: 12,
    marginBottom: 6,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(225, 29, 72, 0.95)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 10,
  },
  statusBannerAck: {
    backgroundColor: "#16a34a",
  },
  statusBannerText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  activeSubtitle: {
    fontSize: 14,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 20,
  },
  cancelContainer: {
    width: "100%",
    paddingHorizontal: 20,
  }
});