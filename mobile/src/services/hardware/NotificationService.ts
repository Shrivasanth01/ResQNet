import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { PermissionManager } from "./PermissionManager";

// Set foreground push notification presentation rules
if (Platform.OS !== "web") {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      } as any),
    });
  } catch (e) {}
}

export type AlertType = "WARNING" | "COUNTDOWN_ALARM" | "SOS_TRIGGERED" | "DELIVERY_CONFIRMED" | "GOVERNMENT_ALERT";

/**
 * ResQNet Hardware Notification Service
 * 
 * Emits high-visibility acoustic alarms and push notifications for warning thresholds, automated fall countdowns,
 * cryptographic delivery confirmations, and governmental CAP broadcast instructions.
 */
class NotificationServiceClass {
  private countdownInterval: any = null;
  private isAlarmSounding: boolean = false;

  public async showNotification(
    type: AlertType,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string | null> {
    if (Platform.OS === "web") {
      console.log(`[NotificationService Web Fallback][${type}] ${title} -> ${body}`);
      return "web-notif-id-sim";
    }

    const perms = PermissionManager.getStatus();
    if (!perms.notifications) {
      await PermissionManager.requestEssentialPermissions();
    }

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `[ResQNet ${type}] ${title}`,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: data || { type }
        },
        trigger: null // Deliver immediately
      });
      return identifier;
    } catch (e) {
      console.warn("[NotificationService] Push notification schedule failure:", e);
      return null;
    }
  }

  /**
   * Triggers an interactive countdown alarm allowing conscious users to cancel automated SOS calls within 15 seconds.
   */
  public async startEmergencyCountdown(
    durationSeconds: number = 15,
    onCountdownEnd: () => void,
    onTick?: (secondsRemaining: number) => void
  ): Promise<void> {
    if (this.isAlarmSounding) return;
    this.isAlarmSounding = true;

    let remaining = durationSeconds;
    await this.showNotification(
      "COUNTDOWN_ALARM",
      "AUTOMATED SOS COUNTDOWN INITIALIZED",
      `Severe fall detected! Emergency distress packet broadcasting in ${remaining} seconds unless cancelled.`,
      { countdown: true }
    );

    this.countdownInterval = setInterval(() => {
      remaining -= 1;
      if (onTick) onTick(remaining);

      if (remaining <= 0) {
        this.cancelCountdown();
        console.warn("[NotificationService] Countdown terminated! Auto-triggering emergency SOS distress broadcast.");
        onCountdownEnd();
      }
    }, 1000);
  }

  public cancelCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.isAlarmSounding = false;
  }

  public async notifyDeliveryConfirmed(ackId: string, gatewayId: string): Promise<void> {
    await this.showNotification(
      "DELIVERY_CONFIRMED",
      "EMERGENCY RESCUE ACKNOWLEDGED",
      `Your SOS packet was successfully delivered and confirmed by command operations! [ACK: ${ackId}]`,
      { ackId, gatewayId }
    );
  }

  public async showGovernmentAlertPlaceholder(headline: string, instructions: string): Promise<void> {
    await this.showNotification(
      "GOVERNMENT_ALERT",
      headline,
      `[OFFICIAL DISASTER BROADCAST] ${instructions}`,
      { alertPriority: "EXTREME" }
    );
  }
}

export const NotificationService = new NotificationServiceClass();
