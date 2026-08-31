import * as Location from "expo-location";
import { Platform } from "react-native";
import { PermissionManager } from "./PermissionManager";
import { saveLocationRecord } from "../../storage/database";

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
 * Enforces "Always Allowed" high-accuracy location tracking.
 * Refreshes every 5 seconds (5000ms) and saves exact coordinates to local database history.
 */
class LocationServiceClass {
  private watchSubscription: any = null;
  private pollingTimer: any = null;
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
            timeInterval: 5000, // Enforce 5-second refresh interval
            distanceInterval: 0.1,
          },
          (loc) => {
            this.processNewLocation(loc);
          }
        );
      } else {
        // Web HTML5 Geolocation Watch (5-second refresh interval)
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
      }

      // Enforce 5-second polling timer for guaranteed exact 5sec coordinate refreshes
      if (!this.pollingTimer) {
        this.pollingTimer = setInterval(() => {
          this.refreshCurrentLocation();
        }, 5000);
      }

      this.isWatching = true;
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
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isWatching = false;
  }

  private processNewLocation(loc: Location.LocationObject): void {
    const data: HardwareLocationTelemetry = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      altitude: loc.coords.altitude || 0.0,
      accuracy: loc.coords.accuracy || 5.0,
      speed: Math.max(0.0, loc.coords.speed || 0.0),
      heading: loc.coords.heading || 0.0,
      timestamp: new Date(loc.timestamp || Date.now()).toISOString(),
      isSimulatedFallback: false
    };

    this.lastLocation = data;

    // Automatically store exact coordinates into local database history every 5 seconds
    saveLocationRecord({
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      timestamp: data.timestamp,
    }).catch(() => {});

    for (const listener of this.listeners) {
      listener(data);
    }
  }

  public async refreshCurrentLocation(): Promise<HardwareLocationTelemetry> {
    try {
      if (Platform.OS !== "web") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          this.processNewLocation(loc);
          return { ...this.lastLocation };
        }
      }

      // Web / Browser High-Accuracy Geolocation (properly awaited)
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        const hasPos = await new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              this.processNewLocation({
                coords: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  altitude: pos.coords.altitude || 0,
                  accuracy: pos.coords.accuracy || 5,
                  speed: pos.coords.speed || 0,
                  heading: pos.coords.heading || 0,
                },
                timestamp: pos.timestamp,
              } as any);
              resolve(true);
            },
            (err) => {
              console.warn("[LocationService] Browser geolocation warning:", err.message);
              resolve(false);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        });

        if (hasPos) {
          return { ...this.lastLocation };
        }
      }

      // Fallback: If device GPS is unavailable or blocked, resolve via IP location
      if (this.lastLocation.isSimulatedFallback) {
        try {
          const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
          if (res.ok) {
            const data = await res.json();
            if (data.latitude && data.longitude) {
              this.processNewLocation({
                coords: {
                  latitude: parseFloat(data.latitude),
                  longitude: parseFloat(data.longitude),
                  altitude: 10,
                  accuracy: 500, // Coarse accuracy
                  speed: 0,
                  heading: 0,
                },
                timestamp: Date.now(),
              } as any);
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn("[LocationService] Error refreshing location:", e);
    }
    return { ...this.lastLocation };
  }

  public async getLatestLocation(): Promise<HardwareLocationTelemetry> {
    return await this.refreshCurrentLocation();
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

    saveLocationRecord({
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      timestamp: data.timestamp,
    }).catch(() => {});

    for (const listener of this.listeners) {
      listener(data);
    }
  }
}

export const LocationService = new LocationServiceClass();
