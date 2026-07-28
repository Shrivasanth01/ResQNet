import { EmergencyPacket } from "../../types/packet";
import { IDispatcher, CommunicationMethod, NetworkState } from "./CommunicationTypes";
import { RouteSelector } from "./RouteSelector";
import { DeliveryReceiptManager } from "./DeliveryReceiptManager";
import { CommunicationLogger } from "./CommunicationLogger";
import { RetryScheduler } from "./RetryScheduler";
import { GatewayManager } from "./GatewayManager";
import {
  InternetDispatcher,
  BluetoothDispatcher,
  WifiDispatcher,
  SmsDispatcher,
  SatelliteDispatcher,
  OfflineDispatcher,
} from "./PacketDispatcher";

/**
 * Master Delivery Manager (Dependency Inversion Architecture)
 * Orchestrates duplicate suppression, route prioritization, dispatcher evaluation, and lifecycle state tracking.
 */
export class DeliveryManager {
  private dispatchers: Map<CommunicationMethod, IDispatcher> = new Map();
  private seenPacketIds: Set<string> = new Set();

  constructor(
    private routeSelector: RouteSelector,
    private receiptManager: DeliveryReceiptManager,
    private logger: CommunicationLogger,
    private retryScheduler: RetryScheduler,
    private gatewayManager: GatewayManager
  ) {
    // Register standard dispatchers
    this.registerDispatcher(new InternetDispatcher());
    this.registerDispatcher(new BluetoothDispatcher());
    this.registerDispatcher(new WifiDispatcher());
    this.registerDispatcher(new SmsDispatcher());
    this.registerDispatcher(new SatelliteDispatcher());
    this.registerDispatcher(new OfflineDispatcher());
  }

  public registerDispatcher(dispatcher: IDispatcher): void {
    this.dispatchers.set(dispatcher.getMethodName(), dispatcher);
  }

  public getDispatcher(method: CommunicationMethod): IDispatcher | undefined {
    return this.dispatchers.get(method);
  }

  /**
   * Primary packet ingestion hook for Communication Engine
   */
  public async deliver(packet: EmergencyPacket, networkState: NetworkState): Promise<{ success: boolean; method: CommunicationMethod; receiptId: string }> {
    const packetId = packet.header.packetId;

    // 1. DUPLICATE SUPPRESSION CHECK
    if (this.seenPacketIds.has(packetId)) {
      this.logger.log(packetId, "OFFLINE_QUEUE", "LOCAL_NODE", "NONE", "SUPPRESS_DUPLICATE", "SUPPRESSED", 1);
      const existingReceipt = this.receiptManager.getReceipt(packetId);
      return {
        success: false,
        method: existingReceipt ? existingReceipt.communicationMethod : "OFFLINE_QUEUE",
        receiptId: existingReceipt ? existingReceipt.receiptId : "DUP_SUPPRESSED",
      };
    }

    this.seenPacketIds.add(packetId);

    // 2. INITIALIZE LIFECYCLE RECEIPT
    const selectedMethod = this.routeSelector.selectBestRoute(networkState);
    const receipt = this.receiptManager.createReceipt(packetId, selectedMethod, "LOCAL_NODE_01");
    
    this.receiptManager.updateStatus(packetId, "QUEUED", selectedMethod);
    this.logger.log(packetId, selectedMethod, "LOCAL_NODE_01", "NONE", "LIFECYCLE_QUEUED", "PENDING", 2);

    // 3. ATTEMPT PRIMARY ROUTE DISPATCH
    const dispatcher = this.dispatchers.get(selectedMethod) || this.dispatchers.get("OFFLINE_QUEUE")!;
    const activeGateway = this.gatewayManager.getActiveGateway();
    const gatewayId = activeGateway ? activeGateway.gatewayId : "NONE";

    this.receiptManager.updateStatus(packetId, "DISPATCHING", selectedMethod, gatewayId);
    const startTime = Date.now();

    try {
      if (!dispatcher.isAvailable(networkState) && selectedMethod !== "OFFLINE_QUEUE") {
        throw new Error(`Carrier ${selectedMethod} unavailable due to quality score or radio off.`);
      }

      const success = await dispatcher.dispatch(packet, gatewayId);
      const latency = Date.now() - startTime + 5;

      if (success) {
        if (selectedMethod === "INTERNET") {
          this.receiptManager.updateStatus(packetId, "UPLOADED", selectedMethod, gatewayId);
          this.receiptManager.updateStatus(packetId, "ACKNOWLEDGED", selectedMethod, gatewayId);
          this.logger.log(packetId, selectedMethod, "LOCAL_NODE_01", gatewayId, "FASTAPI_CLOUD_ACK", "SUCCESS", latency);
        } else if (selectedMethod === "OFFLINE_QUEUE") {
          this.receiptManager.updateStatus(packetId, "QUEUED", selectedMethod, gatewayId);
          this.logger.log(packetId, selectedMethod, "LOCAL_NODE_01", gatewayId, "OFFLINE_STORED", "SUCCESS", latency);
        } else {
          this.receiptManager.updateStatus(packetId, "RELAYED", selectedMethod, gatewayId);
          if (activeGateway) {
            this.receiptManager.updateStatus(packetId, "GATEWAY_FOUND", selectedMethod, gatewayId);
          }
          this.logger.log(packetId, selectedMethod, "LOCAL_NODE_01", gatewayId, `WIRELESS_${selectedMethod}_RELAYED`, "SUCCESS", latency);
        }
        this.retryScheduler.clearScheduledRetry(packetId);
        return { success: true, method: selectedMethod, receiptId: receipt.receiptId };
      } else {
        throw new Error("Dispatcher returned false status.");
      }
    } catch (err: any) {
      const latency = Date.now() - startTime + 5;
      this.receiptManager.updateStatus(packetId, "FAILED", selectedMethod, gatewayId, err.message || "Dispatch failed");
      this.logger.log(packetId, selectedMethod, "LOCAL_NODE_01", gatewayId, "DISPATCH_FAILED", "FAILURE", latency);

      // Trigger exponential retry sequence
      this.retryScheduler.scheduleRetry(packet, gatewayId);

      return { success: false, method: selectedMethod, receiptId: receipt.receiptId };
    }
  }

  public isDuplicate(packetId: string): boolean {
    return this.seenPacketIds.has(packetId);
  }

  public clearDuplicates(): void {
    this.seenPacketIds.clear();
  }
}
