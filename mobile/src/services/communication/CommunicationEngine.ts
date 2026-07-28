import { EmergencyPacket } from "../../types/packet";
import { CommunicationMethod, NetworkState, DeliveryReceipt, CommunicationLogEvent } from "./CommunicationTypes";
import { NetworkMonitor } from "./NetworkMonitor";
import { RouteSelector } from "./RouteSelector";
import { GatewayManager, GatewayNodeInfo } from "./GatewayManager";
import { CommunicationLogger } from "./CommunicationLogger";
import { DeliveryReceiptManager } from "./DeliveryReceiptManager";
import { RetryScheduler } from "./RetryScheduler";
import { DeliveryManager } from "./DeliveryManager";
import { PacketCompressor } from "./PacketCompressor";
import { PacketChunker } from "./PacketChunker";

/**
 * Phase 2.75: ResQNet Central Communication Engine (Master Brain)
 * 
 * DESIGN PRINCIPLE:
 * Strictly decouples packet generation from delivery logistics. Determines HOW and WHERE packets
 * should travel while providing an exhaustive simulation verification suite.
 */
export class CommunicationEngineService {
  public readonly networkMonitor: NetworkMonitor;
  public readonly routeSelector: RouteSelector;
  public readonly gatewayManager: GatewayManager;
  public readonly logger: CommunicationLogger;
  public readonly receiptManager: DeliveryReceiptManager;
  public readonly retryScheduler: RetryScheduler;
  public readonly deliveryManager: DeliveryManager;
  public readonly compressor: PacketCompressor;
  public readonly chunker: PacketChunker;

  constructor() {
    this.networkMonitor = new NetworkMonitor();
    this.routeSelector = new RouteSelector();
    this.gatewayManager = new GatewayManager();
    this.logger = new CommunicationLogger();
    this.receiptManager = new DeliveryReceiptManager();
    this.retryScheduler = new RetryScheduler(this.receiptManager, this.logger);
    this.deliveryManager = new DeliveryManager(
      this.routeSelector,
      this.receiptManager,
      this.logger,
      this.retryScheduler,
      this.gatewayManager
    );
    this.compressor = new PacketCompressor();
    this.chunker = new PacketChunker();
  }

  public async deliverPacket(packet: EmergencyPacket): Promise<{ success: boolean; method: CommunicationMethod; receiptId: string }> {
    const currentState = this.networkMonitor.getNetworkState();
    return await this.deliveryManager.deliver(packet, currentState);
  }

  public getReceipt(packetId: string): DeliveryReceipt | null {
    return this.receiptManager.getReceipt(packetId);
  }

  public getLogs(packetId?: string): CommunicationLogEvent[] {
    return this.logger.getLogs(packetId);
  }

  public resetEngine(): void {
    this.receiptManager.clearReceipts();
    this.logger.clearLogs();
    this.retryScheduler.clearAll();
    this.deliveryManager.clearDuplicates();
  }

  // ============================================================================
  // COMPREHENSIVE SIMULATION SCENARIO TESTING SUITE
  // ============================================================================

  /**
   * 1. Internet Available Scenario (Expect INTERNET method & ACKNOWLEDGED status)
   */
  public async simulateInternetAvailable(samplePacket: EmergencyPacket): Promise<DeliveryReceipt | null> {
    this.resetEngine();
    this.networkMonitor.setNetworkState({ internetAvailable: true, networkQualityScore: 90 });
    await this.deliverPacket(samplePacket);
    return this.getReceipt(samplePacket.header.packetId);
  }

  /**
   * 2. Internet Lost Scenario (Expect fallthrough to BLUETOOTH_MESH or WIFI_DIRECT)
   */
  public async simulateInternetLost(samplePacket: EmergencyPacket): Promise<DeliveryReceipt | null> {
    this.resetEngine();
    this.networkMonitor.setNetworkState({ internetAvailable: false, bluetoothAvailable: true, batteryLevel: 75 });
    await this.deliverPacket(samplePacket);
    return this.getReceipt(samplePacket.header.packetId);
  }

  /**
   * 3. Gateway Discovered Scenario (Simulates edge mesh node connecting to cloud gateway)
   */
  public async simulateGatewayDiscovered(samplePacket: EmergencyPacket): Promise<{ receipt: DeliveryReceipt | null; gateway: GatewayNodeInfo | null }> {
    this.resetEngine();
    this.networkMonitor.setNetworkState({ internetAvailable: false, bluetoothAvailable: true });
    this.gatewayManager.registerGateway({
      gatewayId: "GW_SIM_FIELD_NODE_99",
      nodeName: "Emergency Command Vehicle Alpha",
      signalStrengthDbm: -42,
      supportsFastApiSync: true,
      discoveredAt: new Date().toISOString(),
    });
    await this.deliverPacket(samplePacket);
    return {
      receipt: this.getReceipt(samplePacket.header.packetId),
      gateway: this.gatewayManager.getActiveGateway(),
    };
  }

  /**
   * 4 & 5. Offline Mode & Packet Queued Scenario (Zero signal switches to OFFLINE_QUEUE)
   */
  public async simulateOfflineQueueing(samplePacket: EmergencyPacket): Promise<DeliveryReceipt | null> {
    this.resetEngine();
    this.networkMonitor.setNetworkState({
      internetAvailable: false,
      bluetoothAvailable: false,
      wifiAvailable: false,
      currentNetworkType: "NONE",
      gpsStatus: "UNAVAILABLE",
    });
    await this.deliverPacket(samplePacket);
    return this.getReceipt(samplePacket.header.packetId);
  }

  /**
   * 6. Packet Acknowledged Scenario (Verify stop retrying condition)
   */
  public async simulatePacketAcknowledged(samplePacket: EmergencyPacket): Promise<boolean> {
    this.resetEngine();
    this.networkMonitor.setNetworkState({ internetAvailable: true });
    await this.deliverPacket(samplePacket);
    // Try to schedule a retry after ACK - should immediately halt and return false
    return !this.retryScheduler.scheduleRetry(samplePacket);
  }

  /**
   * 7. Packet Expired / TTL Reached Zero Scenario
   */
  public async simulatePacketExpired(samplePacket: EmergencyPacket): Promise<DeliveryReceipt | null> {
    this.resetEngine();
    const exhaustedPacket = { ...samplePacket, header: { ...samplePacket.header, ttl: 0 } };
    this.receiptManager.createReceipt(exhaustedPacket.header.packetId, "BLUETOOTH_MESH");
    this.retryScheduler.scheduleRetry(exhaustedPacket);
    return this.getReceipt(exhaustedPacket.header.packetId);
  }

  /**
   * 8. Duplicate Packet Ignored (Suppressed) Scenario
   */
  public async simulateDuplicateSuppression(samplePacket: EmergencyPacket): Promise<{ firstTry: boolean; secondTry: boolean; logs: CommunicationLogEvent[] }> {
    this.resetEngine();
    this.networkMonitor.setNetworkState({ internetAvailable: true });
    const res1 = await this.deliverPacket(samplePacket);
    const res2 = await this.deliverPacket(samplePacket); // Duplicate blast
    return {
      firstTry: res1.success,
      secondTry: res2.success,
      logs: this.getLogs(samplePacket.header.packetId),
    };
  }

  /**
   * 9. Retry Schedule Sequence Scenario (Verifies 5s, 15s, 30s... intervals)
   */
  public simulateRetryScheduleVerification(): number[] {
    const sequence: number[] = [];
    for (let i = 1; i <= 8; i++) {
      sequence.push(this.retryScheduler.getRetryDelaySeconds(i));
    }
    return sequence; // Expected: [5, 15, 30, 60, 120, 300, 600, 1800]
  }
}

export const CommunicationEngine = new CommunicationEngineService();
