import { EmergencyPacket } from "../../types/packet";

export type CommunicationMethod = "INTERNET" | "BLUETOOTH_MESH" | "WIFI_DIRECT" | "SMS" | "SATELLITE" | "OFFLINE_QUEUE";

export type ReceiptStatus = 
  | "CREATED"
  | "QUEUED"
  | "DISPATCHING"
  | "RELAYED"
  | "GATEWAY_FOUND"
  | "UPLOADED"
  | "ACKNOWLEDGED"
  | "FAILED"
  | "EXPIRED";

export interface NetworkState {
  internetAvailable: boolean;
  bluetoothAvailable: boolean;
  wifiAvailable: boolean;
  gpsStatus: "LOCKED" | "SEARCHING" | "UNAVAILABLE";
  batteryLevel: number;
  currentNetworkType: "WIFI" | "CELLULAR_5G" | "CELLULAR_4G" | "MESH_ONLY" | "NONE";
  lastSuccessfulCommunication: string | null;
  networkQualityScore: number; // 0 to 100
}

export interface DeliveryReceipt {
  receiptId: string;
  packetId: string;
  status: ReceiptStatus;
  communicationMethod: CommunicationMethod;
  nodeId: string;
  gatewayId?: string;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

export interface CommunicationLogEvent {
  id: string;
  timestamp: string;
  packetId: string;
  communicationMethod: CommunicationMethod;
  nodeId: string;
  gatewayId: string;
  action: string;
  result: "SUCCESS" | "FAILURE" | "PENDING" | "SUPPRESSED";
  latencyMs: number;
}

export interface IDispatcher {
  getMethodName(): CommunicationMethod;
  isAvailable(network: NetworkState): boolean;
  dispatch(packet: EmergencyPacket, gatewayId?: string): Promise<boolean>;
}

export interface ICompressionContract {
  compress(payload: string): Promise<string>;
  decompress(compressedPayload: string): Promise<string>;
}

export interface IChunkingContract {
  chunk(payload: string, mtuSize: number): Promise<string[]>;
  reassemble(chunks: string[]): Promise<string>;
}
