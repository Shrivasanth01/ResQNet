import { PeerManager } from "./PeerManager";
import { PeerNode, PeerStatus } from "./MeshTypes";
import { MeshLogger } from "./MeshLogger";

/**
 * Connection Manager & Disconnection Recovery Engine
 * 
 * Manages active RF transport connections. When sudden link failure occurs (e.g., an ambulance driving out of range),
 * this engine automatically executes exponential reconnection attempts or notifies upper layers to reroute via alternate hops.
 */
class ConnectionManagerService {
  private activeSockets: Set<string> = new Set();
  private reconnectTimers: Map<string, any> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();

  public async connectToPeer(peerId: string): Promise<boolean> {
    const peer = PeerManager.getPeer(peerId);
    if (!peer) {
      MeshLogger.warn("RELAY", `Cannot connect to unknown peer ID: ${peerId}`);
      return false;
    }

    if (peer.status === "CONNECTED" && this.activeSockets.has(peerId)) {
      return true;
    }

    PeerManager.updatePeerStatus(peerId, "CONNECTING");
    MeshLogger.info("RELAY", `Initiating ${peer.transport} socket handshake with ${peer.name} (${peerId})...`);

    // Simulate rapid socket establishment
    await new Promise((resolve) => setTimeout(resolve, 60));

    this.activeSockets.add(peerId);
    this.reconnectAttempts.set(peerId, 0);
    if (this.reconnectTimers.has(peerId)) {
      clearTimeout(this.reconnectTimers.get(peerId)!);
      this.reconnectTimers.delete(peerId);
    }

    PeerManager.updatePeerStatus(peerId, "CONNECTED");
    MeshLogger.info("RELAY", `Successfully connected to peer ${peer.name} (${peerId}). Active socket pool: ${this.activeSockets.size}`);
    return true;
  }

  public disconnectPeer(peerId: string, reason: string = "Normal closure"): void {
    if (this.activeSockets.has(peerId)) {
      this.activeSockets.delete(peerId);
      PeerManager.updatePeerStatus(peerId, "DISCONNECTED");
      MeshLogger.info("RELAY", `Disconnected from peer ${peerId}. Reason: ${reason}`);
    }
  }

  public handleUnexpectedDisconnection(peerId: string): void {
    this.activeSockets.delete(peerId);
    PeerManager.updatePeerStatus(peerId, "DISCONNECTED");
    MeshLogger.warn("RELAY", `Unexpected disconnection from peer ${peerId}! Triggering automatic recovery protocol.`);

    const attempts = (this.reconnectAttempts.get(peerId) || 0) + 1;
    this.reconnectAttempts.set(peerId, attempts);

    if (attempts > 5) {
      MeshLogger.error("RELAY", `Max recovery attempts exceeded for peer ${peerId}. Marking node as LOST.`);
      PeerManager.updatePeerStatus(peerId, "LOST");
      this.reconnectAttempts.delete(peerId);
      return;
    }

    // Exponential backoff math: 2s, 4s, 8s, 16s...
    const delay = Math.min(2000 * Math.pow(2, attempts - 1), 30000);
    MeshLogger.info("RELAY", `Scheduling automated reconnect attempt ${attempts} for peer ${peerId} in ${delay}ms`);

    const timer = setTimeout(async () => {
      this.reconnectTimers.delete(peerId);
      MeshLogger.info("RELAY", `Executing automated recovery attempt ${attempts} for peer ${peerId}...`);
      const restored = await this.connectToPeer(peerId);
      if (!restored) {
        this.handleUnexpectedDisconnection(peerId);
      } else {
        MeshLogger.info("RELAY", `Recovery protocol SUCCESSFUL: Restored link to peer ${peerId}!`);
      }
    }, delay);

    this.reconnectTimers.set(peerId, timer);
  }

  public getConnectedSocketCount(): number {
    return this.activeSockets.size;
  }

  public isConnected(peerId: string): boolean {
    return this.activeSockets.has(peerId);
  }

  public disconnectAll(): void {
    for (const peerId of this.activeSockets) {
      this.disconnectPeer(peerId, "System reset / shutdown");
    }
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();
    this.reconnectAttempts.clear();
  }
}

export const ConnectionManager = new ConnectionManagerService();
