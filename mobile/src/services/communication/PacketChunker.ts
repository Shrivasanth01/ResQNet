import { IChunkingContract } from "./CommunicationTypes";

/**
 * Pluggable MTU Chunking Architecture
 * Divides outgoing data payloads into precisely sized byte segments to traverse low-bandwidth
 * Bluetooth Low Energy (BLE GATT) or Satellite frames without packet drop.
 */
export class PacketChunker implements IChunkingContract {
  public static chunk(payload: string, mtuSize: number = 256, _packetId?: string): string[] {
    if (mtuSize <= 0) throw new Error("MTU size must be positive.");
    const chunks: string[] = [];
    const total = Math.ceil(payload.length / mtuSize);
    for (let i = 0; i < total; i++) {
      chunks.push(payload.substring(i * mtuSize, (i + 1) * mtuSize));
    }
    return chunks;
  }

  public static reassemble(chunks: string[]): string {
    if (!chunks || chunks.length === 0) return "";
    return chunks.join("");
  }

  public async chunk(payload: string, mtuSize: number = 256): Promise<string[]> {
    return PacketChunker.chunk(payload, mtuSize);
  }

  public async reassemble(chunks: string[]): Promise<string> {
    return PacketChunker.reassemble(chunks);
  }
}
