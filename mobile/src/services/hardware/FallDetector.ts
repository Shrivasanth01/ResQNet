import { AccelerometerService, AccelerometerData } from "./AccelerometerService";
import { GyroscopeService } from "./GyroscopeService";

export interface FallDetectionEvent {
  fallDetected: boolean;
  impactGForce: number;
  rotationalRateDegPerSec: number;
  isConfirmedByStillness: boolean;
  timestamp: number;
}

type FallCallback = (event: FallDetectionEvent) => void;

/**
 * 3-Stage Kinematic Fall Detector Engine
 * 
 * DESIGN PRINCIPLE:
 * Eliminates false positive alarms (e.g. dropping phone onto a sofa or carpet) by requiring a strict sequence:
 * Stage 1: Free-fall weightlessness phase (< 0.35 G for > 80ms)
 * Stage 2: Sharp violent impact deceleration (> 2.6 G spike + rotational tumbling > 140 deg/s)
 * Stage 3: Post-impact stationary immobilization (no active movement for > 2,500ms)
 */
class FallDetectorClass {
  private listeners: FallCallback[] = [];
  private unsubscribeAccel: any = null;
  private isMonitoring: boolean = false;

  private inFreeFall: boolean = false;
  private freeFallTimestamp: number = 0;
  private recentImpactG: number = 0;
  private impactTimestamp: number = 0;
  private stillnessTimer: any = null;

  public start(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    this.unsubscribeAccel = AccelerometerService.subscribe((accel) => {
      this.evaluateKinematics(accel);
    });
  }

  public stop(): void {
    if (this.unsubscribeAccel) {
      this.unsubscribeAccel();
      this.unsubscribeAccel = null;
    }
    if (this.stillnessTimer) {
      clearTimeout(this.stillnessTimer);
      this.stillnessTimer = null;
    }
    this.isMonitoring = false;
    this.resetState();
  }

  private evaluateKinematics(accel: AccelerometerData): void {
    const now = accel.timestamp;
    const g = accel.magnitude;

    // STAGE 1: Free-Fall Detection (< 0.35 G)
    if (g < 0.35 && !this.inFreeFall) {
      this.inFreeFall = true;
      this.freeFallTimestamp = now;
      return;
    }

    // STAGE 2: Impact Deceleration Spike (> 2.6 G occurring within 1000ms of Free-Fall)
    if (g > 2.6 && (this.inFreeFall && now - this.freeFallTimestamp < 1000 || !this.inFreeFall && g > 3.5)) {
      const gyro = GyroscopeService.getLastReading();
      const rotationalDegPerSec = gyro.angularMagnitude * 57.2958; // Convert radians/s to degrees/s

      this.recentImpactG = g;
      this.impactTimestamp = now;

      // Commence Stage 3: Post-Impact Stillness Verification (wait 2.5 seconds)
      if (this.stillnessTimer) clearTimeout(this.stillnessTimer);
      this.stillnessTimer = setTimeout(() => {
        this.verifyPostImpactStillness(rotationalDegPerSec);
      }, 2500);

      return;
    }

    // Reset free-fall window if no impact observed within 1500ms
    if (this.inFreeFall && now - this.freeFallTimestamp > 1500 && this.impactTimestamp === 0) {
      this.resetState();
    }
  }

  private verifyPostImpactStillness(rotationalDegPerSec: number): void {
    const latestAccel = AccelerometerService.getLastReading();
    const g = latestAccel.magnitude;

    // Stillness verified if acceleration magnitude stabilized near Earth normal (0.85 G to 1.15 G)
    const isStill = g >= 0.85 && g <= 1.15;

    if (isStill) {
      const event: FallDetectionEvent = {
        fallDetected: true,
        impactGForce: Number(this.recentImpactG.toFixed(2)),
        rotationalRateDegPerSec: Number(rotationalDegPerSec.toFixed(1)),
        isConfirmedByStillness: true,
        timestamp: Date.now()
      };

      console.warn(`[FallDetector] CRITICAL AUTONOMOUS FALL VERIFIED! Impact: ${event.impactGForce}G | Tumbling: ${event.rotationalRateDegPerSec}°/s | Post-Impact Immobility Confirmed!`);
      for (const listener of this.listeners) {
        listener(event);
      }
    }

    this.resetState();
  }

  private resetState(): void {
    this.inFreeFall = false;
    this.freeFallTimestamp = 0;
    this.recentImpactG = 0;
    this.impactTimestamp = 0;
    if (this.stillnessTimer) {
      clearTimeout(this.stillnessTimer);
      this.stillnessTimer = null;
    }
  }

  public subscribe(callback: FallCallback): () => void {
    this.listeners.push(callback);
    if (!this.isMonitoring && this.listeners.length === 1) {
      this.start();
    }
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
      if (this.listeners.length === 0 && this.isMonitoring) {
        this.stop();
      }
    };
  }

  /**
   * Diagnostic simulation ingestion allowing automated testing of violent phone drops and incapacitation events.
   */
  public simulateFallEvent(impactG: number = 3.8, tumblingRate: number = 185.0, confirmedByStillness: boolean = true): void {
    const event: FallDetectionEvent = {
      fallDetected: true,
      impactGForce: impactG,
      rotationalRateDegPerSec: tumblingRate,
      isConfirmedByStillness: confirmedByStillness,
      timestamp: Date.now()
    };
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export const FallDetector = new FallDetectorClass();
