import { EmergencyPacket } from "../../types/packet";
import { EmergencyServerBridge, ServerDeliveryResponse } from "./EmergencyServerBridge";
import { PacketStorage } from "../packet/PacketStorage";

/**
 * MODULE 9: INTERNET GATEWAY MANAGER
 * 
 * CORE REQUIREMENT ENFORCEMENT:
 * - Any participating device with internet connectivity acts as an Internet Gateway.
 * - When an internet-connected node is reached:
 *     1. Automatically upload the RSEP.
 *     2. Send the SOS information to the emergency server.
 *     3. Mark the SOS as DELIVERED.
 *     4. Stop unnecessary further relaying.
 */
export class InternetGatewayManager {
  private static isInternetOnline: boolean = true;
  private static deliveredPackets: Set<string> = new Set();

  /**
   * Checks if internet connectivity is currently available on this device or local network.
   */
  public static async isInternetAvailable(): Promise<boolean> {
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      return navigator.onLine;
    }
    return this.isInternetOnline;
  }

  /**
   * Manually sets or simulates internet connectivity status.
   */
  public static setInternetStatus(online: boolean): void {
    this.isInternetOnline = online;
  }

  /**
   * Automatically executes gateway ingestion:
   * 1. Uploads the RSEP to Emergency Server
   * 2. Marks RSEP as DELIVERED in storage
   * 3. Prevents further redundant relaying
   */
  public static async ingestAndDeliverRSEP(
    packet: EmergencyPacket,
    gatewayNodeId: string = "GATEWAY_NODE"
  ): Promise<{ success: boolean; response: ServerDeliveryResponse }> {
    const packetId = packet.header.packetId;
    console.log(`[InternetGatewayManager] 🌐 Node ${gatewayNodeId} acting as Internet Gateway for ${packetId}...`);

    // 1. Upload to Emergency Server
    const response = await EmergencyServerBridge.uploadRSEPToServer(packet);

    // 2. Mark packet as DELIVERED in metadata and storage
    if (response.success) {
      this.deliveredPackets.add(packetId);

      const deliveredPacket: EmergencyPacket = {
        ...packet,
        mesh: {
          ...packet.mesh,
          deliveryStatus: "DELIVERED_TO_GATEWAY",
          gatewayNode: gatewayNodeId,
        },
      };

      await PacketStorage.savePacket(deliveredPacket);
      console.log(`[InternetGatewayManager] 🎯 Packet ${packetId} MARKED AS DELIVERED! Stopping further mesh relay.`);
    }

    return {
      success: response.success,
      response,
    };
  }

  /**
   * Returns whether a packet has already been delivered to the emergency gateway.
   */
  public static isDelivered(packetId: string): boolean {
    return this.deliveredPackets.has(packetId);
  }

  public static resetDeliveryRegistry(): void {
    this.deliveredPackets.clear();
  }
}
