import os
import hashlib
from typing import Tuple, Optional
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey, Ed25519PrivateKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.utils.logger import get_logger

logger = get_logger("CryptoUtils")

DEFAULT_MASTER_MESH_KEY_HEX = "4D41535445525F4D4553485F4B45595F524553514E45545F56315F53454355524531"

def generate_ed25519_keypair() -> Tuple[bytes, bytes]:
    priv = Ed25519PrivateKey.generate()
    pub = priv.public_key()
    return priv.private_bytes_raw(), pub.public_bytes_raw()

def sign_ed25519_payload(priv_bytes: bytes, pub_bytes: bytes, canonical_payload: str) -> str:
    priv_key = Ed25519PrivateKey.from_private_bytes(priv_bytes)
    sig_bytes = priv_key.sign(canonical_payload.encode("utf-8"))
    return f"ED25519:{pub_bytes.hex().upper()}:{sig_bytes.hex().upper()}"

def get_master_mesh_key_bytes() -> bytes:
    """
    Returns 32-byte (256-bit) master AES key derived from deployment environment or default mesh seed.
    """
    env_key = os.getenv("RESQNET_MASTER_MESH_KEY", DEFAULT_MASTER_MESH_KEY_HEX)
    if len(env_key) == 64:
        try:
            return bytes.fromhex(env_key)
        except ValueError:
            pass
    return hashlib.sha256(env_key.encode("utf-8")).digest()

def build_canonical_packet_string(packet_dict: dict) -> str:
    """
    Constructs deterministic string representation matching mobile client `buildCanonicalPacketString`.
    """
    h = packet_dict.get("header", {})
    u = packet_dict.get("user", {})
    l = packet_dict.get("location", {})
    i = packet_dict.get("incident", {})

    parts = [
        str(h.get("packetId", "")),
        str(h.get("timestamp", "")),
        str(h.get("version", "")),
        str(h.get("ttl", "")),
        str(h.get("hopCount", "")),
        str(h.get("packetType", "")),
        str(u.get("userId", "")),
        str(u.get("name", "")),
        str(u.get("bloodGroup", "")),
        str(l.get("latitude", "")),
        str(l.get("longitude", "")),
        str(i.get("emergencyType", "")),
        str(i.get("severity", "")),
        str(i.get("emergencyConfidenceScore", "")),
    ]
    return "|".join(parts)

def verify_ed25519_signature(canonical_payload: str, signature_envelope: str) -> bool:
    """
    Verifies Ed25519 signature envelope format: "ED25519:<pubkey_hex>:<sig_hex>".
    Supports backward-compatible legacy RQ-SIG signatures.
    """
    if not signature_envelope or not isinstance(signature_envelope, str):
        return False

    if signature_envelope.startswith("RQ-SIG-"):
        # Legacy placeholder signature format accepted during migration
        return True

    if not signature_envelope.startswith("ED25519:"):
        return False

    parts = signature_envelope.split(":")
    if len(parts) != 3:
        return False

    pub_hex = parts[1]
    sig_hex = parts[2]

    try:
        pub_bytes = bytes.fromhex(pub_hex)
        sig_bytes = bytes.fromhex(sig_hex)
        payload_bytes = canonical_payload.encode("utf-8")

        pub_key = Ed25519PublicKey.from_public_bytes(pub_bytes)
        pub_key.verify(sig_bytes, payload_bytes)
        return True
    except Exception as e:
        logger.warning(f"Ed25519 verification failed: {e}")
        return False

def encrypt_aes256_gcm(plaintext: str) -> str:
    """
    Encrypts plaintext string using AES-256-GCM authenticated encryption.
    Format: "AES256GCM::<iv_hex>::<ciphertext_hex>::<tag_hex>"
    """
    if not plaintext or not isinstance(plaintext, str):
        return plaintext
    key_bytes = get_master_mesh_key_bytes()
    iv = os.urandom(12)
    aesgcm = AESGCM(key_bytes)
    ct_and_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)
    ct = ct_and_tag[:-16]
    tag = ct_and_tag[-16:]
    return f"AES256GCM::{iv.hex()}::{ct.hex()}::{tag.hex()}"

def decrypt_aes256_gcm(ciphertext_envelope: str) -> str:
    """
    Decrypts ciphertext envelope format: "AES256GCM::<iv_hex>::<ciphertext_hex>::<tag_hex>".
    Returns original string or pass-through if unencrypted.
    """
    if not ciphertext_envelope or not isinstance(ciphertext_envelope, str):
        return ciphertext_envelope

    if ciphertext_envelope.startswith("VAULT_ENC::"):
        return ciphertext_envelope[11:]

    if not ciphertext_envelope.startswith("AES256GCM::"):
        return ciphertext_envelope

    parts = ciphertext_envelope.split("::")
    if len(parts) != 4:
        return ciphertext_envelope

    iv_hex = parts[1]
    ct_hex = parts[2]
    tag_hex = parts[3]

    try:
        key_bytes = get_master_mesh_key_bytes()
        iv = bytes.fromhex(iv_hex)
        ct = bytes.fromhex(ct_hex)
        tag = bytes.fromhex(tag_hex)

        aesgcm = AESGCM(key_bytes)
        combined_ct = ct + tag
        decrypted_bytes = aesgcm.decrypt(iv, combined_ct, None)
        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        logger.warning(f"AES-256-GCM decryption error: {e}")
        return ciphertext_envelope
