import { EmergencyPacket } from "../../types/packet";
import { MeshParticipatingDevice, SOSProgressEvent } from "./types";
import { DuplicateDetectionManager } from "./DuplicateDetectionManager";
import { TTLManager } from "./TTLManager";
import { DeviceDiscoveryManager } from "./DeviceDiscoveryManager";
import { RSEPTransferManager } from "./RSEPTransferManager";
import { InternetGatewayManager } from "./InternetGatewayManager";

export interface RelayStepResult {
  packetId: string;
  sourceNode: string;
  destinationNode?: string;
  success: boolean;
  isDeliveredToGateway: boolean;
  gatewayNodeId?: string;
  ttlRemaining: number;
  hopCount: number;
  reason?: string;
}

/**
 * MODULE 6: AUTOMATIC RELAY MANAGER
 * 
 * CORE REQUIREMENT ENFORCEMENT:
 * - A receiving device automatically becomes a relay node.
 * - Automatically receives, evaluates, decrements TTL, and forwards RSEP to neighboring devices.
 * - Multi-hop flow: User ➔ Device A ➔ Device B ➔ Device C ➔ Internet Gateway ➔ Server.
 * - Zero user interaction required on intermediate relay devices.
 * - Enforces Duplicate Protection and TTL limits.
 */
export class AutomaticRelayManager {
  private static activeRelayQueue: EmergencyPacket[] = [];
  private static isRelaying: boolean = false;

  /**
   * Automatically ingests an incoming RSEP on a participating receiving device and executes automatic relay.
   */
  public static async receiveAndAutoRelay(
    incomingPacket: EmergencyPacket,
    fromDeviceId: string,
    onProgress?: (event: SOSProgressEvent) => void
  ): Promise<RelayStepResult> {
    const packetId = incomingPacket.header.packetId;
    const myNodeId = DeviceDiscoveryManager.getMyNodeId();
    const currentHops = incomingPacket.header.hopCount || 0;

    console.log(`[AutomaticRelayManager] 📥 Node ${myNodeId} received RSEP (${packetId}) from ${fromDeviceId} (Hop ${currentHops})...`);

    // 1. Duplicate Protection Check
    if (DuplicateDetectionManager.isDuplicate(packetId, currentHops)) {
      return {
        packetId,
        sourceNode: fromDeviceId,
        success: false,
        isDeliveredToGateway: false,
        ttlRemaining: incomingPacket.header.ttl,
        hopCount: currentHops,
        reason: "DUPLICATE_IGNORED",
      };
    }

    // 2. TTL and Hop Limit Check
    if (!TTLManager.canRelay(incomingPacket)) {
      if (onProgress) {
        onProgress({
          step: "TTL_EXPIRED",
          message: `Hop limit reached for ${packetId}. Relay terminated.`,
          packetId,
          hopCount: currentHops,
          ttl: incomingPacket.header.ttl,
          currentNodeId: myNodeId,
          timestamp: new Date().toISOString(),
        });
      }
      return {
        packetId,
        sourceNode: fromDeviceId,
        success: false,
        isDeliveredToGateway: false,
        ttlRemaining: incomingPacket.header.ttl,
        hopCount: currentHops,
        reason: "TTL_EXPIRED",
      };
    }

    // 3. Decrement TTL for outbound forwarding
    const preparedOutbound = TTLManager.decrementTTL(incomingPacket, myNodeId);

    // 4. Check if current device can act as Internet Gateway
    const hasInternet = await InternetGatewayManager.isInternetAvailable();
    if (hasInternet) {
      console.log(`[AutomaticRelayManager] 🌐 Active Internet connection detected on node ${myNodeId}! Delivering to Emergency Server...`);
      
      if (onProgress) {
        onProgress({
          step: "INTERNET_GATEWAY_FOUND",
          message: `Internet Gateway reached on node ${myNodeId}. Uploading to Emergency Server...`,
          packetId,
          hopCount: preparedOutbound.header.hopCount,
          ttl: preparedOutbound.header.ttl,
          currentNodeId: myNodeId,
          isGateway: true,
          gatewayNodeId: myNodeId,
          timestamp: new Date().toISOString(),
        });
      }

      const delivery = await InternetGatewayManager.ingestAndDeliverRSEP(preparedOutbound, myNodeId);
      
      if (delivery.success) {
        if (onProgress) {
          onProgress({
            step: "SOS_DELIVERED",
            message: `SOS Distress signal delivered to Emergency Server! Incident: ${delivery.response.incidentId}`,
            packetId,
            hopCount: preparedOutbound.header.hopCount,
            ttl: preparedOutbound.header.ttl,
            currentNodeId: myNodeId,
            isGateway: true,
            gatewayNodeId: myNodeId,
            deliveredAt: delivery.response.serverTimestamp,
            timestamp: new Date().toISOString(),
          });
        }

        return {
          packetId,
          sourceNode: fromDeviceId,
          destinationNode: "EMERGENCY_SERVER",
          success: true,
          isDeliveredToGateway: true,
          gatewayNodeId: myNodeId,
          ttlRemaining: preparedOutbound.header.ttl,
          hopCount: preparedOutbound.header.hopCount,
        };
      }
    }

    // 5. If no direct internet, search for neighboring participating devices to forward
    const nearby = await DeviceDiscoveryManager.discoverNearbyDevices();
    const candidates = nearby.filter(
      (d) => d.deviceId !== myNodeId && !preparedOutbound.mesh.relayHistory.includes(d.deviceId)
    );

    if (candidates.length === 0) {
      console.log(`[AutomaticRelayManager] No unvisited neighbor peers found. Storing in offline vault.`);
      return {
        packetId,
        sourceNode: fromDeviceId,
        success: true,
        isDeliveredToGateway: false,
        ttlRemaining: preparedOutbound.header.ttl,
        hopCount: preparedOutbound.header.hopCount,
        reason: "NO_NEIGHBORS_SAVED_OFFLINE",
      };
    }

    // 6. Forward to the best available peer
    const nextTarget = candidates[0];
    if (onProgress) {
      onProgress({
        step: "ANOTHER_DEVICE_FOUND",
        message: `Found next relay device: ${nextTarget.name} (${nextTarget.transport})`,
        packetId,
        hopCount: preparedOutbound.header.hopCount,
        ttl: preparedOutbound.header.ttl,
        currentNodeId: myNodeId,
        targetDeviceId: nextTarget.deviceId,
        targetDeviceName: nextTarget.name,
        transport: nextTarget.transport,
        isGateway: nextTarget.isInternetGateway,
        timestamp: new Date().toISOString(),
      });
    }

    const transfer = await RSEPTransferManager.transferRSEP(preparedOutbound, nextTarget);
    
    if (transfer.success && nextTarget.isInternetGateway) {
      // Direct gateway hop reached!
      if (onProgress) {
        onProgress({
          step: "INTERNET_GATEWAY_FOUND",
          message: `Internet Gateway reached on ${nextTarget.name}! Uploading to Emergency Server...`,
          packetId,
          hopCount: preparedOutbound.header.hopCount,
          ttl: preparedOutbound.header.ttl,
          currentNodeId: myNodeId,
          targetDeviceId: nextTarget.deviceId,
          targetDeviceName: nextTarget.name,
          isGateway: true,
          gatewayNodeId: nextTarget.deviceId,
          timestamp: new Date().toISOString(),
        });
      }

      const delivery = await InternetGatewayManager.ingestAndDeliverRSEP(preparedOutbound, nextTarget.deviceId);
      if (delivery.success && onProgress) {
        onProgress({
          step: "SOS_DELIVERED",
          message: `SOS Distress successfully delivered to Emergency Server via ${nextTarget.name}!`,
          packetId,
          hopCount: preparedOutbound.header.hopCount,
          ttl: preparedOutbound.header.ttl,
          currentNodeId: myNodeId,
          gatewayNodeId: nextTarget.deviceId,
          isGateway: true,
          deliveredAt: delivery.response.serverTimestamp,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      packetId,
      sourceNode: fromDeviceId,
      destinationNode: nextTarget.deviceId,
      success: transfer.success,
      isDeliveredToGateway: nextTarget.isInternetGateway,
      gatewayNodeId: nextTarget.isInternetGateway ? nextTarget.deviceId : undefined,
      ttlRemaining: preparedOutbound.header.ttl,
      hopCount: preparedOutbound.header.hopCount,
    };
  }
}
