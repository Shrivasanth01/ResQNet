import { SensorProviderContract, SensorEvent } from "../../types/intelligence";
import { AccelerometerService } from "./AccelerometerService";
import { GyroscopeService } from "./GyroscopeService";
import { LocationService } from "./LocationService";
import { BatteryService } from "./BatteryService";
import { NetworkService } from "./NetworkService";
import { MotionDetector } from "./MotionDetector";
import { FallDetector } from "./FallDetector";
import { NotificationService } from "./NotificationService";

/**
 * Real Hardware Sensor Provider
 * 
 * DESIGN PRINCIPLE (Dependency Inversion):
 * Implements our existing Phase 2A SensorProviderContract directly.
 * Replaces simulated sensor providers without modifying a single line of Sensor Fusion, Decision Engine,
 * or Emergency Packet logic!
 */
export class HardwareSensorProvider implements SensorProviderContract {
  public readonly providerName = "REAL_DEVICE_MEMS_HARDWARE_PROVIDER";
  private eventCallback: ((event: SensorEvent) => void) | null = null;
  private isProviderRunning: boolean = false;

  public getProviderName(): string {
    return this.providerName;
  }

  public isSimulated(): boolean {
    return false;
  }

  private unsubAccel: any = null;
  private unsubGyro: any = null;
  private unsubLoc: any = null;
  private unsubBatt: any = null;
  private unsubNet: any = null;
  private unsubMotion: any = null;
  private unsubFall: any = null;

  public startMonitoring(callback: (event: SensorEvent) => void): void {
    if (this.isProviderRunning) return;
    this.eventCallback = callback;
    this.isProviderRunning = true;

    console.log(`[HardwareSensorProvider] Activating physical hardware MEMS sensor streams...`);

    // 1. Subscribe to Fall Detector
    this.unsubFall = FallDetector.subscribe((fall) => {
      if (fall.fallDetected && this.eventCallback) {
        this.eventCallback({
          eventType: "SEVERE_IMPACT",
          timestamp: new Date(fall.timestamp || Date.now()).toISOString(),
          source: "ACCELEROMETER",
          confidence: 0.95,
          rawValues: { impactG: fall.impactGForce, tumblingDegPerSec: fall.rotationalRateDegPerSec }
        });
      }
    });

    // 2. Subscribe to Motion Classifier
    this.unsubMotion = MotionDetector.subscribe((motion) => {
      if (this.eventCallback) {
        if (motion.activity === "VEHICLE_TRAVEL") {
          this.eventCallback({
            eventType: "VEHICULAR_SPEED_DETECTED",
            timestamp: new Date(motion.timestamp || Date.now()).toISOString(),
            source: "GPS_SPEED",
            confidence: motion.confidence,
            rawValues: { cadenceHz: motion.cadenceFrequencyHz, averageGForce: motion.averageGForce }
          });
        }
      }
    });

    // 3. Subscribe to Battery Degradation Diagnostics
    this.unsubBatt = BatteryService.subscribe((batt) => {
      if (this.eventCallback) {
        if (batt.batteryLevel <= 15 || batt.lowPowerMode) {
          this.eventCallback({
            eventType: "CRITICAL_BATTERY_DEGRADATION",
            timestamp: new Date(batt.timestamp || Date.now()).toISOString(),
            source: "BATTERY_MONITOR",
            confidence: 1.0,
            rawValues: { batteryLevel: batt.batteryLevel, isCharging: batt.isCharging, lowPower: batt.lowPowerMode }
          });
        }
      }
    });

    // 4. Subscribe to Network Blackout Detection
    this.unsubNet = NetworkService.subscribe((net) => {
      if (this.eventCallback && (!net.isConnected || !net.isInternetReachable)) {
        this.eventCallback({
          eventType: "CONNECTIVITY_LOST_INTERNET",
          timestamp: new Date(net.timestamp || Date.now()).toISOString(),
          source: "NETWORK_STATE",
          confidence: 1.0,
          rawValues: { networkType: net.networkType, isAirplaneMode: net.isAirplaneMode }
        });
      }
    });

    // Activate hardware loops
    AccelerometerService.start();
    GyroscopeService.start();
    LocationService.startTracking(true);
  }

  public stopMonitoring(): void {
    if (this.unsubAccel) this.unsubAccel();
    if (this.unsubGyro) this.unsubGyro();
    if (this.unsubLoc) this.unsubLoc();
    if (this.unsubBatt) this.unsubBatt();
    if (this.unsubNet) this.unsubNet();
    if (this.unsubMotion) this.unsubMotion();
    if (this.unsubFall) this.unsubFall();

    AccelerometerService.stop();
    GyroscopeService.stop();
    LocationService.stopTracking();
    FallDetector.stop();
    MotionDetector.stop();
    NotificationService.cancelCountdown();

    this.isProviderRunning = false;
    this.eventCallback = null;
    console.log(`[HardwareSensorProvider] All physical sensor subscriptions safely terminated.`);
  }

  public isMonitoring(): boolean {
    return this.isProviderRunning;
  }

  /**
   * Returns current composite telemetry payload directly into Phase 1.5 PacketBuilder
   */
  public async getSnapshot(): Promise<{
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    accuracy: number;
    batteryPercentage: number;
    isCharging: boolean;
    networkStatus: string;
  }> {
    const loc = await LocationService.getLatestLocation();
    const batt = BatteryService.getLatestReading();
    const net = NetworkService.getLatestReading();

    return {
      latitude: loc.latitude,
      longitude: loc.longitude,
      altitude: loc.altitude,
      speed: loc.speed,
      heading: loc.heading,
      accuracy: loc.accuracy,
      batteryPercentage: batt.batteryLevel,
      isCharging: batt.isCharging,
      networkStatus: net.isConnected ? (net.isInternetReachable ? "ONLINE" : "OFFLINE_LOCAL") : "OFFLINE"
    };
  }

  /**
   * Diagnostic simulation ingestion allowing automated evaluations of physical events without moving the physical handset.
   */
  public simulateHardwareTrigger(event: SensorEvent): void {
    if (this.eventCallback) {
      console.log(`[HardwareSensorProvider] Injecting simulated hardware event trigger: ${event.eventType}`);
      this.eventCallback(event);
    }
  }
}

export const RealHardwareSensorProvider = new HardwareSensorProvider();
