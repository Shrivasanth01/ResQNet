import { EmergencyPacket } from "../../types/packet";

export type TransportType = "BLE" | "WIFI_DIRECT" | "LOCAL_MDNS";
export type PeerStatus = "DISCOVERED" | "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "LOST";

export interface PeerNode {
  peerId: string;
  name: string;
  transport: TransportType;
  rssi: number; // Signal strength in dBm (e.g. -50 dBm is strong, -85 dBm is weak)
  batteryLevel: number;
  isGateway: boolean;
  gatewayLatencyMs?: number;
  lastSeen: number; // timestamp in ms
  status: PeerStatus;
  capabilities: {
    canRelay: boolean;
    supportsEncryption: boolean;
    maxMtu: number;
  };
}

export interface MeshMessage {
  messageId: string;
  type: "EMERGENCY_PACKET" | "ACK_RECEIPT" | "HEARTBEAT" | "PEER_DISCOVERY";
  senderPeerId: string;
  targetPeerId?: string; // Broadcast if undefined
  payload: any;
  timestamp: number;
}

export interface StoredPacketItem {
  storageId: string;
  packetId: string;
  packet: EmergencyPacket;
  storedAt: number;
  retryCount: number;
  nextRetryTimestamp: number;
  status: "PENDING_RELAY" | "RELAYING" | "ACKNOWLEDGED" | "EXPIRED";
}

export interface MeshTelemetry {
  activePeerCount: number;
  connectedPeerCount: number;
  gatewayNodePresent: boolean;
  totalPacketsRelayed: number;
  totalPacketsStored: number;
  duplicatePacketsSuppressed: number;
  lastSyncTimestamp: string;
  batteryOptimizationMode: "HIGH_PERFORMANCE" | "BALANCED" | "POWER_SAVE";
}

export interface SimulationScenarioResult {
  scenarioName: string;
  success: boolean;
  nodesParticipating: number;
  hopsUtilized: number;
  packetsRelayed: number;
  duplicatesDropped: number;
  gatewayUploaded: boolean;
  executionTimeMs: number;
  logSummary: string[];
}
