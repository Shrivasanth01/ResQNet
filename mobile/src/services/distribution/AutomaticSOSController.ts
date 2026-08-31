import { EmergencyPacket } from "../../types/packet";
import {
  SOSDistributionStep,
  SOSProgressEvent,
  SOSProgressListener,
  SOSDistributionResult,
  MeshParticipatingDevice,
} from "./types";
import { ExistingRSEPManager } from "./ExistingRSEPManager";
import { DeviceDiscoveryManager } from "./DeviceDiscoveryManager";
import { AutomaticConnectionManager } from "./ConnectionManager";
import { RSEPTransferManager } from "./RSEPTransferManager";
import { AutomaticRelayManager } from "./RelayManager";
import { InternetGatewayManager } from "./InternetGatewayManager";
import { EmergencyDispatchService } from "../emergency/EmergencyDispatchService";

/**
 * MODULE 2: SOS CONTROLLER (AUTOMATIC SOS DISTRIBUTION SYSTEM)
 * 
 * CORE REQUIREMENT ENFORCEMENT:
 * - The user performs ONLY ONE ACTION: Press SOS.
 * - Everything else happens 100% AUTOMATICALLY.
 * - No selecting RSEP file.
 * - No selecting Bluetooth or Wi-Fi.
 * - No selecting nearby devices.
 * - No pressing Connect or Send.
 * - No manual forwarding.
 * - Emits real-time progress events for visual feedback.
 */
export class AutomaticSOSController {
  private static listeners: SOSProgressListener[] = [];
  private static currentStep: SOSDistributionStep = "IDLE";
  private static activeHistory: SOSProgressEvent[] = [];
  private static isRunning: boolean = false;

  /**
   * Subscribes to real-time progress events from the automatic distribution engine.
   */
  public static addProgressListener(listener: SOSProgressListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public static getHistory(): SOSProgressEvent[] {
    return [...this.activeHistory];
  }

  public static getCurrentStep(): SOSDistributionStep {
    return this.currentStep;
  }

  /**
   * MASTER SINGLE-CLICK ENTRYPOINT:
   * Called when user presses or holds the SOS button.
   * Executes the entire automated distribution pipeline without any user interaction.
   */
  public static async triggerAutomaticSOS(): Promise<SOSDistributionResult> {
    if (this.isRunning) {
      console.warn("[AutomaticSOSController] SOS Distribution already running.");
    }
    this.isRunning = true;
    this.activeHistory = [];

    const myNodeId = DeviceDiscoveryManager.getMyNodeId();
    const relayChain: string[] = [myNodeId];

    console.log("==================================================");
    console.log("🚨 AUTOMATIC SOS DISTRIBUTION SYSTEM ACTIVATED");
    console.log("==================================================");

    // STEP 1: SOS ACTIVATED
    this.emitProgress({
      step: "SOS_ACTIVATED",
      message: "🚨 SOS ACTIVATED: Emergency broadcast initiated.",
      packetId: "INITIALIZING",
      hopCount: 0,
      ttl: 5,
      currentNodeId: myNodeId,
      timestamp: new Date().toISOString(),
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // STEP 2: LOAD EXISTING RSEP FILE (Zero user selection, zero regeneration)
    const existingRSEP = await ExistingRSEPManager.getExistingRSEP();
    const packetId = existingRSEP.header.packetId;
    const initialTtl = existingRSEP.header.ttl || 5;

    this.emitProgress({
      step: "RSEP_FOUND",
      message: `📄 EXISTING RSEP FOUND: Packet ID ${packetId} loaded from secure vault.`,
      packetId,
      hopCount: 0,
      ttl: initialTtl,
      currentNodeId: myNodeId,
      timestamp: new Date().toISOString(),
    });

    await new Promise((resolve) => setTimeout(resolve, 400));

    // Dispatch background emergency email & phone call in parallel
    EmergencyDispatchService.dispatchToEmergencyContacts().catch(() => {});

    // STEP 3: AUTOMATICALLY SEARCH FOR NEARBY PARTICIPATING DEVICES
    this.emitProgress({
      step: "SEARCHING_FOR_NEARBY_DEVICES",
      message: "📡 SEARCHING FOR NEARBY PARTICIPATING DEVICES (BLE & Wi-Fi Direct)...",
      packetId,
      hopCount: 0,
      ttl: initialTtl,
      currentNodeId: myNodeId,
      timestamp: new Date().toISOString(),
    });

    const nearbyDevices = await DeviceDiscoveryManager.discoverNearbyDevices();

    if (nearbyDevices.length === 0) {
      console.log("[AutomaticSOSController] No immediate RF neighbors. Checking local Internet Gateway...");
    }

    // STEP 4: CHECK IF LOCAL DEVICE IS INTERNET GATEWAY
    const localInternet = await InternetGatewayManager.isInternetAvailable();
    if (localInternet) {
      this.emitProgress({
        step: "INTERNET_GATEWAY_FOUND",
        message: "🌐 INTERNET GATEWAY FOUND on local node. Uploading RSEP to Emergency Server...",
        packetId,
        hopCount: 1,
        ttl: initialTtl,
        currentNodeId: myNodeId,
        isGateway: true,
        gatewayNodeId: myNodeId,
        timestamp: new Date().toISOString(),
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const delivery = await InternetGatewayManager.ingestAndDeliverRSEP(existingRSEP, myNodeId);

      this.emitProgress({
        step: "SOS_DELIVERED",
        message: `✅ SOS DELIVERED TO EMERGENCY SERVER! Incident ID: ${delivery.response.incidentId}`,
        packetId,
        hopCount: 1,
        ttl: initialTtl,
        currentNodeId: myNodeId,
        isGateway: true,
        gatewayNodeId: myNodeId,
        deliveredAt: delivery.response.serverTimestamp,
        timestamp: new Date().toISOString(),
      });

      this.isRunning = false;
      return {
        success: true,
        packetId,
        hops: 1,
        deliveredToGateway: true,
        gatewayNodeId: myNodeId,
        relayChain,
        history: this.activeHistory,
      };
    }

    // STEP 5: AUTOMATIC MULTI-HOP DISTRIBUTION OVER NEARBY DEVICES
    // Device A (Nearby Peer) ➔ Device B (Mesh Relay) ➔ Device C (Internet Gateway) ➔ Emergency Server
    let currentPacket = existingRSEP;
    let deliveredToGateway = false;
    let gatewayNodeId: string | undefined;

    for (let i = 0; i < nearbyDevices.length; i++) {
      const device = nearbyDevices[i];
      relayChain.push(device.deviceId);

      // STEP 5A: DEVICE FOUND
      this.emitProgress({
        step: i === 0 ? "DEVICE_FOUND" : "ANOTHER_DEVICE_FOUND",
        message: `📲 ${i === 0 ? "DEVICE FOUND" : "ANOTHER DEVICE FOUND"}: ${device.name} (${device.transport} • RSSI ${device.rssi}dBm)`,
        packetId,
        hopCount: i + 1,
        ttl: currentPacket.header.ttl,
        currentNodeId: myNodeId,
        targetDeviceId: device.deviceId,
        targetDeviceName: device.name,
        transport: device.transport,
        isGateway: device.isInternetGateway,
        timestamp: new Date().toISOString(),
      });

      await new Promise((resolve) => setTimeout(resolve, 400));

      // STEP 5B: AUTOMATICALLY CONNECT & TRANSFER EXISTING RSEP
      const transfer = await RSEPTransferManager.transferRSEP(currentPacket, device);

      if (transfer.success) {
        this.emitProgress({
          step: "RSEP_TRANSFERRED",
          message: `⚡ RSEP TRANSFERRED to ${device.name} via ${device.transport} (${transfer.bytesTransferred} bytes).`,
          packetId,
          hopCount: i + 1,
          ttl: currentPacket.header.ttl,
          currentNodeId: myNodeId,
          targetDeviceId: device.deviceId,
          targetDeviceName: device.name,
          transport: device.transport,
          timestamp: new Date().toISOString(),
        });

        await new Promise((resolve) => setTimeout(resolve, 400));

        // STEP 5C: AUTOMATIC RELAY THROUGH MESH NODE
        this.emitProgress({
          step: "RELAYING",
          message: `🔁 RELAYING: ${device.name} automatically forwarding RSEP through emergency mesh...`,
          packetId,
          hopCount: i + 1,
          ttl: Math.max(0, currentPacket.header.ttl - 1),
          currentNodeId: device.deviceId,
          timestamp: new Date().toISOString(),
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        // STEP 5D: CHECK IF TARGET NODE IS AN INTERNET GATEWAY
        if (device.isInternetGateway) {
          deliveredToGateway = true;
          gatewayNodeId = device.deviceId;

          this.emitProgress({
            step: "INTERNET_GATEWAY_FOUND",
            message: `🌐 INTERNET GATEWAY FOUND: ${device.name} connected to cloud. Uploading to Emergency Server...`,
            packetId,
            hopCount: i + 1,
            ttl: Math.max(0, currentPacket.header.ttl - 1),
            currentNodeId: device.deviceId,
            targetDeviceId: device.deviceId,
            targetDeviceName: device.name,
            isGateway: true,
            gatewayNodeId: device.deviceId,
            timestamp: new Date().toISOString(),
          });

          await new Promise((resolve) => setTimeout(resolve, 500));

          const delivery = await InternetGatewayManager.ingestAndDeliverRSEP(currentPacket, device.deviceId);

          this.emitProgress({
            step: "SOS_DELIVERED",
            message: `✅ SOS DELIVERED TO EMERGENCY SERVER via ${device.name}! Incident ID: ${delivery.response.incidentId}`,
            packetId,
            hopCount: i + 1,
            ttl: Math.max(0, currentPacket.header.ttl - 1),
            currentNodeId: device.deviceId,
            isGateway: true,
            gatewayNodeId: device.deviceId,
            deliveredAt: delivery.response.serverTimestamp,
            timestamp: new Date().toISOString(),
          });

          break; // Stop further relaying once delivered to gateway!
        }
      }
    }

    this.isRunning = false;
    return {
      success: true,
      packetId,
      hops: relayChain.length - 1,
      deliveredToGateway,
      gatewayNodeId,
      relayChain,
      history: this.activeHistory,
    };
  }

  private static emitProgress(event: SOSProgressEvent): void {
    this.currentStep = event.step;
    this.activeHistory.push(event);
    console.log(`[AutomaticSOSController] [${event.step}] ${event.message}`);
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.warn("[AutomaticSOSController] Listener notification error:", err);
      }
    }
  }
}
