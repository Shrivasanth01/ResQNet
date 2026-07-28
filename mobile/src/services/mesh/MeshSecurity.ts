import { EmergencyPacket } from "../../types/packet";
import { PacketEncryption } from "../packet/PacketEncryption";
import { ReplayCache } from "../security/ReplayCache";
import { MeshLogger } from "./MeshLogger";

/**
 * Mesh Security Engine
 * 
 * DESIGN PRINCIPLE:
 * Adheres to Phase B Zero-Trust Architecture:
 * 1. Zero unencrypted PHI transmission over BLE / Wi-Fi Direct.
 * 2. Mathematical Ed25519 signature verification at every relay node.
 * 3. Replay attack rejection via ReplayCache & timestamp bounds validation.
 * 4. Audit logging without logging decrypted medical information.
 */
export class MeshSecurity {
  /**
   * Evaluates packet cryptographic posture before allowing physical transmission or relaying.
   */
  public static verifyPacketBeforeRelay(packet: EmergencyPacket): { approved: boolean; reason?: string } {
    if (!packet || !packet.header || !packet.header.packetId) {
      MeshLogger.warn("SECURITY", "PACKET_REJECTED: Malformed emergency packet header structure.");
      return { approved: false, reason: "Malformed emergency packet header structure." };
    }

    const packetId = packet.header.packetId;

    // 1. Verify TTL boundary
    if (packet.header.ttl <= 0) {
      MeshLogger.warn("SECURITY", `EXPIRED_PACKET: Packet ${packetId} TTL has expired (${packet.header.ttl}).`);
      return { approved: false, reason: `Packet TTL has expired (${packet.header.ttl}).` };
    }

    // 2. Replay Protection: Check ReplayCache for duplicate packet ID or duplicate signature
    if (ReplayCache.has(packetId)) {
      MeshLogger.warn("SECURITY", `REPLAY_DETECTED: Duplicate packetId ${packetId} blocked from relay.`);
      return { approved: false, reason: `Replay attack detected: packetId ${packetId} previously processed.` };
    }

    if (packet.signature && ReplayCache.has(packet.signature)) {
      MeshLogger.warn("SECURITY", `REPLAY_DETECTED: Duplicate signature blocked from relay for packet ${packetId}.`);
      return { approved: false, reason: `Replay attack detected: duplicate signature for packet ${packetId}.` };
    }

    // 3. Timestamp Validation (Reject packets > 24 hours old or > 5 minutes in future)
    if (packet.header.timestamp) {
      const pktTime = new Date(packet.header.timestamp).getTime();
      const now = Date.now();
      if (isNaN(pktTime)) {
        MeshLogger.warn("SECURITY", `PACKET_REJECTED: Invalid timestamp formatting in packet ${packetId}.`);
        return { approved: false, reason: "Invalid ISO-8601 timestamp in packet header." };
      }
      if (pktTime > now + 5 * 60 * 1000) {
        MeshLogger.warn("SECURITY", `EXPIRED_PACKET: Timestamp in future for packet ${packetId}.`);
        return { approved: false, reason: "Timestamp is too far in the future." };
      }
      if (now - pktTime > 24 * 3600 * 1000) {
        MeshLogger.warn("SECURITY", `EXPIRED_PACKET: Packet ${packetId} is older than 24-hour expiration boundary.`);
        return { approved: false, reason: "Packet timestamp expired (> 24 hours)." };
      }
    }

    // 4. Mathematical Ed25519 Signature Verification
    if (packet.signature) {
      const isValidSig = PacketEncryption.verifySignature(packet);
      if (!isValidSig) {
        MeshLogger.warn("SECURITY", `INVALID_SIGNATURE: Ed25519 verification failed for packet ${packetId}. Discarding.`);
        return { approved: false, reason: "Invalid Ed25519 cryptographic digital signature." };
      }
    } else {
      MeshLogger.warn("SECURITY", `INVALID_SIGNATURE: Unsigned packet ${packetId} blocked.`);
      return { approved: false, reason: "Missing required digital signature." };
    }

    // Add to ReplayCache after successful validation
    ReplayCache.add(packetId);
    if (packet.signature) {
      ReplayCache.add(packet.signature);
    }

    MeshLogger.info("SECURITY", `PACKET_VERIFIED: Successfully authenticated envelope posture for packet ${packetId}.`);
    return { approved: true };
  }

  /**
   * Encrypts and sanitizes payload prior to transmitting over radio broadcasts (BLE/Wi-Fi).
   * Ensures no plaintext PHI travels over open mesh radio channels.
   */
  public static prepareSecurePayload(packet: EmergencyPacket): string {
    const encryptedPacket = PacketEncryption.encryptPacket(packet);
    const serialized = JSON.stringify(encryptedPacket);
    MeshLogger.info("SECURITY", `Prepared authenticated payload frame for packet ${packet.header.packetId} (${serialized.length} bytes)`);
    return serialized;
  }
}
