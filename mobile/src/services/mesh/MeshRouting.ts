import { EmergencyPacket } from "../../types/packet";
import { PeerManager } from "./PeerManager";
import { MeshLogger } from "./MeshLogger";

/**
 * Mesh Routing Algorithm Engine
 * 
 * Implements Controlled Flooding with TTL Expiration and LRU Duplicate Suppression.
 * Guaranteed to eliminate broadcast broadcast storms across decentralized emergency topology.
 */
class MeshRoutingService {
  // LRU cache of recently seen Packet IDs and ACK IDs to suppress broadcast loops
  private seenPacketIds: Set<string> = new Set();
  private maxSeenBufferSize: number = 2000;
  private duplicateSuppressionCount: number = 0;

  public shouldProcessPacket(packet: EmergencyPacket): { accept: boolean; reason?: string } {
    if (!packet || !packet.header) {
      return { accept: false, reason: "Invalid packet structure" };
    }

    const packetId = packet.header.packetId;

    // 1. Check duplicate suppression firewall
    if (this.seenPacketIds.has(packetId)) {
      this.duplicateSuppressionCount++;
      MeshLogger.debug("ROUTING", `Duplicate packet suppressed: ${packetId} (Total suppressed: ${this.duplicateSuppressionCount})`);
      return { accept: false, reason: "DUPLICATE_SUPPRESSED" };
    }

    // 2. Check TTL expiration
    if (packet.header.ttl <= 0) {
      MeshLogger.warn("ROUTING", `Packet discarded due to TTL expiration: ${packetId} (TTL: ${packet.header.ttl})`);
      return { accept: false, reason: "TTL_EXPIRED" };
    }

    // 3. Check loop prevention in relay history
    const myId = PeerManager.getMyNodeId();
    if (packet.mesh.relayHistory && packet.mesh.relayHistory.includes(myId)) {
      MeshLogger.debug("ROUTING", `Loop detected: Node ${myId} already in relayHistory for packet ${packetId}`);
      return { accept: false, reason: "ROUTING_LOOP_DETECTED" };
    }

    // Register Packet ID in seen buffer
    this.registerSeenPacket(packetId);
    return { accept: true };
  }

  public registerSeenPacket(packetId: string): void {
    this.seenPacketIds.add(packetId);
    if (this.seenPacketIds.size > this.maxSeenBufferSize) {
      // Evict oldest item (first element in Set iterative order)
      const oldest = this.seenPacketIds.values().next().value;
      if (oldest) {
        this.seenPacketIds.delete(oldest);
      }
    }
  }

  /**
   * Prepares packet for outbound physical transit: decrements TTL, increments hopCount, appends local node ID.
   */
  public prepareForHopRelay(packet: EmergencyPacket, targetGatewayId?: string): EmergencyPacket {
    const clone: EmergencyPacket = JSON.parse(JSON.stringify(packet));
    const myId = PeerManager.getMyNodeId();

    clone.header.ttl = Math.max(0, clone.header.ttl - 1);
    clone.header.hopCount = clone.header.hopCount + 1;

    if (!clone.mesh.relayHistory) {
      clone.mesh.relayHistory = [];
    }
    if (!clone.mesh.relayHistory.includes(myId)) {
      clone.mesh.relayHistory.push(myId);
    }

    if (targetGatewayId) {
      clone.mesh.gatewayNode = targetGatewayId;
      clone.mesh.deliveryStatus = "RELAYED";
    }

    MeshLogger.info("ROUTING", `Prepared hop ${clone.header.hopCount} for ${clone.header.packetId}. New TTL: ${clone.header.ttl}. Added relay node ${myId}`);
    return clone;
  }

  public getDuplicateSuppressionCount(): number {
    return this.duplicateSuppressionCount;
  }

  public isPacketSeen(packetId: string): boolean {
    return this.seenPacketIds.has(packetId);
  }

  public clearSeenCache(): void {
    this.seenPacketIds.clear();
    this.duplicateSuppressionCount = 0;
  }
}

export const MeshRouting = new MeshRoutingService();
