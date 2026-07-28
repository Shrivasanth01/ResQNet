import { PermissionManager, PermissionStatusSummary } from "./PermissionManager";
import { AccelerometerService } from "./AccelerometerService";
import { GyroscopeService } from "./GyroscopeService";
import { LocationService, HardwareLocationTelemetry } from "./LocationService";
import { BatteryService, HardwareBatteryTelemetry } from "./BatteryService";
import { NetworkService, HardwareNetworkTelemetry } from "./NetworkService";
import { MotionDetector, MotionSummary } from "./MotionDetector";
import { FallDetector, FallDetectionEvent } from "./FallDetector";
import { BackgroundTaskManager } from "./BackgroundTaskManager";
import { NotificationService } from "./NotificationService";
import { RealHardwareSensorProvider, HardwareSensorProvider } from "./HardwareSensorProvider";

export interface HardwareDiagnosticsReport {
  permissions: PermissionStatusSummary;
  location: HardwareLocationTelemetry;
  battery: HardwareBatteryTelemetry;
  network: HardwareNetworkTelemetry;
  motion: MotionSummary;
  isBackgroundRegistered: boolean;
}

/**
 * ResQNet Master Hardware Management Facade
 * 
 * DESIGN PRINCIPLE:
 * Unifies sensor initialization, background task orchestration, and exhaustive diagnostic simulation suites
 * verifying walking, running, drops, vehicle transit, stationary, GPS loss, battery saver, and airplane mode!
 */
class HardwareManagerService {
  private isInitialized: boolean = false;
  public readonly sensorProvider: HardwareSensorProvider = RealHardwareSensorProvider;

  public async initialize(): Promise<HardwareDiagnosticsReport> {
    if (this.isInitialized) {
      return this.getDiagnostics();
    }

    console.log("[HardwareManager] Initializing ResQNet Phase 6 Physical Hardware Architecture...");
    
    // 1. Authorize hardware permissions
    await PermissionManager.checkAllPermissions();

    // 2. Hydrate diagnostic hardware services
    await BatteryService.initialize();
    await NetworkService.initialize();
    await LocationService.getLatestLocation();

    // 3. Register OS background location tracking
    await BackgroundTaskManager.startBackgroundTracking();

    this.isInitialized = true;
    console.log("[HardwareManager] Hardware sensors operational and ready for Phase 2A Intelligence intake.");
    return this.getDiagnostics();
  }

  public async getDiagnostics(): Promise<HardwareDiagnosticsReport> {
    const permissions = PermissionManager.getStatus();
    const location = await LocationService.getLatestLocation();
    const battery = BatteryService.getLatestReading();
    const network = NetworkService.getLatestReading();
    const motion = MotionDetector.getLatestSummary();
    const isBackgroundRegistered = await BackgroundTaskManager.checkTaskRegistration();

    return {
      permissions,
      location,
      battery,
      network,
      motion,
      isBackgroundRegistered
    };
  }

  public shutdown(): void {
    RealHardwareSensorProvider.stopMonitoring();
    BatteryService.stop();
    NetworkService.stop();
    BackgroundTaskManager.stopBackgroundTracking();
    this.isInitialized = false;
    console.log("[HardwareManager] Hardware services safely terminated.");
  }

  // ============================================================================
  // COMPREHENSIVE HARDWARE DIAGNOSTIC SIMULATION SUITE
  // ============================================================================

  public async runFullSimulationVerification(): Promise<{
    walking: boolean;
    running: boolean;
    phoneDrop: boolean;
    vehicleTravel: boolean;
    stationary: boolean;
    gpsLoss: boolean;
    batterySaver: boolean;
    airplaneMode: boolean;
    allTestsPassed: boolean;
  }> {
    console.log("[HardwareManager] ========== COMMENCING COMPLETE PHASE 6 HARDWARE VERIFICATION SUITE ==========");

    // 1. Test Real Walking
    MotionDetector.simulateActivity("WALKING", 1.35);
    const walking = MotionDetector.getLatestSummary().activity === "WALKING";
    console.log(`[Simulation 1] Real Walking Cadence Recognition: ${walking ? "SUCCESS" : "FAIL"}`);

    // 2. Test Running
    MotionDetector.simulateActivity("RUNNING", 2.15);
    const running = MotionDetector.getLatestSummary().activity === "RUNNING";
    console.log(`[Simulation 2] Running Kinetic Oscillation Recognition: ${running ? "SUCCESS" : "FAIL"}`);

    // 3. Test Severe Phone Drop (3-Stage Fall verification)
    let dropTriggered = false;
    const unsubFall = FallDetector.subscribe((evt) => {
      if (evt.fallDetected && evt.isConfirmedByStillness) dropTriggered = true;
    });
    FallDetector.simulateFallEvent(3.9, 195.0, true);
    unsubFall();
    const phoneDrop = dropTriggered;
    console.log(`[Simulation 3] Severe Phone Drop & Post-Impact Immobility: ${phoneDrop ? "SUCCESS" : "FAIL"}`);

    // 4. Test Vehicle Travel (> 7 m/s ground speed)
    LocationService.simulateLocation(37.7800, -122.4100, 18.5); // 66 km/h
    MotionDetector.simulateActivity("VEHICLE_TRAVEL", 1.1);
    const vehicleTravel = MotionDetector.getLatestSummary().activity === "VEHICLE_TRAVEL";
    console.log(`[Simulation 4] High-Speed Vehicular Transit Classification: ${vehicleTravel ? "SUCCESS" : "FAIL"}`);

    // 5. Test Stationary Stillness
    MotionDetector.simulateActivity("STATIONARY", 1.0);
    const stationary = MotionDetector.getLatestSummary().activity === "STATIONARY";
    console.log(`[Simulation 5] Stationary Inactivity Recognition: ${stationary ? "SUCCESS" : "FAIL"}`);

    // 6. Test GPS Loss (Simulated Fallback coordinate trigger)
    LocationService.simulateLocation(37.7749, -122.4194, 0.0, 0.0);
    const gpsLoss = (await LocationService.getLatestLocation()).isSimulatedFallback === true;
    console.log(`[Simulation 6] Underground / Bunker GPS Loss Fallback: ${gpsLoss ? "SUCCESS" : "FAIL"}`);

    // 7. Test Battery Saver Mode & Power Degradation
    BatteryService.simulateBattery(12, false, true);
    const batt = BatteryService.getLatestReading();
    const batterySaver = batt.lowPowerMode === true && batt.batteryLevel === 12;
    console.log(`[Simulation 7] Low Power Battery Saver Mode Diagnostics: ${batterySaver ? "SUCCESS" : "FAIL"}`);

    // 8. Test Airplane Mode & Cellular Blackout
    NetworkService.simulateNetwork(false, false, "NONE", true);
    const net = NetworkService.getLatestReading();
    const airplaneMode = net.isAirplaneMode === true && net.isInternetReachable === false;
    console.log(`[Simulation 8] Airplane Mode Radio Severance Recognition: ${airplaneMode ? "SUCCESS" : "FAIL"}`);

    const allTestsPassed = walking && running && phoneDrop && vehicleTravel && stationary && gpsLoss && batterySaver && airplaneMode;
    console.log(`[HardwareManager] ========== HARDWARE VERIFICATION SUITE COMPLETE [ALL PASSED: ${allTestsPassed}] ==========`);

    // Revert to standby operational states
    BatteryService.simulateBattery(92, false, false);
    NetworkService.simulateNetwork(true, true, "WIFI", false);

    return {
      walking,
      running,
      phoneDrop,
      vehicleTravel,
      stationary,
      gpsLoss,
      batterySaver,
      airplaneMode,
      allTestsPassed
    };
  }
}

export const HardwareManager = new HardwareManagerService();
