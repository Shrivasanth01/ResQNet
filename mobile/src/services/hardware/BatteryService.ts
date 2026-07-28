import * as Battery from "expo-battery";
import { Platform } from "react-native";

export interface HardwareBatteryTelemetry {
  batteryLevel: number; // 0 to 100 percentage
  isCharging: boolean;
  lowPowerMode: boolean;
  timestamp: number;
}

type BatteryCallback = (data: HardwareBatteryTelemetry) => void;

/**
 * Hardware Battery Diagnostics Service
 * 
 * Tracks actual battery drain reserves, AC charging state transitions, and system Power Save modes via expo-battery.
 * Allows downstream discovery engines to throttle polling frequencies to extend survivor radio uptime.
 */
class BatteryServiceClass {
  private listeners: BatteryCallback[] = [];
  private levelSubscription: any = null;
  private stateSubscription: any = null;
  private lowPowerSubscription: any = null;
  private lastReading: HardwareBatteryTelemetry = {
    batteryLevel: 92,
    isCharging: false,
    lowPowerMode: false,
    timestamp: Date.now()
  };

  public async initialize(): Promise<HardwareBatteryTelemetry> {
    try {
      if (Platform.OS !== "web") {
        const [level, state, lowPower] = await Promise.all([
          Battery.getBatteryLevelAsync(),
          Battery.getBatteryStateAsync(),
          Battery.isLowPowerModeEnabledAsync()
        ]);

        this.lastReading = {
          batteryLevel: Math.round(level * 100),
          isCharging: state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL,
          lowPowerMode: lowPower,
          timestamp: Date.now()
        };

        this.levelSubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          this.lastReading.batteryLevel = Math.round(batteryLevel * 100);
          this.lastReading.timestamp = Date.now();
          this.notifyListeners();
        });

        this.stateSubscription = Battery.addBatteryStateListener(({ batteryState }) => {
          this.lastReading.isCharging = batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL;
          this.lastReading.timestamp = Date.now();
          this.notifyListeners();
        });

        this.lowPowerSubscription = Battery.addLowPowerModeListener(({ lowPowerMode }) => {
          this.lastReading.lowPowerMode = lowPowerMode;
          this.lastReading.timestamp = Date.now();
          this.notifyListeners();
        });
      }
    } catch (e) {
      console.warn("[BatteryService] Hardware battery inspection fallback invoked:", e);
    }
    return { ...this.lastReading };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener({ ...this.lastReading });
    }
  }

  public subscribe(callback: BatteryCallback): () => void {
    this.listeners.push(callback);
    callback({ ...this.lastReading });
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public getLatestReading(): HardwareBatteryTelemetry {
    return { ...this.lastReading };
  }

  public stop(): void {
    if (this.levelSubscription) this.levelSubscription.remove();
    if (this.stateSubscription) this.stateSubscription.remove();
    if (this.lowPowerSubscription) this.lowPowerSubscription.remove();
  }

  /**
   * Diagnostic simulation ingestion allowing automated testing of battery saver mode and critical power degradation.
   */
  public simulateBattery(levelPercent: number, isCharging: boolean = false, lowPowerMode: boolean = false): void {
    this.lastReading = {
      batteryLevel: levelPercent,
      isCharging,
      lowPowerMode,
      timestamp: Date.now()
    };
    this.notifyListeners();
  }
}

export const BatteryService = new BatteryServiceClass();
