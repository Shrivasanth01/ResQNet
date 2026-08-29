import * as Haptics from "expo-haptics";

type SOSTriggerCallback = () => void;

/**
 * ResQNet Hardware Power Button SOS Detector
 * 
 * Listens for rapid power button / keypress events (3+ taps within 2.5 seconds).
 * Automatically triggers the emergency distress broadcast across mobile hardware & web profiles.
 */
class HardwareButtonDetectorService {
  private tapTimestamps: number[] = [];
  private listeners: SOSTriggerCallback[] = [];
  private isListening: boolean = false;
  private tapWindowMs: number = 2500; // 2.5 seconds window
  private requiredTapCount: number = 3;

  public initialize(): void {
    if (this.isListening) return;

    if (typeof window !== "undefined") {
      // 1. Intercept physical keyboard power/lock/volume/space/escape keys
      window.addEventListener("keydown", (e: KeyboardEvent) => {
        if (
          e.key === "Power" ||
          e.key === "Escape" ||
          e.key === " " ||
          e.code === "Space" ||
          e.key === "VolumeDown" ||
          e.key === "VolumeUp"
        ) {
          this.registerPowerButtonTap();
        }
      });

      // 2. Intercept rapid screen lock / power button visibility toggles
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", () => {
          this.registerPowerButtonTap();
        });
      }
    }

    this.isListening = true;
    console.log("[HardwareButtonDetector] Power button rapid-tap SOS detector initialized.");
  }

  /**
   * Register a single hardware power button press event
   */
  public registerPowerButtonTap(): void {
    const now = Date.now();
    // Filter timestamps within rolling window
    this.tapTimestamps = [...this.tapTimestamps.filter((t) => now - t <= this.tapWindowMs), now];

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Ignore if haptics unavailable
    }

    console.log(`[HardwareButtonDetector] Power button tap recorded (${this.tapTimestamps.length}/${this.requiredTapCount})`);

    if (this.tapTimestamps.length >= this.requiredTapCount) {
      console.warn("[HardwareButtonDetector] 🚨 RAPID POWER BUTTON SOS TRIGGER ACTIVATED!");
      this.triggerSOS();
      this.tapTimestamps = []; // Clear after activation
    }
  }

  private triggerSOS(): void {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Ignore if haptics unavailable
    }

    for (const cb of this.listeners) {
      cb();
    }
  }

  public subscribe(callback: SOSTriggerCallback): () => void {
    this.listeners.push(callback);
    this.initialize();
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public getTapCount(): number {
    return this.tapTimestamps.length;
  }
}

export const HardwareButtonDetector = new HardwareButtonDetectorService();
