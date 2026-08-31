import { EmergencyPacket } from "../../types/packet";

/**
 * MODULE 8: TTL / RELAY LIMIT MANAGEMENT
 * 
 * CORE REQUIREMENT ENFORCEMENT:
 * - Uses existing TTL / relay-limit field from the RSEP header.
 * - Initial TTL (e.g., 5 or 64).
 * - Each relay hop decrements TTL by 1 and increments hopCount by 1.
 * - When TTL reaches 0: STOP RELAYING.
 * - Prevents an SOS from endlessly circulating in the emergency mesh.
 */
export class TTLManager {
  public static readonly DEFAULT_INITIAL_TTL = 5;

  /**
   * Checks whether the RSEP is valid to relay based on its TTL.
   * If TTL <= 0, returns false -> STOP RELAYING.
   */
  public static canRelay(packet: EmergencyPacket): boolean {
    if (!packet || !packet.header) return false;
    const ttl = packet.header.ttl;
    if (ttl <= 0) {
      console.warn(`[TTLManager] 🛑 TTL = 0 for packet ${packet.header.packetId}. STOP RELAYING (Hop limit exhausted).`);
      return false;
    }
    return true;
  }

  /**
   * Applies the next hop decrement to the RSEP metadata for outbound relay.
   * Decrements TTL by 1, increments hopCount by 1, and appends relaying node to relayHistory.
   * Returns the updated RSEP ready for forwarding.
   */
  public static decrementTTL(packet: EmergencyPacket, relayNodeId: string): EmergencyPacket {
    // Shallow copy header and mesh while keeping raw dossier intact
    const currentTtl = packet.header.ttl !== undefined ? packet.header.ttl : this.DEFAULT_INITIAL_TTL;
    const newTtl = Math.max(0, currentTtl - 1);
    const newHopCount = (packet.header.hopCount || 0) + 1;

    const existingHistory = packet.mesh?.relayHistory || [];
    const updatedHistory = existingHistory.includes(relayNodeId)
      ? existingHistory
      : [...existingHistory, relayNodeId];

    const updatedPacket: EmergencyPacket = {
      ...packet,
      header: {
        ...packet.header,
        ttl: newTtl,
        hopCount: newHopCount,
      },
      mesh: {
        ...packet.mesh,
        relayHistory: updatedHistory,
        deliveryStatus: newTtl === 0 ? "FAILED_EXHAUSTED" : "RELAYED",
      },
    };

    console.log(
      `[TTLManager] 🔄 Hop ${newHopCount} processed for ${packet.header.packetId}: TTL ${currentTtl} ➔ ${newTtl}. Relayed by node: ${relayNodeId}`
    );

    return updatedPacket;
  }
}
