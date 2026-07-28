import { EmergencyPacket } from "../../types/packet";
import { DeliveryReceiptManager } from "./DeliveryReceiptManager";
import { CommunicationLogger } from "./CommunicationLogger";

/**
 * Exponential Retry Scheduler
 * 
 * Rigorous backoff sequence (in seconds): 5, 15, 30, 60, 120 (2m), 300 (5m), 600 (10m), 1800 (30m).
 * Stop retrying when: Packet expires, TTL reaches zero, or Packet is acknowledged.
 */
const RETRY_DELAY_SECONDS = [5, 15, 30, 60, 120, 300, 600, 1800];

export class RetryScheduler {
  private scheduledRetries: Map<string, { packet: EmergencyPacket; nextAttemptTimestamp: number }> = new Map();

  constructor(
    private receiptManager: DeliveryReceiptManager,
    private logger: CommunicationLogger
  ) {}

  public getRetryDelaySeconds(retryCount: number): number {
    const index = Math.min(Math.max(0, retryCount - 1), RETRY_DELAY_SECONDS.length - 1);
    return RETRY_DELAY_SECONDS[index];
  }

  public scheduleRetry(packet: EmergencyPacket, gatewayId: string = "NONE"): boolean {
    const receipt = this.receiptManager.getReceipt(packet.header.packetId);
    if (!receipt) return false;

    // STOP CONDITION 1: Packet already Acknowledged
    if (receipt.status === "ACKNOWLEDGED") {
      this.logger.log(packet.header.packetId, receipt.communicationMethod, "LOCAL_NODE", gatewayId, "RETRY_HALTED_ACK", "SUCCESS", 0);
      return false;
    }

    // STOP CONDITION 2: TTL reaches zero or below
    if (packet.header.ttl <= 0) {
      this.receiptManager.updateStatus(packet.header.packetId, "EXPIRED", undefined, undefined, "TTL exhausted to 0");
      this.logger.log(packet.header.packetId, receipt.communicationMethod, "LOCAL_NODE", gatewayId, "RETRY_HALTED_TTL_ZERO", "FAILURE", 0);
      this.scheduledRetries.delete(packet.header.packetId);
      return false;
    }

    // STOP CONDITION 3: Packet expired (e.g., older than 24 hours)
    const pktTime = new Date(packet.header.timestamp).getTime();
    if (Date.now() - pktTime > 24 * 3600 * 1000) {
      this.receiptManager.updateStatus(packet.header.packetId, "EXPIRED", undefined, undefined, "Packet maximum age expired (>24h)");
      this.logger.log(packet.header.packetId, receipt.communicationMethod, "LOCAL_NODE", gatewayId, "RETRY_HALTED_EXPIRED", "FAILURE", 0);
      this.scheduledRetries.delete(packet.header.packetId);
      return false;
    }

    const delaySec = this.getRetryDelaySeconds(receipt.retryCount + 1);
    const nextTimestamp = Date.now() + delaySec * 1000;

    // Decrement TTL on scheduled re-attempt
    packet.header.ttl = Math.max(0, packet.header.ttl - 1);

    this.scheduledRetries.set(packet.header.packetId, { packet, nextAttemptTimestamp: nextTimestamp });
    this.receiptManager.updateStatus(packet.header.packetId, "QUEUED");
    
    this.logger.log(
      packet.header.packetId,
      receipt.communicationMethod,
      "LOCAL_NODE",
      gatewayId,
      `SCHEDULED_RETRY_${delaySec}s`,
      "PENDING",
      5
    );

    return true;
  }

  public getPendingRetries(): Array<{ packet: EmergencyPacket; nextAttemptTimestamp: number }> {
    return Array.from(this.scheduledRetries.values());
  }

  public clearScheduledRetry(packetId: string): void {
    this.scheduledRetries.delete(packetId);
  }

  public clearAll(): void {
    this.scheduledRetries.clear();
  }
}
