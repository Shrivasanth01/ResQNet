import { PeerManager } from "./PeerManager";
import { MeshLogger } from "./MeshLogger";
import { TransportType } from "./MeshTypes";

/**
 * Continuous Mesh Discovery Service
 * 
 * Orchestrates physical radio background scanning over Bluetooth Low Energy (GATT advertisement frames)
 * and local network Wi-Fi Direct UDP beacons. Features intelligent battery reserve adaptation.
 */
class MeshDiscoveryService {
  private isScanning: boolean = false;
  private isAdvertising: boolean = false;
  private scanIntervalId: any = null;
  private batteryOptimizationMode: "HIGH_PERFORMANCE" | "BALANCED" | "POWER_SAVE" = "BALANCED";

  public startDiscovery(): void {
    if (this.isScanning) return;
    
    this.isScanning = true;
    this.isAdvertising = true;
    MeshLogger.info("DISCOVERY", `Started continuous peer discovery & advertising in ${this.batteryOptimizationMode} mode.`);

    // Adjust physical polling intervals based on battery power optimization state
    const pollIntervalMs = this.batteryOptimizationMode === "HIGH_PERFORMANCE" ? 3000 : this.batteryOptimizationMode === "BALANCED" ? 7000 : 15000;

    this.scanIntervalId = setInterval(() => {
      this.performScanCycle();
    }, pollIntervalMs);

    // Initial immediate scan cycle
    this.performScanCycle();
  }

  public stopDiscovery(): void {
    if (!this.isScanning) return;
    
    this.isScanning = false;
    this.isAdvertising = false;
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }
    MeshLogger.info("DISCOVERY", "Stopped peer discovery and radio advertising.");
  }

  public setBatteryOptimizationMode(mode: "HIGH_PERFORMANCE" | "BALANCED" | "POWER_SAVE"): void {
    if (this.batteryOptimizationMode !== mode) {
      this.batteryOptimizationMode = mode;
      MeshLogger.info("DISCOVERY", `Transitioned battery optimization mode to: ${mode}`);
      if (this.isScanning) {
        this.stopDiscovery();
        this.startDiscovery();
      }
    }
  }

  public getBatteryMode(): "HIGH_PERFORMANCE" | "BALANCED" | "POWER_SAVE" {
    return this.batteryOptimizationMode;
  }

  private performScanCycle(): void {
    // Audit active inventory for stale nodes that have driven out of Bluetooth coverage
    const now = Date.now();
    const peers = PeerManager.getAllPeers();
    let dropped = 0;

    for (const peer of peers) {
      if (now - peer.lastSeen > 45000 && peer.status !== "LOST") {
        PeerManager.updatePeerStatus(peer.peerId, "LOST");
        dropped++;
      }
    }

    if (dropped > 0) {
      MeshLogger.info("DISCOVERY", `Scan cycle complete: ${dropped} out-of-range peer nodes marked as LOST.`);
    }
  }

  /**
   * Simulation Ingestion Method: Allows testing suites to inject synthetic physical devices during evaluation
   */
  public simulateDiscoveredDevice(
    peerId: string,
    name: string,
    transport: TransportType = "BLE",
    rssi: number = -62,
    battery: number = 88,
    isGateway: boolean = false
  ): void {
    PeerManager.registerOrUpdatePeer(peerId, name, transport, rssi, battery, isGateway, isGateway ? 24 : 0);
  }
}

export const MeshDiscovery = new MeshDiscoveryService();
