import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { EmergencyMediaRecorder, RecordingTelemetry } from "../../services/hardware/EmergencyMediaRecorder";
import { Colors } from "../../theme/colors";

export default function EmergencyCameraView() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

    const stream = EmergencyMediaRecorder.getMediaStream();
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

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
        <video
          ref={(ref) => {
            videoRef.current = ref;
            const stream = EmergencyMediaRecorder.getMediaStream();
            if (ref && stream) ref.srcObject = stream;
          }}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 16,
            backgroundColor: "#0f172a",
          }}
        />

        {/* Recording Overlay Badge */}
        <View style={styles.recBadge}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>REC {formatDuration(telemetry.durationSec)}</Text>
        </View>

        {/* Audio & Video Active Indicators */}
        <View style={styles.statusRow}>
          <View style={styles.statusTag}>
            <MaterialIcons name="videocam" size={14} color={Colors.white} />
            <Text style={styles.tagText}>HD VIDEO</Text>
          </View>
          <View style={styles.statusTag}>
            <MaterialIcons name="mic" size={14} color={Colors.white} />
            <Text style={styles.tagText}>AUDIO ACTIVE</Text>
          </View>
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
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: Colors.danger,
    backgroundColor: "#020617",
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
  statusRow: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tagText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
});
