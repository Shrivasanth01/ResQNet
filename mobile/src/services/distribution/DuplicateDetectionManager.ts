/**
 * MODULE 7: DUPLICATE PROTECTION
 * 
 * CORE REQUIREMENT ENFORCEMENT:
 * - Every RSEP has a unique identifier (packetId).
 * - When a device receives an RSEP:
 *     - Check whether this RSEP was already received.
 *     - If new: mark as RECEIVED, allow processing & relaying.
 *     - If duplicate: DUPLICATE → IGNORE.
 * - Prevents the same RSEP from continuously circulating in loop storms between devices.
 */
export class DuplicateDetectionManager {
  private static receivedRSEPRegistry: Map<string, { receivedAt: number; hopCount: number }> = new Map();
  private static duplicateCount: number = 0;
  private static readonly MAX_CACHE_SIZE = 5000;

  /**
   * Checks if an RSEP has already been received and processed.
   * If it is new, it records the ID and returns false (not duplicate).
   * If already seen, it increments duplicate counter and returns true (duplicate -> ignore).
   */
  public static isDuplicate(packetId: string, hopCount: number = 0): boolean {
    if (!packetId) return false;

    if (this.receivedRSEPRegistry.has(packetId)) {
      this.duplicateCount++;
      console.log(`[DuplicateDetectionManager] 🛑 DUPLICATE DETECTED -> IGNORE packet ${packetId} (Total suppressed: ${this.duplicateCount})`);
      return true;
    }

    // Record as RECEIVED
    this.recordReceived(packetId, hopCount);
    return false;
  }

  /**
   * Records that an RSEP has been received.
   */
  public static recordReceived(packetId: string, hopCount: number = 0): void {
    if (!packetId) return;

    if (this.receivedRSEPRegistry.size >= this.MAX_CACHE_SIZE) {
      // Evict oldest entry (LRU)
      const oldestKey = this.receivedRSEPRegistry.keys().next().value;
      if (oldestKey) {
        this.receivedRSEPRegistry.delete(oldestKey);
      }
    }

    this.receivedRSEPRegistry.set(packetId, {
      receivedAt: Date.now(),
      hopCount,
    });
    console.log(`[DuplicateDetectionManager] 📝 Stored ${packetId} = RECEIVED (Hop ${hopCount})`);
  }

  /**
   * Checks if a packetId is already in registry without adding it.
   */
  public static hasBeenReceived(packetId: string): boolean {
    return this.receivedRSEPRegistry.has(packetId);
  }

  /**
   * Returns total count of duplicate loops prevented.
   */
  public static getDuplicateSuppressionCount(): number {
    return this.duplicateCount;
  }

  /**
   * Resets registry (for diagnostics and testing).
   */
  public static resetRegistry(): void {
    this.receivedRSEPRegistry.clear();
    this.duplicateCount = 0;
  }
}
