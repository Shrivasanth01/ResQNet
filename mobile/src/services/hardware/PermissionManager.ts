import { Platform } from "react-native";
import * as Location from "expo-location";

export interface PermissionStatusSummary {
  locationForeground: boolean;
  locationBackground: boolean;
  notifications: boolean;
  motionSensors: boolean;
  bluetooth: boolean;
  allEssentialGranted: boolean;
}

/**
 * ResQNet Hardware Permission Manager
 * 
 * Evaluates and requests essential physical hardware permissions across iOS and Android.
 * Engineered to provide graceful fallback capabilities when permissions are restricted or denied.
 */
class PermissionManagerService {
  private currentStatus: PermissionStatusSummary = {
    locationForeground: false,
    locationBackground: false,
    notifications: true,
    motionSensors: true,
    bluetooth: true,
    allEssentialGranted: false
  };

  public async checkAllPermissions(): Promise<PermissionStatusSummary> {
    try {
      if (Platform.OS !== "web") {
        // 1. Check Foreground GPS
        const fgLoc = await Location.getForegroundPermissionsAsync();
        this.currentStatus.locationForeground = fgLoc.status === "granted";

        // 2. Check Background GPS ("Always Allow")
        try {
          const bgLoc = await Location.getBackgroundPermissionsAsync();
          this.currentStatus.locationBackground = bgLoc.status === "granted";
        } catch {
          this.currentStatus.locationBackground = false;
        }
      } else {
        // Web Environment HTML5 Geolocation Check
        const isGeoAvailable = typeof navigator !== "undefined" && "geolocation" in navigator;
        this.currentStatus.locationForeground = isGeoAvailable;
        this.currentStatus.locationBackground = isGeoAvailable;
      }

      this.evaluateEssential();
    } catch (e) {
      console.warn("[PermissionManager] Graceful fallback during hardware permission inspection:", e);
    }
    return { ...this.currentStatus };
  }

  public async requestEssentialPermissions(): Promise<PermissionStatusSummary> {
    try {
      if (Platform.OS !== "web") {
        // 1. Request Foreground Location
        const fgReq = await Location.requestForegroundPermissionsAsync();
        this.currentStatus.locationForeground = fgReq.status === "granted";

        // 2. Request Always Allow (Background Location)
        if (this.currentStatus.locationForeground) {
          try {
            const bgReq = await Location.requestBackgroundPermissionsAsync();
            this.currentStatus.locationBackground = bgReq.status === "granted";
          } catch (e) {
            console.warn("[PermissionManager] Background location request deferred or unsupported on this device profile.");
          }
        }
      } else {
        // Prompt Web Geolocation Permission
        if (typeof navigator !== "undefined" && "geolocation" in navigator) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => {
                this.currentStatus.locationForeground = true;
                this.currentStatus.locationBackground = true;
                resolve();
              },
              () => {
                this.currentStatus.locationForeground = false;
                this.currentStatus.locationBackground = false;
                resolve();
              },
              { timeout: 3000 }
            );
          });
        }
      }

      this.evaluateEssential();
    } catch (e) {
      console.warn("[PermissionManager] Permission dialog exception caught. Reverting to standby fallback mode:", e);
    }
    return { ...this.currentStatus };
  }

  private evaluateEssential(): void {
    // Requires foreground location for core minimum operational criteria
    this.currentStatus.allEssentialGranted = 
      this.currentStatus.locationForeground && this.currentStatus.notifications;
  }

  public getStatus(): PermissionStatusSummary {
    return { ...this.currentStatus };
  }
}

export const PermissionManager = new PermissionManagerService();
