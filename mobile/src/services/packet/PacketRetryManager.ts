import { EmergencyPacket, RetryPolicy, DeliveryStatus } from "../../types/packet";
import { PacketStorage } from "./PacketStorage";
import { PacketQueue } from "./PacketQueue";

export interface RetryManagerContract {
  recordAttempt(packetId: string, success: boolean, gatewayNodeId?: string): Promise<EmergencyPacket | null>;
  calculateNextDelayMs(retryCount: number): number;
  processPendingRetries(): Promise<number>;
  getPolicy(): RetryPolicy;
  setPolicy(customPolicy: Partial<RetryPolicy>): void;
}

let activePolicy: RetryPolicy = {
  maxRetries: 5,
  baseDelayMs: 2000, // Start with 2 second backoff
  maxDelayMs: 60000, // Max cap of 60 seconds between retries
  backoffMultiplier: 1.5,
};

/**
 * Exponential Backoff & TTL Degradation Retry Manager
 * 
 * Regulates outbound transmission pacing to prevent RF collision and radio flood storms during
 * multi-user disaster scenarios. Seamlessly interfaces with future BLE GATT acknowledgments and
 * FastAPI cloud gateway endpoints.
 */
export const PacketRetryManager: RetryManagerContract = {
  getPolicy: (): RetryPolicy => ({ ...activePolicy }),

  setPolicy: (customPolicy: Partial<RetryPolicy>): void => {
    activePolicy = { ...activePolicy, ...customPolicy };
  },

  /**
   * Computes jittered exponential backoff delay to randomize radio transmission spikes
   */
  calculateNextDelayMs: (retryCount: number): number => {
    const power = Math.min(retryCount, 10);
    const exponential = activePolicy.baseDelayMs * Math.pow(activePolicy.backoffMultiplier, power);
    const jitter = Math.random() * 500; // 0-500ms randomization
    return Math.min(activePolicy.maxDelayMs, Math.round(exponential + jitter));
  },

  /**
   * Updates state machine upon ACK arrival or hardware transmission timeout
   */
  recordAttempt: async (packetId: string, success: boolean, gatewayNodeId?: string): Promise<EmergencyPacket | null> => {
    const packet = await PacketStorage.getPacketById(packetId);
    if (!packet) return null;

    const now = new Date().toISOString();
    const newCount = packet.mesh.retryCount + 1;

    if (success) {
      const delivered: EmergencyPacket = {
        ...packet,
        header: { ...packet.header, hopCount: packet.header.hopCount + 1 },
        mesh: {
          ...packet.mesh,
          deliveryStatus: gatewayNodeId ? "DELIVERED_TO_GATEWAY" : "RELAYED",
          gatewayNode: gatewayNodeId || packet.mesh.gatewayNode,
          retryCount: newCount,
          lastAttemptTimestamp: now,
        }
      };
      await PacketStorage.savePacket(delivered);
      // Remove from active outbound queue once delivered
      await PacketQueue.removeById(packetId);
      return delivered;
    } else {
      // Handle transmission failure and check retry budget or TTL exhaustion
      const remainingTtl = Math.max(0, packet.header.ttl - 1);
      let newStatus: DeliveryStatus = "QUEUED";

      if (newCount >= activePolicy.maxRetries || remainingTtl <= 0) {
        newStatus = "FAILED_EXHAUSTED";
      }

      const failed: EmergencyPacket = {
        ...packet,
        header: { ...packet.header, ttl: remainingTtl },
        mesh: {
          ...packet.mesh,
          deliveryStatus: newStatus,
          retryCount: newCount,
          lastAttemptTimestamp: now,
        }
      };

      await PacketStorage.savePacket(failed);
      
      if (newStatus === "FAILED_EXHAUSTED") {
        await PacketQueue.removeById(packetId);
      } else {
        // Re-enqueue with updated retry metadata
        await PacketQueue.enqueue(failed);
      }

      return failed;
    }
  },

  /**
   * Inspects storage for pending retries whose exponential backoff windows have elapsed
   * Returns count of packets readied for broadcast attempt
   */
  processPendingRetries: async (): Promise<number> => {
    const all = await PacketStorage.getAllPackets();
    const now = Date.now();
    let readyCount = 0;

    for (const pkt of all) {
      if (pkt.mesh.deliveryStatus === "QUEUED" && pkt.mesh.lastAttemptTimestamp) {
        const lastAttempt = new Date(pkt.mesh.lastAttemptTimestamp).getTime();
        const requiredDelay = PacketRetryManager.calculateNextDelayMs(pkt.mesh.retryCount);
        if (now - lastAttempt >= requiredDelay) {
          readyCount++;
        }
      } else if (pkt.mesh.deliveryStatus === "QUEUED" && !pkt.mesh.lastAttemptTimestamp) {
        readyCount++; // Brand new packet ready immediately
      }
    }
    return readyCount;
  }
};
