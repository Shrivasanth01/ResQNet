import { ContextState } from "../../types/intelligence";

let currentContext: ContextState = {
  isMovingFast: false,
  estimatedSpeedMetersPerSec: 0,
  isStationary: true,
  timeOfDay: new Date().toLocaleTimeString(),
  networkSignalStrength: "STRONG",
  gpsAccuracyMeters: 4.5,
  environmentalRiskFactor: 1.0,
};

export const ContextAwareness = {
  /**
   * Retrieves live contextual environment telemetry
   */
  getContextState: (): ContextState => {
    return {
      ...currentContext,
      timeOfDay: new Date().toLocaleTimeString(),
    };
  },

  /**
   * Updates situational speed, stationarity, and network availability from GPS & cellular monitors
   */
  updateContext: (updates: Partial<ContextState>): ContextState => {
    currentContext = { ...currentContext, ...updates };
    // Adjust risk factors based on network blackout or high vehicle speeds
    let risk = 1.0;
    if (currentContext.isMovingFast) risk += 0.25; // Highway crash risk multiplier
    if (currentContext.networkSignalStrength === "OFFLINE_BLACKOUT") risk += 0.20; // Isolated location multiplier
    if (currentContext.gpsAccuracyMeters > 50) risk += 0.05;

    currentContext.environmentalRiskFactor = parseFloat(risk.toFixed(2));
    return { ...currentContext };
  },

  /**
   * Evaluates how vulnerable the user is based on combined real-world indicators
   */
  computeRiskMultiplier: (): number => {
    const ctx = ContextAwareness.getContextState();
    let multiplier = ctx.environmentalRiskFactor;
    if (ctx.isMovingFast && ctx.isStationary) {
      // Sudden deceleration from vehicular speed to full stop indicates a possible crash
      multiplier += 0.35;
    }
    return Math.min(2.0, multiplier); // Cap risk multiplier at 2.0x
  }
};
