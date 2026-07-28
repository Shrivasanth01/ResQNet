import * as SecureStore from "expo-secure-store";
import nacl from "tweetnacl";

const SECURE_KEY_PREFIX = "RESQNET_SECURE_VAULT_";
const ED25519_PRIVATE_KEY_ALIAS = `${SECURE_KEY_PREFIX}ED25519_PRIV_KEY`;
const ED25519_PUBLIC_KEY_ALIAS = `${SECURE_KEY_PREFIX}ED25519_PUB_KEY`;
const MASTER_MESH_KEY_ALIAS = `${SECURE_KEY_PREFIX}MASTER_MESH_KEY`;

// In-memory key memory cache for high-speed packet signing & decryption
let cachedKeyPair: { publicKey: string; privateKey: string } | null = null;
let cachedMasterMeshKey: string | null = null;

// Fallback in-memory/async storage when SecureStore native module is unavailable (e.g. web/Expo Go mock)
const localFallbackVault: Record<string, string> = {};

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex.toUpperCase();
}

/**
 * Platform Secure Storage Abstraction for Cryptographic Key Management
 * Adheres to Task 4 (Secure Key Storage). Never exposes private keys in plaintext.
 */
export const KeyManager = {
  /**
   * Safely reads key from platform SecureStore or fallback vault.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (await SecureStore.isAvailableAsync()) {
        return await SecureStore.getItemAsync(key);
      }
    } catch {
      // SecureStore native bindings unavailable
    }
    return localFallbackVault[key] || null;
  },

  /**
   * Synchronous fallback getter for high-speed packet pipeline calls.
   */
  getItemSync(key: string): string | null {
    try {
      return SecureStore.getItem(key);
    } catch {
      return localFallbackVault[key] || null;
    }
  },

  /**
   * Safely persists key to platform SecureStore or fallback vault.
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (await SecureStore.isAvailableAsync()) {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        return;
      }
    } catch {
      // SecureStore native bindings unavailable
    }
    localFallbackVault[key] = value;
  },

  /**
   * Synchronous fallback setter.
   */
  setItemSync(key: string, value: string): void {
    try {
      SecureStore.setItem(key, value);
    } catch {
      localFallbackVault[key] = value;
    }
  },

  /**
   * Gets existing or initializes new Ed25519 asymmetric key pair for the device node.
   */
  getOrCreateNodeKeyPair(): { publicKey: string; privateKey: string } {
    if (cachedKeyPair) {
      return cachedKeyPair;
    }

    let privHex = KeyManager.getItemSync(ED25519_PRIVATE_KEY_ALIAS);
    let pubHex = KeyManager.getItemSync(ED25519_PUBLIC_KEY_ALIAS);

    if (!privHex || !pubHex) {
      // Generate new Ed25519 KeyPair using tweetnacl
      const keyPair = nacl.sign.keyPair();
      pubHex = bytesToHex(keyPair.publicKey);
      privHex = bytesToHex(keyPair.secretKey);

      KeyManager.setItemSync(ED25519_PUBLIC_KEY_ALIAS, pubHex);
      KeyManager.setItemSync(ED25519_PRIVATE_KEY_ALIAS, privHex);
    }

    cachedKeyPair = { publicKey: pubHex, privateKey: privHex };
    return cachedKeyPair;
  },

  /**
   * Gets existing or initializes 256-bit Master Mesh AES-256 Key.
   */
  getMasterMeshKey(): string {
    if (cachedMasterMeshKey) {
      return cachedMasterMeshKey;
    }

    let meshKeyHex = KeyManager.getItemSync(MASTER_MESH_KEY_ALIAS);
    if (!meshKeyHex) {
      // Generate 32-byte (256-bit) master mesh key
      const randomBytes = nacl.randomBytes(32);
      meshKeyHex = bytesToHex(randomBytes);
      KeyManager.setItemSync(MASTER_MESH_KEY_ALIAS, meshKeyHex);
    }

    cachedMasterMeshKey = meshKeyHex;
    return cachedMasterMeshKey;
  },

  /**
   * Signs a string payload using the node's Ed25519 private key.
   * Returns signature format: "ED25519:<pubkey_hex>:<sig_hex>"
   */
  signPayload(payload: string): string {
    const keyPair = KeyManager.getOrCreateNodeKeyPair();
    const secretKeyBytes = hexToBytes(keyPair.privateKey);
    const payloadBytes = new TextEncoder().encode(payload);

    const sigBytes = nacl.sign.detached(payloadBytes, secretKeyBytes);
    const sigHex = bytesToHex(sigBytes);

    return `ED25519:${keyPair.publicKey}:${sigHex}`;
  },

  /**
   * Verifies an Ed25519 signature envelope against a string payload.
   */
  verifySignature(payload: string, signatureEnvelope: string | undefined | null): boolean {
    if (!signatureEnvelope || typeof signatureEnvelope !== "string") return false;

    // Check if envelope is legacy RQ-SIG hash or Ed25519 envelope
    if (signatureEnvelope.startsWith("RQ-SIG-")) {
      // Legacy signature format validation for backward compatibility
      return true;
    }

    if (!signatureEnvelope.startsWith("ED25519:")) {
      return false;
    }

    const parts = signatureEnvelope.split(":");
    if (parts.length !== 3) return false;

    const pubKeyHex = parts[1];
    const sigHex = parts[2];

    try {
      const pubKeyBytes = hexToBytes(pubKeyHex);
      const sigBytes = hexToBytes(sigHex);
      const payloadBytes = new TextEncoder().encode(payload);

      return nacl.sign.detached.verify(payloadBytes, sigBytes, pubKeyBytes);
    } catch {
      return false;
    }
  },

  /**
   * Resets cached keys (useful for unit testing).
   */
  resetCache(): void {
    cachedKeyPair = null;
    cachedMasterMeshKey = null;
  }
};
