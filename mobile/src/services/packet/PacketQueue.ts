import { EmergencyPacket, IncidentSeverity } from "../../types/packet";
import { PacketStorage } from "./PacketStorage";

export interface PacketQueueContract {
  enqueue(packet: EmergencyPacket): Promise<void>;
  dequeue(): Promise<EmergencyPacket | undefined>;
  peek(): Promise<EmergencyPacket | undefined>;
  getQueueSize(): Promise<number>;
  getAllQueued(): Promise<EmergencyPacket[]>;
  removeById(packetId: string): Promise<boolean>;
  syncFromStorage(): Promise<void>;
}

const SEVERITY_WEIGHTS: Record<IncidentSeverity, number> = {
  CRITICAL: 500,
  HIGH: 400,
  MODERATE: 300,
  LOW: 200,
  INFO: 100,
};

let inMemoryQueue: EmergencyPacket[] = [];

const sortQueue = (): void => {
  inMemoryQueue.sort((a, b) => {
    const scoreA = (SEVERITY_WEIGHTS[a.incident.severity] || 0) + a.incident.emergencyConfidenceScore;
    const scoreB = (SEVERITY_WEIGHTS[b.incident.severity] || 0) + b.incident.emergencyConfidenceScore;
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // Highest combined threat score first
    }
    return new Date(a.header.timestamp).getTime() - new Date(b.header.timestamp).getTime();
  });
};

/**
 * Intelligent Priority-Based Packet Queue
 * 
 * Sorting Rule:
 * 1. Primary Weight: Incident Severity (CRITICAL > HIGH > MODERATE > LOW > INFO)
 * 2. Secondary Weight: Emergency Confidence Score (ECS from 0 to 100)
 * 3. Tie-breaker: Timestamp (oldest waiting broadcasts transmit first)
 */
export const PacketQueue: PacketQueueContract = {
  syncFromStorage: async (): Promise<void> => {
    const stored = await PacketStorage.getAllPackets();
    inMemoryQueue = stored.filter(p => p.mesh.deliveryStatus === "QUEUED" || p.mesh.deliveryStatus === "TRANSMITTING");
    sortQueue();
  },

  enqueue: async (packet: EmergencyPacket): Promise<void> => {
    const updated: EmergencyPacket = {
      ...packet,
      mesh: { ...packet.mesh, deliveryStatus: "QUEUED" }
    };
    // Replace if already queued
    const existingIndex = inMemoryQueue.findIndex(p => p.header.packetId === updated.header.packetId);
    if (existingIndex >= 0) {
      inMemoryQueue[existingIndex] = updated;
    } else {
      inMemoryQueue.push(updated);
    }
    sortQueue();
    await PacketStorage.savePacket(updated);
  },

  dequeue: async (): Promise<EmergencyPacket | undefined> => {
    if (inMemoryQueue.length === 0) {
      await PacketQueue.syncFromStorage();
    }
    const next = inMemoryQueue.shift();
    if (next) {
      const transmitting: EmergencyPacket = {
        ...next,
        mesh: { ...next.mesh, deliveryStatus: "TRANSMITTING", lastAttemptTimestamp: new Date().toISOString() }
      };
      await PacketStorage.savePacket(transmitting);
      return transmitting;
    }
    return undefined;
  },

  peek: async (): Promise<EmergencyPacket | undefined> => {
    if (inMemoryQueue.length === 0) {
      await PacketQueue.syncFromStorage();
    }
    return inMemoryQueue[0];
  },

  getQueueSize: async (): Promise<number> => {
    if (inMemoryQueue.length === 0) {
      await PacketQueue.syncFromStorage();
    }
    return inMemoryQueue.length;
  },

  getAllQueued: async (): Promise<EmergencyPacket[]> => {
    if (inMemoryQueue.length === 0) {
      await PacketQueue.syncFromStorage();
    }
    return [...inMemoryQueue];
  },

  removeById: async (packetId: string): Promise<boolean> => {
    inMemoryQueue = inMemoryQueue.filter(p => p.header.packetId !== packetId);
    return await PacketStorage.removePacket(packetId);
  },
};
