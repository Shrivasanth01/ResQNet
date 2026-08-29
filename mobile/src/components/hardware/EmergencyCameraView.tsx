import React from "react";
import { Platform } from "react-native";
import WebEmergencyCameraView from "./EmergencyCameraView.web";
import NativeEmergencyCameraView from "./EmergencyCameraView.native";

export default function EmergencyCameraView() {
  if (Platform.OS === "web") {
    return <WebEmergencyCameraView />;
  }
  return <NativeEmergencyCameraView />;
}
