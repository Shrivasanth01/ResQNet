import { Accelerometer, SensorTypes } from "expo-sensors";
import { Platform } from "react-native";

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  magnitude: number; // calculated in G-force (1G ~= 9.81 m/s^2)
}

type AccelCallback = (data: AccelerometerData) => void;

/**
 * Hardware Accelerometer Service
 * 
 * Captures 3-axis acceleration telemetry via expo-sensors. Computes total kinematic G-force vector magnitudes
 * to feed real-time impact, free-fall, and human cadence classification algorithms.
 */
class AccelerometerServiceClass {
  private subscription: any = null;
  private listeners: AccelCallback[] = [];
  private updateIntervalMs: number = 100; // 10Hz sampling by default
  private isRunning: boolean = false;
  private lastReading: AccelerometerData = { x: 0, y: 0, z: -1, timestamp: Date.now(), magnitude: 1.0 };

  constructor() {
    this.setUpdateInterval(this.updateIntervalMs);
  }

  public setUpdateInterval(intervalMs: number): void {
    this.updateIntervalMs = intervalMs;
    try {
      if (Platform.OS !== "web") {
        Accelerometer.setUpdateInterval(intervalMs);
      }
    } catch (e) {
      console.warn("[AccelerometerService] Unable to set sensor update interval:", e);
    }
  }

  public start(): void {
    if (this.isRunning || Platform.OS === "web") return;

    try {
      this.subscription = Accelerometer.addListener((reading) => {
        const now = Date.now();
        // Compute resultant vector magnitude in Gs: sqrt(x^2 + y^2 + z^2)
        const magnitude = Math.sqrt(
          reading.x * reading.x + reading.y * reading.y + reading.z * reading.z
        );

        const data: AccelerometerData = {
          x: reading.x,
          y: reading.y,
          z: reading.z,
          timestamp: now,
          magnitude: Number(magnitude.toFixed(3))
        };

        this.lastReading = data;
        for (const listener of this.listeners) {
          listener(data);
        }
      });
      this.isRunning = true;
    } catch (e) {
      console.warn("[AccelerometerService] Failed to bind accelerometer hardware listener:", e);
    }
  }

  public stop(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.isRunning = false;
  }

  public subscribe(callback: AccelCallback): () => void {
    this.listeners.push(callback);
    if (!this.isRunning && this.listeners.length === 1) {
      this.start();
    }
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
      if (this.listeners.length === 0 && this.isRunning) {
        this.stop();
      }
    };
  }

  public getLastReading(): AccelerometerData {
    return { ...this.lastReading };
  }

  /**
   * Diagnostic simulation ingestion allowing test automation of drops, vehicular collisions, and running cadences.
   */
  public simulateReading(x: number, y: number, z: number): void {
    const now = Date.now();
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const data: AccelerometerData = { x, y, z, timestamp: now, magnitude: Number(magnitude.toFixed(3)) };
    this.lastReading = data;
    for (const listener of this.listeners) {
      listener(data);
    }
  }
}

export const AccelerometerService = new AccelerometerServiceClass();
