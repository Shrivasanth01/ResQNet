import { EmergencyPacket } from "../../types/packet";
import { PeerManager } from "./PeerManager";
import { ConnectionManager } from "./ConnectionManager";
import { MeshRouting } from "./MeshRouting";
import { MeshStorage } from "./MeshStorage";
import { MeshSecurity } from "./MeshSecurity";
import { MeshLogger } from "./MeshLogger";
import { PeerNode } from "./MeshTypes";

/**
 * Mesh Relay Store-And-Forward Engine
 * 
 * Orchestrates hop execution across discovered peers. If zero neighbors are in radio range,
 * items are funneled into local persistence until new peers or gateways enter radar proximity.
 */
class MeshRelayService {
  private totalRelayedCount: number = 0;
  private isProcessingQueue: boolean = false;

  public async relayPacket(packet: EmergencyPacket, allowStoreAndForward: boolean = true): Promise<{ success: boolean; targetPeerId?: string; stored?: boolean; reason?: string }> {
    const packetId = packet.header.packetId;

    // 1. Evaluate routing constraints (duplicates & TTL)
    const routingCheck = MeshRouting.shouldProcessPacket(packet);
    if (!routingCheck.accept) {
      return { success: false, reason: routingCheck.reason };
    }

    // 2. Validate cryptographic and clinical security posture
    const secCheck = MeshSecurity.verifyPacketBeforeRelay(packet);
    if (!secCheck.approved) {
      return { success: false, reason: secCheck.reason };
    }

    // 3. Select best target hop in priority order: Internet Gateway first, strongest Relay Peer second
    let targetPeer: PeerNode | undefined = PeerManager.getBestGatewayPeer();
    if (!targetPeer) {
      targetPeer = PeerManager.getBestRelayPeer(packet.mesh.relayHistory);
    }

    // 4. Store-and-Forward Fallback if zero peers online
    if (!targetPeer) {
      if (allowStoreAndForward) {
        MeshLogger.info("RELAY", `No available peers in radio range for ${packetId}. Executing Store-and-Forward persistence.`);
        await MeshStorage.saveForOfflineRelay(packet);
        return { success: true, stored: true, reason: "STORE_AND_FORWARD_QUEUED" };
      }
      return { success: false, reason: "NO_PEERS_AVAILABLE" };
    }

    // 5. Establish physical socket connection if needed
    const connected = await ConnectionManager.connectToPeer(targetPeer.peerId);
    if (!connected) {
      MeshLogger.warn("RELAY", `Socket connection failure to peer ${targetPeer.peerId}. Rerouting to Store-and-Forward.`);
      if (allowStoreAndForward) {
        await MeshStorage.saveForOfflineRelay(packet);
        return { success: true, stored: true, reason: "PEER_CONNECT_FAILURE_STORED" };
      }
      return { success: false, reason: "SOCKET_CONNECT_FAIL" };
    }

    // 6. Execute Hop Relay
    const outbound = MeshRouting.prepareForHopRelay(packet, targetPeer.isGateway ? targetPeer.peerId : undefined);
    MeshStorage.markRelaying(packetId);

    MeshLogger.info(
      "RELAY",
      `Transmitting packet ${packetId} over ${targetPeer.transport} to peer ${targetPeer.name} (${targetPeer.peerId}) [Hop ${outbound.header.hopCount}, TTL ${outbound.header.ttl}]`
    );

    // Simulate fast RF payload transmission
    await new Promise((resolve) => setTimeout(resolve, 80));

    this.totalRelayedCount++;
    MeshStorage.markAcknowledged(packetId); // Remove from offline vault upon successful hop transfer
    MeshLogger.info("RELAY", `Successfully transferred packet ${packetId} to peer ${targetPeer.peerId}! Total relayed: ${this.totalRelayedCount}`);

    return { success: true, targetPeerId: targetPeer.peerId, stored: false };
  }

  /**
   * Automated Background Dequeue Engine: Immediately dumps stored outbox items whenever new peers appear on radar.
   */
  public async processOfflineQueue(): Promise<number> {
    if (this.isProcessingQueue) return 0;
    this.isProcessingQueue = true;

    const pending = MeshStorage.getPendingPackets();
    if (pending.length === 0) {
      this.isProcessingQueue = false;
      return 0;
    }

    MeshLogger.info("RELAY", `Inspecting offline store-and-forward queue (${pending.length} pending items)...`);
    let flushed = 0;

    for (const item of pending) {
      const bestPeer = PeerManager.getBestRelayPeer(item.packet.mesh.relayHistory) || PeerManager.getBestGatewayPeer();
      if (bestPeer) {
        MeshLogger.info("RELAY", `Found online peer ${bestPeer.peerId}! Dequeuing stored packet ${item.packetId}`);
        const res = await this.relayPacket(item.packet, false);
        if (res.success) {
          flushed++;
        } else {
          MeshStorage.markRetryFailed(item.packetId);
        }
      } else {
        break; // Stop iteration if still zero peers accessible
      }
    }

    if (flushed > 0) {
      MeshLogger.info("RELAY", `Offline queue processing complete: Flushed ${flushed} packets back into active radio mesh.`);
    }

    this.isProcessingQueue = false;
    return flushed;
  }

  public getTotalRelayedCount(): number {
    return this.totalRelayedCount;
  }

  public resetStats(): void {
    this.totalRelayedCount = 0;
  }
}

export const MeshRelay = new MeshRelayService();
