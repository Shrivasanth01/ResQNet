import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useEffect, useState, useCallback } from "react";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../../theme/colors";
import LocationCard, { LocationTelemetry } from "../LocationCard";
import SectionHeader from "../../common/SectionHeader";

interface Props {
  location: LocationTelemetry | null;
  onUpdateLocation: (loc: LocationTelemetry) => void;
}

export default function StepLocationCapture({ location, onUpdateLocation }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(!location);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Location access was denied. Please enable GPS permissions in device settings.");
        setIsLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      const telemetry: LocationTelemetry = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || null,
        timestamp: timeStr,
      };

      onUpdateLocation(telemetry);
    } catch (err) {
      setErrorMessage("Failed to acquire GPS signals. Ensure location services are turned on.");
    } finally {
      setIsLoading(false);
    }
  }, [onUpdateLocation]);

  useEffect(() => {
    if (!location) {
      fetchLocation();
    }
  }, [location, fetchLocation]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Geodetic Telemetry" />
      
      <Text style={styles.description}>
        ResQNet uses high-accuracy device GPS sensors to pinpoint your exact coordinates for search and rescue operations, even without active network towers.
      </Text>

      <LocationCard
        location={location}
        isLoading={isLoading}
        error={errorMessage}
        onRefresh={fetchLocation}
      />

      <View style={styles.tipBox}>
        <MaterialIcons name="info-outline" size={20} color={Colors.primary} />
        <Text style={styles.tipText}>
          If indoor accuracy is degraded, step outside briefly while refreshing coordinates to obtain a direct satellite fix.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  tipBox: {
    flexDirection: "row",
    backgroundColor: `${Colors.primary}10`,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    marginTop: 16,
    alignItems: "center",
  },
  tipText: {
    color: Colors.text,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 12,
    flex: 1,
  },
});
