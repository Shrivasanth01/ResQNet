import { PeerNode, TransportType, PeerStatus } from "./MeshTypes";
import { MeshLogger } from "./MeshLogger";

/**
 * Decentralized Peer Registry
 * 
 * Maintains active inventory of discovered regional smartphones, tracking RSSI signal strength in dBm,
 * battery reserves, and gateway connectivity flags.
 */
class PeerManagerService {
  private peers: Map<string, PeerNode> = new Map();
  private myNodeId: string = `NODE_${Math.floor(Math.random() * 89999 + 10000).toString(16).toUpperCase()}`;

  public getMyNodeId(): string {
    return this.myNodeId;
  }

  public setMyNodeId(id: string) {
    this.myNodeId = id;
  }

  public registerOrUpdatePeer(
    peerId: string,
    name: string,
    transport: TransportType,
    rssi: number,
    batteryLevel: number,
    isGateway: boolean = false,
    gatewayLatencyMs: number = 0
  ): PeerNode {
    const now = Date.now();
    let peer = this.peers.get(peerId);

    if (!peer) {
      peer = {
        peerId,
        name,
        transport,
        rssi,
        batteryLevel,
        isGateway,
        gatewayLatencyMs,
        lastSeen: now,
        status: "DISCOVERED",
        capabilities: {
          canRelay: batteryLevel > 15,
          supportsEncryption: true,
          maxMtu: transport === "BLE" ? 512 : 4096
        }
      };
      this.peers.set(peerId, peer);
      MeshLogger.info("DISCOVERY", `New peer discovered: ${name} (${peerId}) via ${transport} [${rssi} dBm, Battery: ${batteryLevel}%]`);
    } else {
      peer.lastSeen = now;
      peer.rssi = rssi;
      peer.batteryLevel = batteryLevel;
      peer.isGateway = isGateway;
      if (isGateway) peer.gatewayLatencyMs = gatewayLatencyMs;
      if (peer.status === "LOST" || peer.status === "DISCONNECTED") {
        peer.status = "DISCOVERED";
        MeshLogger.info("DISCOVERY", `Previously lost peer re-discovered: ${name} (${peerId})`);
      }
    }

    return peer;
  }

  public updatePeerStatus(peerId: string, status: PeerStatus) {
    const peer = this.peers.get(peerId);
    if (peer && peer.status !== status) {
      peer.status = status;
      MeshLogger.info("DISCOVERY", `Peer ${peer.name} (${peerId}) status transitioned to ${status}`);
    }
  }

  public removePeer(peerId: string) {
    if (this.peers.has(peerId)) {
      this.peers.delete(peerId);
      MeshLogger.info("DISCOVERY", `Removed peer ${peerId} from registry.`);
    }
  }

  public getPeer(peerId: string): PeerNode | undefined {
    return this.peers.get(peerId);
  }

  public getAllPeers(): PeerNode[] {
    return Array.from(this.peers.values());
  }

  public getActivePeers(): PeerNode[] {
    const cutoff = Date.now() - 30000; // 30 seconds inactivity threshold
    return Array.from(this.peers.values()).filter(p => p.lastSeen >= cutoff && p.status !== "LOST");
  }

  public getConnectedPeers(): PeerNode[] {
    return this.getActivePeers().filter(p => p.status === "CONNECTED");
  }

  public getBestGatewayPeer(): PeerNode | undefined {
    const gateways = this.getActivePeers().filter(p => p.isGateway && p.capabilities.canRelay);
    if (gateways.length === 0) return undefined;
    
    // Sort by lowest latency and strongest RSSI
    return gateways.sort((a, b) => {
      const latA = a.gatewayLatencyMs || 999;
      const latB = b.gatewayLatencyMs || 999;
      if (latA !== latB) return latA - latB;
      return b.rssi - a.rssi;
    })[0];
  }

  public getBestRelayPeer(excludePeerIds: string[] = []): PeerNode | undefined {
    const available = this.getActivePeers().filter(
      p => !excludePeerIds.includes(p.peerId) && p.capabilities.canRelay
    );
    if (available.length === 0) return undefined;
    
    // Pick node with highest RSSI and best battery level
    return available.sort((a, b) => (b.rssi + b.batteryLevel) - (a.rssi + a.batteryLevel))[0];
  }

  public clearRegistry() {
    this.peers.clear();
  }
}

export const PeerManager = new PeerManagerService();
