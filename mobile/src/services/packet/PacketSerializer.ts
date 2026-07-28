import { EmergencyPacket } from "../../types/packet";
import { PacketValidator } from "./PacketValidator";

export interface SerializedPacketChunk {
  packetId: string;
  chunkIndex: number;
  totalChunks: number;
  payloadHex: string;
}

export const PacketSerializer = {
  /**
   * Converts EmergencyPacket object into pretty or minified JSON string for FastAPI Cloud Sync POST requests
   */
  toJson: (packet: EmergencyPacket, pretty: boolean = false): string => {
    const val = PacketValidator.validate(packet);
    if (!val.isValid) {
      throw new Error(`Cannot serialize invalid packet: ${val.errors.join("; ")}`);
    }
    return JSON.stringify(packet, null, pretty ? 2 : undefined);
  },

  /**
   * Reconstitutes an EmergencyPacket from JSON payload string
   */
  fromJson: (jsonString: string): EmergencyPacket => {
    const parsed = JSON.parse(jsonString);
    const val = PacketValidator.validate(parsed);
    if (!val.isValid) {
      throw new Error(`Deserialized packet fails integrity checks: ${val.errors.join("; ")}`);
    }
    return parsed as EmergencyPacket;
  },

  /**
   * Converts packet into URL-safe Base64 compressed string for QR code generation and Wi-Fi Direct p2p transfer
   */
  toBase64: (packet: EmergencyPacket): string => {
    const jsonStr = PacketSerializer.toJson(packet, false);
    if (typeof btoa === "function") {
      return btoa(encodeURIComponent(jsonStr));
    }
    return Buffer.from(jsonStr, "utf8").toString("base64");
  },

  /**
   * Reconstitutes packet from Base64 encoded string
   */
  fromBase64: (base64String: string): EmergencyPacket => {
    let jsonStr = "";
    if (typeof atob === "function") {
      jsonStr = decodeURIComponent(atob(base64String));
    } else {
      jsonStr = Buffer.from(base64String, "base64").toString("utf8");
    }
    return PacketSerializer.fromJson(jsonStr);
  },

  /**
   * Chunks serialized packet into tiny byte segments suitable for low-bandwidth BLE GATT Characteristics (e.g. 512-byte MTU)
   */
  toBleChunks: (packet: EmergencyPacket, mtuSize: number = 256): SerializedPacketChunk[] => {
    const base64Str = PacketSerializer.toBase64(packet);
    const chunks: SerializedPacketChunk[] = [];
    const total = Math.ceil(base64Str.length / mtuSize);

    for (let i = 0; i < total; i++) {
      const slice = base64Str.substring(i * mtuSize, (i + 1) * mtuSize);
      // Represent slice as hex string for hardware RF transmission
      let hex = "";
      for (let j = 0; j < slice.length; j++) {
        hex += slice.charCodeAt(j).toString(16).padStart(2, "0");
      }
      chunks.push({
        packetId: packet.header.packetId,
        chunkIndex: i,
        totalChunks: total,
        payloadHex: hex,
      });
    }
    return chunks;
  },

  /**
   * Reassembles BLE GATT hex chunks back into complete EmergencyPacket
   */
  fromBleChunks: (chunks: SerializedPacketChunk[]): EmergencyPacket => {
    if (!chunks || chunks.length === 0) {
      throw new Error("No BLE chunks provided for reassembly.");
    }
    // Sort chunks sequentially by index
    const sorted = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
    let base64Str = "";
    for (const ch of sorted) {
      const hex = ch.payloadHex;
      for (let i = 0; i < hex.length; i += 2) {
        base64Str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
      }
    }
    return PacketSerializer.fromBase64(base64Str);
  }
};
