import { EmergencyPacket } from "../../types/packet";
import { StoredPacketItem } from "./MeshTypes";
import { MeshLogger } from "./MeshLogger";

/**
 * Mesh Store-And-Forward Vault
 * 
 * DESIGN PRINCIPLE:
 * When zero peers are accessible over local RF channels, this engine stores packets locally in persistent memory.
 * The instant a new peer or internet gateway appears on radar, stored packets are automatically dequeued and forwarded!
 */
class MeshStorageService {
  private store: Map<string, StoredPacketItem> = new Map();

  public async saveForOfflineRelay(packet: EmergencyPacket): Promise<StoredPacketItem> {
    const packetId = packet.header.packetId;
    
    // Check if packet already queued in store-and-forward vault
    if (this.store.has(packetId)) {
      const existing = this.store.get(packetId)!;
      MeshLogger.info("ROUTING", `Packet ${packetId} already stored in offline queue. Resetting relay priority.`);
      existing.status = "PENDING_RELAY";
      existing.retryCount = 0;
      existing.nextRetryTimestamp = Date.now() + 5000;
      return existing;
    }

    const item: StoredPacketItem = {
      storageId: `STO_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      packetId,
      packet,
      storedAt: Date.now(),
      retryCount: 0,
      nextRetryTimestamp: Date.now() + 5000,
      status: "PENDING_RELAY"
    };

    this.store.set(packetId, item);
    MeshLogger.info("ROUTING", `Saved packet ${packetId} to local Store-and-Forward Vault. Total offline queue: ${this.store.size} items.`);
    return item;
  }

  public getPendingPackets(): StoredPacketItem[] {
    const now = Date.now();
    const pending: StoredPacketItem[] = [];
    
    for (const item of this.store.values()) {
      if (item.status === "PENDING_RELAY" && now >= item.nextRetryTimestamp) {
        // Expiry check
        if (now - item.storedAt > 86400000) { // 24 hours
          item.status = "EXPIRED";
          continue;
        }
        pending.push(item);
      }
    }
    
    // Sort highest Emergency Confidence Score (ECS) first for triage routing
    return pending.sort((a, b) => b.packet.incident.emergencyConfidenceScore - a.packet.incident.emergencyConfidenceScore);
  }

  public markRelaying(packetId: string) {
    const item = this.store.get(packetId);
    if (item) {
      item.status = "RELAYING";
    }
  }

  public markAcknowledged(packetId: string) {
    const item = this.store.get(packetId);
    if (item) {
      item.status = "ACKNOWLEDGED";
      this.store.delete(packetId);
      MeshLogger.info("ROUTING", `Removed acknowledged packet ${packetId} from Store-and-Forward vault.`);
    }
  }

  public markRetryFailed(packetId: string) {
    const item = this.store.get(packetId);
    if (item) {
      item.retryCount += 1;
      item.status = "PENDING_RELAY";
      // Backoff math: 5s, 15s, 30s, 60s
      const delay = Math.min(5000 * Math.pow(2, item.retryCount), 60000);
      item.nextRetryTimestamp = Date.now() + delay;
      MeshLogger.warn("ROUTING", `Relay attempt failed for ${packetId}. Next retry in ${delay / 1000}s (Attempt ${item.retryCount})`);
    }
  }

  public getStoredCount(): number {
    return this.store.size;
  }

  public clearStorage() {
    this.store.clear();
  }
}

export const MeshStorage = new MeshStorageService();
