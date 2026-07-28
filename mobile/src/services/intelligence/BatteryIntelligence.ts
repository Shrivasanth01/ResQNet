import { BatteryState, BatteryMode } from "../../types/intelligence";

let currentBatteryState: BatteryState = {
  batteryPercentage: 88,
  isCharging: false,
  estimatedHoursRemaining: 18.5,
  batteryMode: "NORMAL",
  thermalStatus: "NORMAL",
};

export const BatteryIntelligence = {
  /**
   * Reads current battery telemetry and adapts operating conservation modes
   */
  getBatteryState: (): BatteryState => {
    let mode: BatteryMode = "NORMAL";
    if (currentBatteryState.batteryPercentage <= 15) {
      mode = "CRITICAL_POWER_SAVE";
    } else if (currentBatteryState.batteryPercentage <= 30) {
      mode = "CONSERVATION";
    }

    currentBatteryState.batteryMode = mode;
    return { ...currentBatteryState };
  },

  /**
   * Allows test pipelines or future expo-battery sensor wrappers to push live device telemetry
   */
  updateTelemetry: (percentage: number, isCharging: boolean, thermal: "NORMAL" | "WARM" | "OVERHEATED" = "NORMAL"): BatteryState => {
    currentBatteryState = {
      batteryPercentage: Math.max(0, Math.min(100, percentage)),
      isCharging,
      estimatedHoursRemaining: parseFloat((percentage * 0.22).toFixed(1)),
      batteryMode: percentage <= 15 ? "CRITICAL_POWER_SAVE" : percentage <= 30 ? "CONSERVATION" : "NORMAL",
      thermalStatus: thermal,
    };
    return { ...currentBatteryState };
  },

  /**
   * Returns suggested sensor sampling interval (in milliseconds) to conserve battery during disaster scenarios
   * Low power extends sampling intervals without sacrificing emergency G-force interrupt detection
   */
  getRecommendedSamplingIntervalMs: (): number => {
    const state = BatteryIntelligence.getBatteryState();
    if (state.batteryMode === "CRITICAL_POWER_SAVE") return 5000; // 5 second polling intervals
    if (state.batteryMode === "CONSERVATION") return 2000; // 2 second polling intervals
    return 250; // 250ms high-fidelity polling during normal operation
  },

  /**
   * Computes an emergency urgency multiplier based on battery depletion risk
   */
  getDepletionUrgencyMultiplier: (): number => {
    const state = BatteryIntelligence.getBatteryState();
    if (state.batteryPercentage < 10 && !state.isCharging) {
      return 1.15; // Elevate ECS slightly so last-gasp distress signals transmit before battery shutdown
    }
    return 1.0;
  }
};
