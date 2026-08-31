import { EmergencyPacket } from "../../types/packet";

export type SOSDistributionStep =
  | "IDLE"
  | "SOS_ACTIVATED"
  | "RSEP_FOUND"
  | "SEARCHING_FOR_NEARBY_DEVICES"
  | "DEVICE_FOUND"
  | "RSEP_TRANSFERRED"
  | "RELAYING"
  | "ANOTHER_DEVICE_FOUND"
  | "INTERNET_GATEWAY_FOUND"
  | "SOS_DELIVERED"
  | "TTL_EXPIRED"
  | "FAILED";

export type TransportLayer = "BLE" | "WIFI_DIRECT" | "LOCAL_WIFI" | "INTERNET";

export interface MeshParticipatingDevice {
  deviceId: string;
  name: string;
  transport: TransportLayer;
  rssi: number;
  batteryLevel: number;
  isInternetGateway: boolean;
  hopDistance: number;
  lastSeen: number;
}

export interface SOSProgressEvent {
  step: SOSDistributionStep;
  message: string;
  packetId: string;
  hopCount: number;
  ttl: number;
  currentNodeId: string;
  targetDeviceId?: string;
  targetDeviceName?: string;
  transport?: TransportLayer;
  isGateway?: boolean;
  gatewayNodeId?: string;
  deliveredAt?: string;
  timestamp: string;
}

export type SOSProgressListener = (event: SOSProgressEvent) => void;

export interface SOSDistributionResult {
  success: boolean;
  packetId: string;
  hops: number;
  deliveredToGateway: boolean;
  gatewayNodeId?: string;
  relayChain: string[];
  history: SOSProgressEvent[];
}
