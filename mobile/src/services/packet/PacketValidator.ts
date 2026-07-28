import { EmergencyPacket, PacketValidationResult } from "../../types/packet";

export const PacketValidator = {
  /**
   * Validates structural integrity, coordinate boundaries, TTL status, and mandatory profile fields
   */
  validate: (packet: EmergencyPacket | null | undefined): PacketValidationResult => {
    const errors: string[] = [];

    if (!packet) {
      return { isValid: false, errors: ["Packet payload is entirely null or undefined."] };
    }

    // Header validation
    if (!packet.header) {
      errors.push("Missing required Header pillar.");
    } else {
      if (!packet.header.packetId) errors.push("Header missing unique Packet ID.");
      if (packet.header.ttl <= 0) errors.push("Packet TTL has expired (TTL <= 0). Cannot relay further.");
      if (packet.header.hopCount < 0) errors.push("Hop count cannot be negative.");
      if (!packet.header.timestamp || isNaN(Date.parse(packet.header.timestamp))) {
        errors.push("Header contains invalid or corrupt ISO-8601 timestamp.");
      }
    }

    // User validation
    if (!packet.user) {
      errors.push("Missing required User medical & identity pillar.");
    } else {
      if (!packet.user.userId) errors.push("User ID missing from packet.");
      if (!packet.user.bloodGroup) errors.push("Blood group is mandatory for triage calculation.");
    }

    // Location validation
    if (!packet.location) {
      errors.push("Missing required Location telemetry pillar.");
    } else {
      if (packet.location.latitude < -90 || packet.location.latitude > 90) {
        errors.push(`Invalid Latitude boundary (${packet.location.latitude}). Must be between -90 and 90.`);
      }
      if (packet.location.longitude < -180 || packet.location.longitude > 180) {
        errors.push(`Invalid Longitude boundary (${packet.location.longitude}). Must be between -180 and 180.`);
      }
    }

    // Incident validation
    if (!packet.incident) {
      errors.push("Missing required Incident diagnosis pillar.");
    } else {
      if (!packet.incident.emergencyType) errors.push("Incident type (e.g. Fire, Medical) is required.");
      if (packet.incident.emergencyConfidenceScore < 0 || packet.incident.emergencyConfidenceScore > 100) {
        errors.push(`Emergency Confidence Score (${packet.incident.emergencyConfidenceScore}) out of bounds [0, 100].`);
      }
    }

    // Device validation
    if (!packet.device) {
      errors.push("Missing Device hardware status pillar.");
    } else {
      if (packet.device.batteryPercentage < 0 || packet.device.batteryPercentage > 100) {
        errors.push(`Battery telemetry (${packet.device.batteryPercentage}%) out of physical range.`);
      }
    }

    // Mesh validation
    if (!packet.mesh) {
      errors.push("Missing Mesh relay routing pillar.");
    } else {
      if (!Array.isArray(packet.mesh.relayHistory)) errors.push("Relay history must be a valid array of node IDs.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Quick boolean checker for high-speed routing pipelines
   */
  isValidPacket: (packet: EmergencyPacket): boolean => {
    return PacketValidator.validate(packet).isValid;
  },

  /**
   * Checks if packet is stale (older than 24 hours in disaster environments)
   */
  isStale: (packet: EmergencyPacket, maxAgeHours: number = 24): boolean => {
    try {
      const pktTime = new Date(packet.header.timestamp).getTime();
      const diffMs = Date.now() - pktTime;
      return diffMs > maxAgeHours * 3600 * 1000;
    } catch (e) {
      return true;
    }
  }
};
