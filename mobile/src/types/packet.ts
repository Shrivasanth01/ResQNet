import { BloodGroup } from "./profile";

export type PacketType = "SOS_EMERGENCY" | "STATUS_CHECKIN" | "MESH_RELAY" | "GATEWAY_ACK" | "HEARTBEAT";
export type DeliveryStatus = "QUEUED" | "TRANSMITTING" | "RELAYED" | "DELIVERED_TO_GATEWAY" | "FAILED_EXHAUSTED";
export type TriggerSource = "MANUAL_SOS_BUTTON" | "MULTI_SENSOR_FALL" | "VEHICLE_CRASH" | "GOVERNMENT_ALERT" | "API_SYSTEM" | "INCIDENT_REPORT_FORM";
export type IncidentSeverity = "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "INFO";

export interface PacketHeader {
  packetId: string; // Unique nanoid/UUID
  timestamp: string; // ISO-8601 string
  version: string; // e.g. "1.5.0-PROD"
  ttl: number; // Time-To-Live hop limit (default 64)
  hopCount: number; // Number of mesh hops taken so far
  packetType: PacketType;
  encryptionVersion: string; // e.g. "NONE", "DATA_VAULT_CIPHER", "AES_256_GCM"
}

export interface PacketUser {
  userId: string;
  name: string;
  age: string;
  bloodGroup: BloodGroup | string;
  medicalConditions: string;
  emergencyContacts: Array<{
    name: string;
    phoneNumber: string;
    relationship: string;
    priorityOrder: number;
  }>;
}

export interface PacketLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface PacketIncident {
  emergencyType: string; // e.g. "Medical Emergency", "Fire", "Road Accident"
  severity: IncidentSeverity;
  emergencyConfidenceScore: number; // ECS between 0 and 100
  isAutomatic: boolean; // Manual or Automatic trigger
  triggerSource: TriggerSource;
  additionalDescription?: string;
}

export interface PacketDevice {
  batteryPercentage: number;
  isCharging: boolean;
  networkStatus: "ONLINE" | "OFFLINE_MESH_ONLY" | "NO_SIGNAL";
  bluetoothStatus: "ENABLED" | "DISABLED" | "UNAVAILABLE";
  gpsStatus: "LOCKED" | "SEARCHING" | "UNAVAILABLE" | "CACHED";
}

export interface PacketMesh {
  relayHistory: string[]; // List of Node IDs that forwarded this packet
  gatewayNode?: string; // Node ID that ultimately reached internet/FastAPI
  deliveryStatus: DeliveryStatus;
  retryCount: number;
  lastAttemptTimestamp?: string;
}

/**
 * ResQNet Universal Master Emergency Packet
 * Single source of truth for all distress transmissions across P2P Mesh and FastAPI Cloud.
 */
export interface EmergencyPacket {
  header: PacketHeader;
  user: PacketUser;
  location: PacketLocation;
  incident: PacketIncident;
  device: PacketDevice;
  mesh: PacketMesh;
  signature?: string; // Cryptographic integrity seal
}

export interface PacketValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}
