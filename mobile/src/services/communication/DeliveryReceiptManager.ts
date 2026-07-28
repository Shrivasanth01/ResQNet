import { DeliveryReceipt, ReceiptStatus, CommunicationMethod } from "./CommunicationTypes";

export class DeliveryReceiptManager {
  private receipts: Map<string, DeliveryReceipt> = new Map();

  public createReceipt(packetId: string, method: CommunicationMethod, nodeId: string = "LOCAL_NODE_01"): DeliveryReceipt {
    const receipt: DeliveryReceipt = {
      receiptId: `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      packetId,
      status: "CREATED",
      communicationMethod: method,
      nodeId,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    this.receipts.set(packetId, receipt);
    return { ...receipt };
  }

  public updateStatus(
    packetId: string,
    newStatus: ReceiptStatus,
    method?: CommunicationMethod,
    gatewayId?: string,
    error?: string
  ): DeliveryReceipt | null {
    const existing = this.receipts.get(packetId);
    if (!existing) return null;

    existing.status = newStatus;
    existing.timestamp = new Date().toISOString();
    if (method) existing.communicationMethod = method;
    if (gatewayId) existing.gatewayId = gatewayId;
    if (error) existing.lastError = error;
    if (newStatus === "FAILED" || newStatus === "DISPATCHING") {
      existing.retryCount += 1;
    }

    this.receipts.set(packetId, existing);
    return { ...existing };
  }

  public getReceipt(packetId: string): DeliveryReceipt | null {
    const res = this.receipts.get(packetId);
    return res ? { ...res } : null;
  }

  public getAllReceipts(): DeliveryReceipt[] {
    return Array.from(this.receipts.values()).map((r) => ({ ...r }));
  }

  public clearReceipts(): void {
    this.receipts.clear();
  }
}
