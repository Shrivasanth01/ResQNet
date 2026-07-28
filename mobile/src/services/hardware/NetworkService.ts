import * as Network from "expo-network";
import { Platform } from "react-native";

export interface HardwareNetworkTelemetry {
  isConnected: boolean;
  isInternetReachable: boolean;
  networkType: "WIFI" | "CELLULAR" | "VPN" | "NONE" | "UNKNOWN";
  isAirplaneMode: boolean;
  timestamp: number;
}

type NetworkCallback = (data: HardwareNetworkTelemetry) => void;

/**
 * Hardware Network Diagnostics Service
 * 
 * Evaluates real-time cellular internet availability, Wi-Fi link connectivity, and airplane mode disruptions via expo-network.
 * Directly informs the Phase 2.75 RouteSelector and Phase 5 GatewaySync automatic cloud promotion logic.
 */
class NetworkServiceClass {
  private listeners: NetworkCallback[] = [];
  private checkInterval: any = null;
  private lastReading: HardwareNetworkTelemetry = {
    isConnected: true,
    isInternetReachable: true,
    networkType: "WIFI",
    isAirplaneMode: false,
    timestamp: Date.now()
  };

  public async initialize(): Promise<HardwareNetworkTelemetry> {
    await this.refreshNetworkState();
    if (!this.checkInterval && Platform.OS !== "web") {
      this.checkInterval = setInterval(() => {
        this.refreshNetworkState();
      }, 5000);
    }
    return { ...this.lastReading };
  }

  public async refreshNetworkState(): Promise<HardwareNetworkTelemetry> {
    try {
      if (Platform.OS !== "web") {
        const state = await Network.getNetworkStateAsync();
        const airplane = await Network.isAirplaneModeEnabledAsync();

        let type: HardwareNetworkTelemetry["networkType"] = "UNKNOWN";
        if (state.type === Network.NetworkStateType.WIFI) type = "WIFI";
        else if (state.type === Network.NetworkStateType.CELLULAR) type = "CELLULAR";
        else if (state.type === Network.NetworkStateType.VPN) type = "VPN";
        else if (!state.isConnected) type = "NONE";

        const updated: HardwareNetworkTelemetry = {
          isConnected: state.isConnected ?? false,
          isInternetReachable: (state.isInternetReachable ?? false) && !airplane,
          networkType: type,
          isAirplaneMode: airplane,
          timestamp: Date.now()
        };

        if (JSON.stringify(updated) !== JSON.stringify(this.lastReading)) {
          this.lastReading = updated;
          this.notifyListeners();
        }
      }
    } catch (e) {
      console.warn("[NetworkService] Hardware network evaluation exception. Using standby state:", e);
    }
    return { ...this.lastReading };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener({ ...this.lastReading });
    }
  }

  public subscribe(callback: NetworkCallback): () => void {
    this.listeners.push(callback);
    callback({ ...this.lastReading });
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public getLatestReading(): HardwareNetworkTelemetry {
    return { ...this.lastReading };
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Diagnostic simulation ingestion allowing automated evaluations of total cellular blackout and airplane mode toggling.
   */
  public simulateNetwork(isConnected: boolean, isInternetReachable: boolean, type: HardwareNetworkTelemetry["networkType"] = "WIFI", isAirplaneMode: boolean = false): void {
    this.lastReading = {
      isConnected,
      isInternetReachable: isInternetReachable && !isAirplaneMode,
      networkType: type,
      isAirplaneMode,
      timestamp: Date.now()
    };
    this.notifyListeners();
  }
}

export const NetworkService = new NetworkServiceClass();
