import { CommunicationMethod, NetworkState } from "./CommunicationTypes";

/**
 * Intelligent Route Selector
 * 
 * DESIGN PRINCIPLE:
 * Determines the primary and backup communication channels based on strict architectural priority:
 * 1. Internet (FastAPI Cloud Server)
 * 2. Bluetooth Mesh (P2P decentralized radio hopping)
 * 3. Wi-Fi Direct (High-bandwidth peer sharing)
 * 4. SMS (Cellular text carrier fallback)
 * 5. Satellite (Emergency LEO satellite uplink)
 * 6. Offline Queue (Local ACID repository retention until connectivity restores)
 */
export class RouteSelector {
  public selectBestRoute(network: NetworkState): CommunicationMethod {
    if (network.internetAvailable && network.networkQualityScore >= 50) {
      return "INTERNET";
    }
    if (network.bluetoothAvailable && network.batteryLevel > 10) {
      return "BLUETOOTH_MESH";
    }
    if (network.wifiAvailable && network.currentNetworkType !== "NONE") {
      return "WIFI_DIRECT";
    }
    // Check fallback simulated carrier indicators
    if (network.currentNetworkType === "CELLULAR_4G" || network.currentNetworkType === "CELLULAR_5G") {
      return "SMS";
    }
    if (network.gpsStatus === "LOCKED" && network.batteryLevel > 30) {
      return "SATELLITE";
    }
    return "OFFLINE_QUEUE";
  }

  public getFallbackChain(network: NetworkState): CommunicationMethod[] {
    const chain: CommunicationMethod[] = [];
    if (network.internetAvailable) chain.push("INTERNET");
    if (network.bluetoothAvailable) chain.push("BLUETOOTH_MESH");
    if (network.wifiAvailable) chain.push("WIFI_DIRECT");
    chain.push("SMS");
    chain.push("SATELLITE");
    chain.push("OFFLINE_QUEUE");
    return chain;
  }
}
