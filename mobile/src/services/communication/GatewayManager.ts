export interface GatewayNodeInfo {
  gatewayId: string;
  nodeName: string;
  signalStrengthDbm: number;
  supportsFastApiSync: boolean;
  discoveredAt: string;
}

/**
 * Mocked Gateway Manager
 * Discovers nearby edge mesh-to-cloud gateways capable of uploading stored emergency queues
 * to the definitive ResQNet FastAPI backend server.
 */
export class GatewayManager {
  private discoveredGateways: Map<string, GatewayNodeInfo> = new Map();
  private activeGatewayId: string | null = "GATEWAY_MOCK_FASTAPI_01";

  constructor() {
    this.discoveredGateways.set("GATEWAY_MOCK_FASTAPI_01", {
      gatewayId: "GATEWAY_MOCK_FASTAPI_01",
      nodeName: "ResQNet Mobile Relay Node #104",
      signalStrengthDbm: -55,
      supportsFastApiSync: true,
      discoveredAt: new Date().toISOString(),
    });
  }

  public discoverGateways(): GatewayNodeInfo[] {
    return Array.from(this.discoveredGateways.values());
  }

  public getActiveGateway(): GatewayNodeInfo | null {
    if (!this.activeGatewayId) return null;
    return this.discoveredGateways.get(this.activeGatewayId) || null;
  }

  public registerGateway(info: GatewayNodeInfo): void {
    this.discoveredGateways.set(info.gatewayId, info);
    this.activeGatewayId = info.gatewayId;
  }

  public clearGateways(): void {
    this.discoveredGateways.clear();
    this.activeGatewayId = null;
  }
}
