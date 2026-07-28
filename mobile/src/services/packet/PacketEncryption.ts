import { EmergencyPacket } from "../../types/packet";
import { DataVaultCipher } from "../db/cipher";
import { KeyManager } from "../security/KeyManager";

export interface PacketEncryptionContract {
  encryptPacket(packet: EmergencyPacket): EmergencyPacket;
  decryptPacket(packet: EmergencyPacket): EmergencyPacket;
  signPacket(packet: EmergencyPacket): string;
  verifySignature(packet: EmergencyPacket): boolean;
}

/**
 * Builds canonical string representation of an EmergencyPacket for deterministic Ed25519 signing & verification.
 */
export function buildCanonicalPacketString(packet: EmergencyPacket): string {
  const h = packet.header || {};
  const u = packet.user || {};
  const l = packet.location || {};
  const i = packet.incident || {};

  return [
    h.packetId || "",
    h.timestamp || "",
    h.version || "",
    h.ttl ?? "",
    h.hopCount ?? "",
    h.packetType || "",
    u.userId || "",
    u.name || "",
    u.bloodGroup || "",
    l.latitude ?? "",
    l.longitude ?? "",
    i.emergencyType || "",
    i.severity || "",
    i.emergencyConfidenceScore ?? "",
  ].join("|");
}

/**
 * Pluggable Cryptographic Envelope for Emergency Packets
 * 
 * DESIGN PRINCIPLE:
 * Relaying mesh nodes require unencrypted access to Header (TTL, hops, packetId) and Incident Severity
 * to prioritize route radio queues, but MUST NOT be able to inspect patient PHI or identities.
 * Selective encryption encrypts PHI and user identity metadata while signing the entire envelope using Ed25519.
 */
export const PacketEncryption: PacketEncryptionContract = {
  encryptPacket: (packet: EmergencyPacket): EmergencyPacket => {
    if (!packet || !packet.header) return packet;

    if (packet.header.encryptionVersion === "AES_256_GCM_v1") {
      return packet; // Already encrypted with AES-256-GCM
    }

    const encryptedUser = {
      ...packet.user,
      name: DataVaultCipher.encryptPayload(packet.user.name),
      medicalConditions: DataVaultCipher.encryptPayload(packet.user.medicalConditions),
      emergencyContacts: (packet.user.emergencyContacts || []).map(c => ({
        ...c,
        name: DataVaultCipher.encryptPayload(c.name),
        phoneNumber: DataVaultCipher.encryptPayload(c.phoneNumber),
      }))
    };

    const encryptedIncident = {
      ...packet.incident,
      additionalDescription: packet.incident.additionalDescription 
        ? DataVaultCipher.encryptPayload(packet.incident.additionalDescription)
        : undefined
    };

    const clone: EmergencyPacket = {
      ...packet,
      header: {
        ...packet.header,
        encryptionVersion: "AES_256_GCM_v1",
      },
      user: encryptedUser,
      incident: encryptedIncident,
    };

    clone.signature = PacketEncryption.signPacket(clone);
    return clone;
  },

  decryptPacket: (packet: EmergencyPacket): EmergencyPacket => {
    if (!packet || !packet.header || packet.header.encryptionVersion === "NONE") {
      return packet;
    }

    const decryptedUser = {
      ...packet.user,
      name: DataVaultCipher.decryptPayload(packet.user.name),
      medicalConditions: DataVaultCipher.decryptPayload(packet.user.medicalConditions),
      emergencyContacts: (packet.user.emergencyContacts || []).map(c => ({
        ...c,
        name: DataVaultCipher.decryptPayload(c.name),
        phoneNumber: DataVaultCipher.decryptPayload(c.phoneNumber),
      }))
    };

    const decryptedIncident = {
      ...packet.incident,
      additionalDescription: packet.incident.additionalDescription
        ? DataVaultCipher.decryptPayload(packet.incident.additionalDescription)
        : undefined
    };

    return {
      ...packet,
      header: {
        ...packet.header,
        encryptionVersion: "NONE",
      },
      user: decryptedUser,
      incident: decryptedIncident,
    };
  },

  signPacket: (packet: EmergencyPacket): string => {
    const canonicalPayload = buildCanonicalPacketString(packet);
    return KeyManager.signPayload(canonicalPayload);
  },

  verifySignature: (packet: EmergencyPacket): boolean => {
    if (!packet || !packet.signature) return false;
    const canonicalPayload = buildCanonicalPacketString(packet);
    return KeyManager.verifySignature(canonicalPayload, packet.signature);
  }
};
