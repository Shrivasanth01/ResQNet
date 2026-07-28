import { EmergencyPacket } from "../../types/packet";
import { DatabaseService } from "../db";

const STORAGE_KEY = "resqnet_packet_outbox_vault";

export interface PacketStorageContract {
  savePacket(packet: EmergencyPacket): Promise<boolean>;
  getPacketById(packetId: string): Promise<EmergencyPacket | null>;
  getAllPackets(): Promise<EmergencyPacket[]>;
  removePacket(packetId: string): Promise<boolean>;
  clearStorage(): Promise<boolean>;
}

/**
 * Offline Resilient Packet Outbox Repository
 * Persists queued and relayed emergency broadcasts into SQLite / local vault storage so
 * distress signals withstand application restarts or unexpected battery exhaustion.
 */
export const PacketStorage: PacketStorageContract = {
  getAllPackets: async (): Promise<EmergencyPacket[]> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (item) return JSON.parse(item);
      }
      // Attempt reading via SQLite Application Settings schema
      const profile = await DatabaseService.getEmergencyProfile();
      const storedJson = profile.settings?.[STORAGE_KEY];
      if (storedJson) {
        return JSON.parse(storedJson);
      }
    } catch (err) {
      console.warn("Failed reading packet outbox storage, returning empty array:", err);
    }
    return [];
  },

  savePacket: async (packet: EmergencyPacket): Promise<boolean> => {
    try {
      const current = await PacketStorage.getAllPackets();
      const idx = current.findIndex(p => p.header.packetId === packet.header.packetId);
      if (idx >= 0) {
        current[idx] = packet;
      } else {
        current.push(packet);
      }
      const serialized = JSON.stringify(current);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, serialized);
      }
      await DatabaseService.saveAppSetting(STORAGE_KEY, serialized);
      return true;
    } catch (err) {
      console.warn("Could not save packet to storage:", err);
      return false;
    }
  },

  getPacketById: async (packetId: string): Promise<EmergencyPacket | null> => {
    const all = await PacketStorage.getAllPackets();
    return all.find(p => p.header.packetId === packetId) || null;
  },

  removePacket: async (packetId: string): Promise<boolean> => {
    try {
      const current = await PacketStorage.getAllPackets();
      const filtered = current.filter(p => p.header.packetId !== packetId);
      const serialized = JSON.stringify(filtered);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, serialized);
      }
      await DatabaseService.saveAppSetting(STORAGE_KEY, serialized);
      return true;
    } catch (err) {
      return false;
    }
  },

  clearStorage: async (): Promise<boolean> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      await DatabaseService.saveAppSetting(STORAGE_KEY, "[]");
      return true;
    } catch (err) {
      return false;
    }
  },
};
