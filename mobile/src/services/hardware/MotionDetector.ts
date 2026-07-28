import { AccelerometerData, AccelerometerService } from "./AccelerometerService";
import { LocationService } from "./LocationService";

export type ActivityState = "STATIONARY" | "WALKING" | "RUNNING" | "VEHICLE_TRAVEL" | "UNKNOWN";

export interface MotionSummary {
  activity: ActivityState;
  cadenceFrequencyHz: number;
  averageGForce: number;
  confidence: number; // 0 to 1
  timestamp: number;
}

type MotionCallback = (summary: MotionSummary) => void;

/**
 * Kinematic Motion Detector Engine
 * 
 * Analyzes continuous accelerometer and GPS ground speed streams to accurately classify user activity states:
 * walking, running, vehicle transit (> 7 m/s), or stationary inactivity.
 */
class MotionDetectorClass {
  private buffer: AccelerometerData[] = [];
  private maxBufferSize: number = 40; // 4 seconds of history at 10Hz
  private listeners: MotionCallback[] = [];
  private isAnalyzing: boolean = false;
  private unsubscribeAccel: any = null;
  private lastSummary: MotionSummary = {
    activity: "STATIONARY",
    cadenceFrequencyHz: 0.0,
    averageGForce: 1.0,
    confidence: 0.9,
    timestamp: Date.now()
  };

  public start(): void {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;
    
    this.unsubscribeAccel = AccelerometerService.subscribe((reading) => {
      this.buffer.push(reading);
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift();
      }
      if (this.buffer.length >= 10) {
        this.evaluateActivity();
      }
    });
  }

  public stop(): void {
    if (this.unsubscribeAccel) {
      this.unsubscribeAccel();
      this.unsubscribeAccel = null;
    }
    this.isAnalyzing = false;
    this.buffer = [];
  }

  private async evaluateActivity(): Promise<void> {
    const magnitudes = this.buffer.map(b => b.magnitude);
    const sum = magnitudes.reduce((a, b) => a + b, 0);
    const avgG = sum / magnitudes.length;

    // Calculate standard deviation of G-force oscillations (variance representing kinematic motion energy)
    const variance = magnitudes.reduce((acc, val) => acc + Math.pow(val - avgG, 2), 0) / magnitudes.length;
    const stdDev = Math.sqrt(variance);

    // Get real ground speed from satellite GPS service
    const loc = await LocationService.getLatestLocation();
    const speedMps = loc.speed; // meters/second

    let activity: ActivityState = "STATIONARY";
    let confidence = 0.85;

    // Classification Decision Tree
    if (speedMps > 6.5) {
      // > 23 km/h indicates Vehicular transit (Car, Helicopter, Ambulance)
      activity = "VEHICLE_TRAVEL";
      confidence = 0.95;
    } else if (stdDev > 0.45 || avgG > 1.6) {
      // High cadence energetic oscillation indicates Running
      activity = "RUNNING";
      confidence = 0.90;
    } else if (stdDev > 0.12 && stdDev <= 0.45) {
      // Moderate rhythmic oscillation indicates Walking
      activity = "WALKING";
      confidence = 0.88;
    } else {
      // Minimal oscillation (< 0.12 stdDev and speed < 1 m/s) indicates Stationary stillness
      activity = "STATIONARY";
      confidence = 0.92;
    }

    const summary: MotionSummary = {
      activity,
      cadenceFrequencyHz: Number((stdDev * 5).toFixed(2)),
      averageGForce: Number(avgG.toFixed(3)),
      confidence,
      timestamp: Date.now()
    };

    if (summary.activity !== this.lastSummary.activity || Math.abs(summary.averageGForce - this.lastSummary.averageGForce) > 0.2) {
      this.lastSummary = summary;
      for (const listener of this.listeners) {
        listener(summary);
      }
    }
  }

  public subscribe(callback: MotionCallback): () => void {
    this.listeners.push(callback);
    callback({ ...this.lastSummary });
    if (!this.isAnalyzing && this.listeners.length === 1) {
      this.start();
    }
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
      if (this.listeners.length === 0 && this.isAnalyzing) {
        this.stop();
      }
    };
  }

  public getLatestSummary(): MotionSummary {
    return { ...this.lastSummary };
  }

  /**
   * Diagnostic simulation ingestion allowing immediate testing of physical walking, running, vehicle travel, and stationary states.
   */
  public simulateActivity(activity: ActivityState, avgG: number = 1.0): void {
    const summary: MotionSummary = {
      activity,
      cadenceFrequencyHz: activity === "RUNNING" ? 2.8 : activity === "WALKING" ? 1.4 : 0.0,
      averageGForce: avgG,
      confidence: 0.95,
      timestamp: Date.now()
    };
    this.lastSummary = summary;
    for (const listener of this.listeners) {
      listener(summary);
    }
  }
}

export const MotionDetector = new MotionDetectorClass();
