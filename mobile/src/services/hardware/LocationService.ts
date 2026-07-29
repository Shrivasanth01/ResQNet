import * as Location from "expo-location";
import { Platform } from "react-native";
import { PermissionManager } from "./PermissionManager";

export interface HardwareLocationTelemetry {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  speed: number; // meters per second
  heading: number; // true north bearing in degrees
  timestamp: string;
  isSimulatedFallback: boolean;
}

type LocationCallback = (location: HardwareLocationTelemetry) => void;

/**
 * Hardware Location & GPS Service
 * 
 * Samples satellite GPS coordinates, altitude in meters, velocity speed, and heading via expo-location.
 * Implements cached last-known fallback coordinates when underground or inside severe urban concrete ruins.
 */
class LocationServiceClass {
  private watchSubscription: any = null;
  private listeners: LocationCallback[] = [];
  private isWatching: boolean = false;
  private lastLocation: HardwareLocationTelemetry = {
    latitude: 37.7749, // Standby default center
    longitude: -122.4194,
    altitude: 14.5,
    accuracy: 5.0,
    speed: 0.0,
    heading: 0.0,
    timestamp: new Date().toISOString(),
    isSimulatedFallback: true
  };

  public async startTracking(highAccuracy: boolean = true): Promise<boolean> {
    if (this.isWatching) return true;

    const perms = PermissionManager.getStatus();
    if (!perms.locationForeground) {
      await PermissionManager.requestEssentialPermissions();
    }

    try {
      if (Platform.OS !== "web") {
        this.watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000, // High-frequency 1 second interval
            distanceInterval: 0.5,
          },
          (loc) => {
            this.processNewLocation(loc);
          }
        );
        this.isWatching = true;
      } else {
        // Web high-frequency HTML5 Geolocation Watch (1 second interval)
        if (typeof navigator !== "undefined" && "geolocation" in navigator) {
          navigator.geolocation.watchPosition(
            (pos) => {
              this.processNewLocation({
                coords: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  altitude: pos.coords.altitude,
                  accuracy: pos.coords.accuracy,
                  speed: pos.coords.speed,
                  heading: pos.coords.heading,
                },
                timestamp: pos.timestamp,
              } as any);
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
          );
        }
        this.isWatching = true;
      }
      return true;
    } catch (e) {
      console.warn("[LocationService] GPS hardware watch error. Using cached location fallback:", e);
      return false;
    }
  }

  public stopTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    this.isWatching = false;
  }

  private processNewLocation(loc: Location.LocationObject): void {
    const data: HardwareLocationTelemetry = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      altitude: loc.coords.altitude || 0.0,
      accuracy: loc.coords.accuracy || 10.0,
      speed: Math.max(0.0, loc.coords.speed || 0.0),
      heading: loc.coords.heading || 0.0,
      timestamp: new Date(loc.timestamp).toISOString(),
      isSimulatedFallback: false
    };

    this.lastLocation = data;
    for (const listener of this.listeners) {
      listener(data);
    }
  }

  public async getLatestLocation(): Promise<HardwareLocationTelemetry> {
    try {
      if (Platform.OS !== "web" && PermissionManager.getStatus().locationForeground) {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        this.processNewLocation(loc);
      }
    } catch (e) {
      // Revert to last known good coordinates without throwing UI exception
    }
    return { ...this.lastLocation };
  }

  public subscribe(callback: LocationCallback): () => void {
    this.listeners.push(callback);
    if (!this.isWatching && this.listeners.length === 1) {
      this.startTracking();
    }
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
      if (this.listeners.length === 0 && this.isWatching) {
        this.stopTracking();
      }
    };
  }

  /**
   * Diagnostic simulation ingestion allowing testing of high-speed vehicular transit or sudden GPS blackout loss.
   */
  public simulateLocation(lat: number, lng: number, speedMetersPerSec: number = 0, alt: number = 15): void {
    const data: HardwareLocationTelemetry = {
      latitude: lat,
      longitude: lng,
      altitude: alt,
      accuracy: 3.0,
      speed: speedMetersPerSec,
      heading: 90.0,
      timestamp: new Date().toISOString(),
      isSimulatedFallback: true
    };
    this.lastLocation = data;
    for (const listener of this.listeners) {
      listener(data);
    }
  }
}

export const LocationService = new LocationServiceClass();
