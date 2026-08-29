import { TriggerSource, IncidentSeverity } from "./packet";

export type SensorEventType =
  | "IMPACT_DETECTED"
  | "FREE_FALL"
  | "RAPID_ALTITUDE_DROP"
  | "STATIONARY_IMMOBILITY"
  | "LOUD_NOISE_CRASH"
  | "TEMPERATURE_ANOMALY"
  | "POWER_CRASH";

export type DecisionAction = "IGNORE" | "WARN_USER" | "START_COUNTDOWN" | "GENERATE_SOS_PACKET";
export type BatteryMode = "NORMAL" | "CONSERVATION" | "CRITICAL_POWER_SAVE";

export interface SensorEvent {
  id?: string;
  type?: SensorEventType;
  eventType?: string;
  timestamp: string; // ISO-8601
  confidence: number; // Normalized 0.0 to 1.0
  magnitude?: number; // e.g. G-force (9.8 m/s^2 = 1G), decibels, meters dropped
  sourceProvider?: "SIMULATED_PROVIDER" | "HARDWARE_IMU";
  source?: string;
  rawValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ContextState {
  isMovingFast: boolean; // Speed > 30 m/s (vehicular speed)
  estimatedSpeedMetersPerSec: number;
  isStationary: boolean; // Zero accelerometer variance over 5+ seconds
  timeOfDay: string;
  networkSignalStrength: "STRONG" | "WEAK" | "OFFLINE_BLACKOUT";
  gpsAccuracyMeters: number;
  environmentalRiskFactor: number; // Multiplier from 1.0 to 2.0 based on hazardous terrain/weather
}

export interface BatteryState {
  batteryPercentage: number;
  isCharging: boolean;
  estimatedHoursRemaining: number;
  batteryMode: BatteryMode;
  thermalStatus: "NORMAL" | "WARM" | "OVERHEATED";
}

export interface DecisionResult {
  action: DecisionAction;
  emergencyConfidenceScore: number; // ECS between 0 and 100
  computedSeverity: IncidentSeverity;
  primaryTrigger: TriggerSource;
  recommendationText: string;
  timestamp: string;
  eventId: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  eventType: "SENSOR_DETECTED" | "CONTEXT_EVALUATED" | "SCORE_CALCULATED" | "USER_WARNED" | "COUNTDOWN_STARTED" | "PACKET_GENERATED";
  summary: string;
  ecsSnapshot?: number;
  details: Record<string, any>;
}

export interface SensorProviderContract {
  startMonitoring(onEvent: (event: SensorEvent) => void): void;
  stopMonitoring(): void;
  isSimulated(): boolean;
  getProviderName(): string;
}
