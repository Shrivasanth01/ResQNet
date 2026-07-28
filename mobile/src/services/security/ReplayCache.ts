/**
 * Replay Attack Protection Cache
 * Adheres to Task 3 (Replay Protection).
 * Tracks processed packet IDs and digital signature hashes to prevent double-forwarding and replay flooding.
 */
export class ReplayCacheEngine {
  private cache: Map<string, number> = new Map();
  private maxEntries: number;
  private ttlMs: number;

  constructor(maxEntries: number = 5000, ttlMs: number = 24 * 3600 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * Checks if packet ID or signature has been processed within the expiration window.
   */
  public has(identifier: string): boolean {
    if (!identifier) return false;

    const timestamp = this.cache.get(identifier);
    if (!timestamp) return false;

    // Check if entry expired
    if (Date.now() - timestamp > this.ttlMs) {
      this.cache.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Adds packet ID or signature hash to replay protection cache.
   */
  public add(identifier: string): void {
    if (!identifier) return;

    // Evict oldest entries if cache capacity exceeded
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(identifier, Date.now());
  }

  /**
   * Clears expired entries from memory.
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gets total tracked entries.
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Resets cache state.
   */
  public clear(): void {
    this.cache.clear();
  }
}

export const ReplayCache = new ReplayCacheEngine();
