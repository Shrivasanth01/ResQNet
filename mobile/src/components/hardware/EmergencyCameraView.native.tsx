import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { EmergencyMediaRecorder, RecordingTelemetry } from "../../services/hardware/EmergencyMediaRecorder";
import { Colors } from "../../theme/colors";

export default function EmergencyCameraView() {
  const [telemetry, setTelemetry] = useState<RecordingTelemetry>({
    isRecording: false,
    durationSec: 0,
    hasAudio: true,
    hasVideo: true,
    mediaUrl: null,
    error: null,
  });

  useEffect(() => {
    const unsub = EmergencyMediaRecorder.subscribe((data) => {
      setTelemetry(data);
    });
    return () => {
      unsub();
    };
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <View style={styles.placeholderBox}>
          <MaterialIcons name="videocam" size={40} color={Colors.danger} />
          <Text style={styles.recLabel}>CAMERA & MIC HARDWARE CAPTURE</Text>
        </View>

        <View style={styles.recBadge}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>REC {formatDuration(telemetry.durationSec)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginVertical: 16,
  },
  videoWrapper: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: Colors.danger,
    backgroundColor: "#020617",
  },
  placeholderBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  recLabel: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  recBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(225, 29, 72, 0.9)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  recText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
