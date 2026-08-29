import { Gyroscope } from "expo-sensors";
import { Platform } from "react-native";

export interface GyroscopeData {
  x: number; // Angular velocity around X-axis (radians/s or deg/s)
  y: number;
  z: number;
  timestamp: number;
  angularMagnitude: number; // Combined rotational cadence
}

type GyroCallback = (data: GyroscopeData) => void;

/**
 * Hardware Gyroscope Service
 * 
 * Captures device orientation, rotation rates, and rapid angular tumbling velocities via expo-sensors.
 * Essential for verifying genuine traumatic falls versus accidental simple phone drops onto carpet.
 */
class GyroscopeServiceClass {
  private subscription: any = null;
  private listeners: GyroCallback[] = [];
  private updateIntervalMs: number = 100; // 10Hz sampling
  private isRunning: boolean = false;
  private lastReading: GyroscopeData = { x: 0, y: 0, z: 0, timestamp: Date.now(), angularMagnitude: 0.0 };

  constructor() {
    this.setUpdateInterval(this.updateIntervalMs);
  }

  public setUpdateInterval(intervalMs: number): void {
    this.updateIntervalMs = intervalMs;
    try {
      if (Platform.OS !== "web") {
        Gyroscope.setUpdateInterval(intervalMs);
      }
    } catch (e) {
      console.warn("[GyroscopeService] Unable to set gyroscope update interval:", e);
    }
  }

  public start(): void {
    if (this.isRunning || Platform.OS === "web") return;

    try {
      this.subscription = Gyroscope.addListener((reading: any) => {
        const now = Date.now();
        // Compute total angular rotational velocity: sqrt(x^2 + y^2 + z^2)
        const angularMagnitude = Math.sqrt(
          reading.x * reading.x + reading.y * reading.y + reading.z * reading.z
        );

        const data: GyroscopeData = {
          x: reading.x,
          y: reading.y,
          z: reading.z,
          timestamp: now,
          angularMagnitude: Number(angularMagnitude.toFixed(3))
        };

        this.lastReading = data;
        for (const listener of this.listeners) {
          listener(data);
        }
      });
      this.isRunning = true;
    } catch (e) {
      console.warn("[GyroscopeService] Failed to bind gyroscope hardware listener:", e);
    }
  }

  public stop(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.isRunning = false;
  }

  public subscribe(callback: GyroCallback): () => void {
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

  public getLastReading(): GyroscopeData {
    return { ...this.lastReading };
  }

  /**
   * Diagnostic simulation ingestion allowing automated testing of tumbling rotations and vehicular spinouts.
   */
  public simulateReading(x: number, y: number, z: number): void {
    const now = Date.now();
    const angularMagnitude = Math.sqrt(x * x + y * y + z * z);
    const data: GyroscopeData = { x, y, z, timestamp: now, angularMagnitude: Number(angularMagnitude.toFixed(3)) };
    this.lastReading = data;
    for (const listener of this.listeners) {
      listener(data);
    }
  }
}

export const GyroscopeService = new GyroscopeServiceClass();
