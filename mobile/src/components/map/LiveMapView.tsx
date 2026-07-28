import { View, StyleSheet, SafeAreaView, Alert } from "react-native";
import { useEffect, useState, useRef, useMemo } from "react";
import MapView, { Marker, Circle, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Colors } from "../../theme/colors";

// Map Reusable Components
import MapLegend from "./MapLegend";
import EmergencyMarker from "./EmergencyMarker";
import BottomSheetCard from "./BottomSheetCard";
import FloatingLocationButton from "./FloatingLocationButton";
import { EmergencyIncident } from "./types";

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

export default function LiveMapView() {
  const mapRef = useRef<MapView | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);

  // Generate local mock emergencies relative to active coordinates
  const mockIncidents: EmergencyIncident[] = useMemo(() => {
    const baseLat = userLocation?.latitude ?? DEFAULT_REGION.latitude;
    const baseLng = userLocation?.longitude ?? DEFAULT_REGION.longitude;

    return [
      {
        id: "RQ-9102",
        title: "Acute Cardiac Emergency Near Metro Station",
        category: "Medical",
        severity: "Critical",
        timestamp: "6 mins ago",
        distance: "0.4 mi away",
        latitude: baseLat + 0.0065,
        longitude: baseLng - 0.0052,
      },
      {
        id: "RQ-8421",
        title: "Commercial Warehouse Alarm & Structural Fire",
        category: "Fire",
        severity: "High",
        timestamp: "14 mins ago",
        distance: "0.7 mi away",
        latitude: baseLat - 0.0058,
        longitude: baseLng + 0.0074,
      },
      {
        id: "RQ-7530",
        title: "Submerged Vehicle Under Expressway Bridge",
        category: "Flood",
        severity: "Medium",
        timestamp: "32 mins ago",
        distance: "1.1 mi away",
        latitude: baseLat + 0.0112,
        longitude: baseLng + 0.0105,
      },
      {
        id: "RQ-6204",
        title: "Multi-Vehicle Traffic Collision on Ramp",
        category: "Road Accident",
        severity: "High",
        timestamp: "45 mins ago",
        distance: "1.3 mi away",
        latitude: baseLat - 0.0089,
        longitude: baseLng - 0.0118,
      },
      {
        id: "RQ-5011",
        title: "Collapsed Utility Mast Hazard Blocking Sidewalk",
        category: "Other",
        severity: "Low",
        timestamp: "1 hour ago",
        distance: "0.9 mi away",
        latitude: baseLat + 0.0034,
        longitude: baseLng + 0.0138,
      },
    ];
  }, [userLocation]);

  const fetchUserLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Access Denied",
          "Showing default emergency zone. Enable GPS in settings for live self-positioning."
        );
        setIsLocating(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || undefined,
      };

      setUserLocation(coords);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.045,
          longitudeDelta: 0.045,
        }, 1000);
      }
    } catch (err) {
      // Keep default coordinates if signal is weak
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    fetchUserLocation();
  }, []);

  const handleCenterLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      }, 800);
    } else {
      fetchUserLocation();
    }
  };

  const handleNavigate = (incident: EmergencyIncident) => {
    Alert.alert(
      "Offline Navigation Initiated",
      `Calculating lowest-hazard tactical mesh route to incident ${incident.id} (${incident.title}).`
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        onPress={() => setSelectedIncident(null)}
        toolbarEnabled={false}
      >
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={userLocation.accuracy ?? 150}
              fillColor={`${Colors.secondary}20`}
              strokeColor={`${Colors.secondary}60`}
              strokeWidth={1.5}
            />
            <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} zIndex={999}>
              <View style={styles.userDotContainer}>
                <View style={styles.userDotRing}>
                  <View style={styles.userDotCenter} />
                </View>
              </View>
            </Marker>
          </>
        )}

        {mockIncidents.map((inc) => (
          <EmergencyMarker
            key={inc.id}
            incident={inc}
            isSelected={selectedIncident?.id === inc.id}
            onPress={(item) => setSelectedIncident(item)}
          />
        ))}
      </MapView>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <MapLegend />
      </SafeAreaView>

      <View style={styles.bottomOverlay} pointerEvents="box-none">
        <View style={[styles.buttonRow, selectedIncident && styles.buttonRowRaised]}>
          <FloatingLocationButton
            onPress={handleCenterLocation}
            isLoading={isLocating}
          />
        </View>

        <BottomSheetCard
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onNavigate={handleNavigate}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  buttonRowRaised: {
    paddingBottom: 12,
  },
  userDotContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  userDotRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.secondary}30`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userDotCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.secondary,
  },
});
