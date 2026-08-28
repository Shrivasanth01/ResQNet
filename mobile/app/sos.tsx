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