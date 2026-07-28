import { Platform } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

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
    notifications: false,
    motionSensors: true, // Native accelerometer/gyroscope open by default on most modern mobile frameworks
    bluetooth: true,
    allEssentialGranted: false
  };

  public async checkAllPermissions(): Promise<PermissionStatusSummary> {
    try {
      // 1. Check Foreground GPS
      const fgLoc = await Location.getForegroundPermissionsAsync();
      this.currentStatus.locationForeground = fgLoc.status === "granted";

      // 2. Check Background GPS
      const bgLoc = await Location.getBackgroundPermissionsAsync();
      this.currentStatus.locationBackground = bgLoc.status === "granted";

      // 3. Check Push & Local Notifications
      const notif = await Notifications.getPermissionsAsync();
      this.currentStatus.notifications = notif.status === "granted" || notif.status === "provisional" as any;

      this.evaluateEssential();
    } catch (e) {
      console.warn("[PermissionManager] Graceful fallback during hardware permission inspection:", e);
    }
    return { ...this.currentStatus };
  }

  public async requestEssentialPermissions(): Promise<PermissionStatusSummary> {
    try {
      // 1. Request Foreground Location
      const fgReq = await Location.requestForegroundPermissionsAsync();
      this.currentStatus.locationForeground = fgReq.status === "granted";

      // 2. Request Background Location if Foreground granted
      if (this.currentStatus.locationForeground && Platform.OS !== "web") {
        try {
          const bgReq = await Location.requestBackgroundPermissionsAsync();
          this.currentStatus.locationBackground = bgReq.status === "granted";
        } catch (e) {
          console.warn("[PermissionManager] Background location request deferred or unsupported on this device profile.");
        }
      }

      // 3. Request Notification alert authority
      if (Platform.OS !== "web") {
        const notifReq = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true }
        });
        this.currentStatus.notifications = notifReq.status === "granted" || notifReq.status === "provisional" as any;
      }

      this.evaluateEssential();
    } catch (e) {
      console.warn("[PermissionManager] Permission dialog exception caught. Reverting to standby fallback mode:", e);
    }
    return { ...this.currentStatus };
  }

  private evaluateEssential(): void {
    // We require foreground location and notifications as core minimum operational criteria
    this.currentStatus.allEssentialGranted = 
      this.currentStatus.locationForeground && this.currentStatus.notifications;
  }

  public getStatus(): PermissionStatusSummary {
    return { ...this.currentStatus };
  }
}

export const PermissionManager = new PermissionManagerService();
