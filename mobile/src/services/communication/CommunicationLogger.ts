import { CommunicationLogEvent, CommunicationMethod } from "./CommunicationTypes";

export class CommunicationLogger {
  private logHistory: CommunicationLogEvent[] = [];

  public log(
    packetId: string,
    method: CommunicationMethod,
    nodeId: string,
    gatewayId: string,
    action: string,
    result: "SUCCESS" | "FAILURE" | "PENDING" | "SUPPRESSED",
    latencyMs: number
  ): CommunicationLogEvent {
    const entry: CommunicationLogEvent = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      timestamp: new Date().toISOString(),
      packetId,
      communicationMethod: method,
      nodeId,
      gatewayId,
      action,
      result,
      latencyMs,
    };

    this.logHistory.unshift(entry);
    if (this.logHistory.length > 500) {
      this.logHistory = this.logHistory.slice(0, 500); // Retain latest 500 routing telemetry events
    }
    return entry;
  }

  public getLogs(packetId?: string): CommunicationLogEvent[] {
    if (packetId) {
      return this.logHistory.filter((e) => e.packetId === packetId);
    }
    return [...this.logHistory];
  }

  public clearLogs(): void {
    this.logHistory = [];
  }
}
