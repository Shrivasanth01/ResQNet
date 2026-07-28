import { NetworkState } from "./CommunicationTypes";

export class NetworkMonitor {
  private state: NetworkState = {
    internetAvailable: true,
    bluetoothAvailable: true,
    wifiAvailable: true,
    gpsStatus: "LOCKED",
    batteryLevel: 88,
    currentNetworkType: "WIFI",
    lastSuccessfulCommunication: new Date().toISOString(),
    networkQualityScore: 95,
  };

  private listeners: Array<(state: NetworkState) => void> = [];

  constructor(initialState?: Partial<NetworkState>) {
    if (initialState) {
      this.state = { ...this.state, ...initialState };
    }
  }

  public getNetworkState(): NetworkState {
    return { ...this.state };
  }

  public setNetworkState(updates: Partial<NetworkState>): NetworkState {
    this.state = { ...this.state, ...updates };
    this.recalculateQualityScore();
    this.notifyListeners();
    return this.getNetworkState();
  }

  public recordSuccess(): void {
    this.state.lastSuccessfulCommunication = new Date().toISOString();
    if (this.state.networkQualityScore < 100) {
      this.state.networkQualityScore = Math.min(100, this.state.networkQualityScore + 5);
    }
  }

  public recordFailure(): void {
    this.state.networkQualityScore = Math.max(0, this.state.networkQualityScore - 15);
  }

  public subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private recalculateQualityScore(): void {
    let score = 0;
    if (this.state.internetAvailable) score += 50;
    if (this.state.wifiAvailable) score += 20;
    if (this.state.bluetoothAvailable) score += 20;
    if (this.state.gpsStatus === "LOCKED") score += 10;

    if (this.state.batteryLevel < 15) {
      score = Math.round(score * 0.75); // Throttle score on extreme battery depletion
    }
    this.state.networkQualityScore = Math.min(100, Math.max(0, score));
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getNetworkState());
      } catch (e) {
        console.error("NetworkMonitor listener error:", e);
      }
    }
  }
}
