import { EmergencyPacket, PacketType, TriggerSource, IncidentSeverity } from "../../types/packet";
import { DatabaseService } from "../db";
import { LocationService } from "../hardware/LocationService";

export interface BuildPacketOptions {
  packetType?: PacketType;
  emergencyType: string;
  severity?: IncidentSeverity;
  ecs?: number; // Emergency Confidence Score (0-100)
  isAutomatic?: boolean;
  triggerSource?: TriggerSource;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  locationSource?: "LIVE" | "CACHED" | "UNAVAILABLE";
  additionalDescription?: string;
}

export const PacketBuilder = {
  /**
   * Generates a collision-resistant unique Packet ID string
   */
  generatePacketId: (): string => {
    const timestampHex = Date.now().toString(16).toUpperCase();
    const randomHex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0").toUpperCase();
    return `RQ-PKT-${timestampHex}-${randomHex}`;
  },

  /**
   * Assembles a completely populated EmergencyPacket by pulling from local SQLite Phase 1 medical vault
   */
  buildEmergencyPacket: async (options: BuildPacketOptions): Promise<EmergencyPacket> => {
    const now = new Date().toISOString();
    const profile = await DatabaseService.getEmergencyProfile();
    
    // Respect medical privacy consent setting
    const consentToShare = profile.personal.consentToShareMedical !== false;
    const medicalInfo = consentToShare
      ? `${profile.medical.medicalConditions || 'None reported'} | Allergies: ${profile.medical.allergies || 'None reported'}`
      : "REDACTED_BY_USER_CONSENT";

    const emergencyContacts = consentToShare
      ? profile.contacts.map((c) => ({
          name: c.name,
          phoneNumber: c.phoneNumber,
          relationship: c.relationship,
          priorityOrder: c.priorityOrder,
        }))
      : [];

    // Calculate intelligent default severity based on Emergency Confidence Score (ECS)
    const ecs = options.ecs !== undefined ? Math.max(0, Math.min(100, options.ecs)) : 100; // Manual SOS gets max ECS (100)
    let computedSeverity: IncidentSeverity = options.severity || "CRITICAL";

    // Location Source determination
    let locSource = options.locationSource;
    if (!locSource) {
      locSource = options.latitude !== undefined ? "LIVE" : "CACHED";
    }

    const packet: EmergencyPacket = {
      header: {
        packetId: PacketBuilder.generatePacketId(),
        timestamp: now,
        version: "1.5.0-PROD",
        ttl: 64, // Standard mesh hopping time-to-live
        hopCount: 0,
        packetType: options.packetType || "SOS_EMERGENCY",
        encryptionVersion: "NONE", // Updated by PacketEncryption during transmission stage
      },
      user: {
        userId: profile.personal.id || `usr_${Date.now()}`,
        name: profile.personal.fullName || "Field Survivor",
        age: profile.personal.age || "Unknown",
        bloodGroup: profile.personal.bloodGroup || "O+",
        medicalConditions: medicalInfo,
        emergencyContacts: emergencyContacts,
      },
      location: {
        latitude: options.latitude !== undefined ? options.latitude : (LocationService as any).lastLocation?.latitude || 0,
        longitude: options.longitude !== undefined ? options.longitude : (LocationService as any).lastLocation?.longitude || 0,
        altitude: options.altitude || 0,
        accuracy: options.accuracy || 5,
        speed: options.speed || 0,
        heading: options.heading || 0,
        timestamp: now,
      },
      incident: {
        emergencyType: options.emergencyType,
        severity: computedSeverity,
        emergencyConfidenceScore: ecs,
        isAutomatic: options.isAutomatic || false,
        triggerSource: options.triggerSource || "MANUAL_SOS_BUTTON",
        additionalDescription: options.additionalDescription || `Urgent rescue requested via ResQNet. Location Source: ${locSource}`,
      },
      device: {
        batteryPercentage: 85,
        isCharging: false,
        networkStatus: "OFFLINE_MESH_ONLY",
        bluetoothStatus: "ENABLED",
        gpsStatus: locSource === "LIVE" ? "LOCKED" : (locSource === "CACHED" ? "CACHED" : "SEARCHING"),
      },
      mesh: {
        relayHistory: [profile.personal.id || "usr_active_001"], // Origin node ID starts the hop chain
        deliveryStatus: "QUEUED",
        retryCount: 0,
      },
    };

    return packet;
  },

  /**
   * Helper to update TTL and append node ID to relay history as packet travels across P2P wireless mesh
   */
  incrementMeshHop: (packet: EmergencyPacket, relayNodeId: string): EmergencyPacket => {
    return {
      ...packet,
      header: {
        ...packet.header,
        ttl: Math.max(0, packet.header.ttl - 1),
        hopCount: packet.header.hopCount + 1,
      },
      mesh: {
        ...packet.mesh,
        relayHistory: [...packet.mesh.relayHistory, relayNodeId],
        deliveryStatus: "RELAYED",
      },
    };
  },
};
