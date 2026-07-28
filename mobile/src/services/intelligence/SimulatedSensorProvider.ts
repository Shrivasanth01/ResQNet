import { SensorEvent, SensorProviderContract } from "../../types/intelligence";
import { DecisionEngine } from "./DecisionEngine";
import { ContextAwareness } from "./ContextAwareness";
import { BatteryIntelligence } from "./BatteryIntelligence";

let isMonitoring = false;

/**
 * Simulated Hardware Sensor Provider
 * 
 * DESIGN PRINCIPLE:
 * Implements the rigorous SensorProviderContract so that when native accelerometer, gyroscope,
 * and IMU sensors are plugged in during Phase 2B, this simulated provider can be cleanly swapped out
 * without modifying a single line of the Decision Engine or Emergency Packet architecture.
 */
export const SimulatedSensorProvider: SensorProviderContract & {
  simulateMinorDrop(): Promise<any>;
  simulateRoughBrake(): Promise<any>;
  simulateBicycleFall(): Promise<any>;
  simulateHighSpeedVehicleCrash(): Promise<any>;
} = {
  getProviderName: () => "ResQNet Simulated Sensor Provider v2.0",
  
  isSimulated: () => true,

  startMonitoring: (onEvent: (event: SensorEvent) => void) => {
    isMonitoring = true;
    console.log("SimulatedSensorProvider active. Ready to inject synthetic disaster telemetry.");
  },

  stopMonitoring: () => {
    isMonitoring = false;
    console.log("SimulatedSensorProvider halted.");
  },

  /**
   * Scenario 1: Minor drop onto soft couch or table bump (Expected Action: IGNORE, ECS < 35)
   */
  simulateMinorDrop: async () => {
    DecisionEngine.resetEngine();
    ContextAwareness.updateContext({ isMovingFast: false, isStationary: false, networkSignalStrength: "STRONG" });
    
    const event: SensorEvent = {
      id: `SIM-DROP-${Date.now()}`,
      type: "IMPACT_DETECTED",
      timestamp: new Date().toISOString(),
      confidence: 0.4,
      magnitude: 3.2, // 3.2G bump
      sourceProvider: "SIMULATED_PROVIDER",
      metadata: { scenario: "Minor carpet drop" },
    };

    return await DecisionEngine.evaluateSensorEvent(event);
  },

  /**
   * Scenario 2: Rough braking or sudden pothole jolt in vehicle (Expected Action: WARN_USER, 35 <= ECS < 65)
   */
  simulateRoughBrake: async () => {
    DecisionEngine.resetEngine();
    ContextAwareness.updateContext({ isMovingFast: true, estimatedSpeedMetersPerSec: 22, isStationary: false });
    
    const event: SensorEvent = {
      id: `SIM-BRAKE-${Date.now()}`,
      type: "IMPACT_DETECTED",
      timestamp: new Date().toISOString(),
      confidence: 0.7,
      magnitude: 6.8, // Moderate deceleration spike
      sourceProvider: "SIMULATED_PROVIDER",
      metadata: { scenario: "Rough vehicular braking" },
    };

    return await DecisionEngine.evaluateSensorEvent(event);
  },

  /**
   * Scenario 3: Bicycle fall or trip down stairs with stationarity (Expected Action: START_COUNTDOWN, 65 <= ECS < 85)
   */
  simulateBicycleFall: async () => {
    DecisionEngine.resetEngine();
    ContextAwareness.updateContext({ isMovingFast: false, estimatedSpeedMetersPerSec: 6, isStationary: true });
    
    // Step 1: Free fall
    await DecisionEngine.evaluateSensorEvent({
      id: `SIM-FALL-1-${Date.now()}`,
      type: "FREE_FALL",
      timestamp: new Date().toISOString(),
      confidence: 0.85,
      magnitude: 2.5,
      sourceProvider: "SIMULATED_PROVIDER",
    });

    // Step 2: Immediate impact + stationarity within correlation window
    const impactEvent: SensorEvent = {
      id: `SIM-FALL-2-${Date.now()}`,
      type: "IMPACT_DETECTED",
      timestamp: new Date().toISOString(),
      confidence: 0.88,
      magnitude: 9.5, // 9.5G impact
      sourceProvider: "SIMULATED_PROVIDER",
      metadata: { scenario: "Bicycle fall with motionless stationarity" },
    };
    
    // Inject immobility marker
    await DecisionEngine.evaluateSensorEvent({
      id: `SIM-FALL-3-${Date.now()}`,
      type: "STATIONARY_IMMOBILITY",
      timestamp: new Date().toISOString(),
      confidence: 0.95,
      magnitude: 0,
      sourceProvider: "SIMULATED_PROVIDER",
    });

    return await DecisionEngine.evaluateSensorEvent(impactEvent);
  },

  /**
   * Scenario 4: Catastrophic highway vehicle crash in network blackout (Expected Action: GENERATE_SOS_PACKET, ECS >= 85)
   */
  simulateHighSpeedVehicleCrash: async () => {
    DecisionEngine.resetEngine();
    // Simulate high vehicular speed + cellular blackout zone + immediate post-impact immobility
    ContextAwareness.updateContext({
      isMovingFast: true,
      estimatedSpeedMetersPerSec: 35,
      isStationary: true,
      networkSignalStrength: "OFFLINE_BLACKOUT",
    });
    
    BatteryIntelligence.updateTelemetry(12, false, "WARM"); // Low battery triggers depletion urgency

    // Inject rapid altitude loss & heavy collision
    await DecisionEngine.evaluateSensorEvent({
      id: `SIM-CRASH-1-${Date.now()}`,
      type: "RAPID_ALTITUDE_DROP",
      timestamp: new Date().toISOString(),
      confidence: 0.96,
      magnitude: 12.0,
      sourceProvider: "SIMULATED_PROVIDER",
    });

    await DecisionEngine.evaluateSensorEvent({
      id: `SIM-CRASH-2-${Date.now()}`,
      type: "STATIONARY_IMMOBILITY",
      timestamp: new Date().toISOString(),
      confidence: 0.99,
      magnitude: 0,
      sourceProvider: "SIMULATED_PROVIDER",
    });

    const catastrophicImpact: SensorEvent = {
      id: `SIM-CRASH-3-${Date.now()}`,
      type: "IMPACT_DETECTED",
      timestamp: new Date().toISOString(),
      confidence: 0.98,
      magnitude: 18.5, // 18.5G catastrophic impact
      sourceProvider: "SIMULATED_PROVIDER",
      metadata: { scenario: "High-speed vehicle rollover in blackout zone" },
    };

    return await DecisionEngine.evaluateSensorEvent(catastrophicImpact);
  }
};
