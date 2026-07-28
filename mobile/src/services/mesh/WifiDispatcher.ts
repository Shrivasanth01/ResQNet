import { IDispatcher } from "../communication/CommunicationTypes";
import { EmergencyPacket } from "../../types/packet";
import { PacketEncryption } from "../packet/PacketEncryption";
import { MeshRelay } from "./MeshRelay";
import { PeerManager } from "./PeerManager";
import { MeshLogger } from "./MeshLogger";

/**
 * Real Wi-Fi Direct & Local Network P2P Dispatcher
 * 
 * DESIGN PRINCIPLE:
 * Implements our Phase 2.75 IDispatcher contract for megabit Wi-Fi P2P Group Owner and local mDNS discovery.
 * Ensures zero plaintext PHI transmission over open Wi-Fi channels by encrypting before relaying.
 */
export class WifiDispatcher implements IDispatcher {
  public readonly type = "WIFI_DIRECT";
  private mdnsServiceType: string = "_resqnet-emergency._udp.local.";
  private isWifiDirectEnabled: boolean = true;

  constructor() {
    MeshLogger.info("DISCOVERY", `Initialized Wi-Fi Direct P2P Dispatcher [mDNS Target: ${this.mdnsServiceType}]`);
  }

  /**
   * Verifies if local Wi-Fi Direct / local network peers are discovered on the tactical radar.
   */
  public isAvailable(): boolean {
    const wifiPeers = PeerManager.getActivePeers().filter(p => p.transport === "WIFI_DIRECT" || p.transport === "LOCAL_MDNS");
    return this.isWifiDirectEnabled && wifiPeers.length > 0;
  }

  /**
   * Encrypts and transmits packet across high-speed local P2P Wi-Fi Direct channel.
   */
  public async dispatch(packet: EmergencyPacket): Promise<string | null> {
    const encryptedPacket = PacketEncryption.encryptPacket(packet);
    const packetId = encryptedPacket.header.packetId;
    MeshLogger.info("RELAY", `[WifiDispatcher] Initiating Wi-Fi Direct P2P sync for packet ${packetId}...`);

    try {
      // Execute transmission via Mesh Relay engine
      const relayRes = await MeshRelay.relayPacket(encryptedPacket, true);

      if (relayRes.success) {
        const outcome = relayRes.stored 
          ? "QUEUED_STORE_AND_FORWARD" 
          : `SYNCED_VIA_WIFI_DIRECT_PEER_${relayRes.targetPeerId}`;
        MeshLogger.info("RELAY", `[WifiDispatcher] Successfully synced packet ${packetId}: ${outcome}`);
        return outcome;
      } else {
        MeshLogger.warn("RELAY", `[WifiDispatcher] Wi-Fi sync failed for ${packetId}: ${relayRes.reason}`);
        return null;
      }
    } catch (e: any) {
      MeshLogger.error("RELAY", `[WifiDispatcher] Exception during Wi-Fi P2P dispatch: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }

  public getServiceType(): string {
    return this.mdnsServiceType;
  }
}
