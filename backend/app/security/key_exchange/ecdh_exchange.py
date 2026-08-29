"""
ECDH Key Exchange Implementation for ResQNet
Provides Elliptic Curve Diffie-Hellman key exchange using X25519 curves
for establishing session keys between mesh nodes.
"""

import os
from typing import Tuple, Optional
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives import serialization
from app.utils.logger import get_logger

logger = get_logger("ECDHExchange")


class ECDHExchange:
    """
    Handles X25519 Elliptic Curve Diffie-Hellman key exchange
    for secure session key establishment between mesh nodes.
    """

    def __init__(self):
        """Initialize ECDH exchange with fresh key pair."""
        self._private_key: Optional[x25519.X25519PrivateKey] = None
        self._public_key: Optional[x25519.X25519PublicKey] = None
        self._generate_keypair()

    def _generate_keypair(self) -> None:
        """Generate a new X25519 key pair."""
        self._private_key = x25519.X25519PrivateKey.generate()
        self._public_key = self._private_key.public_key()
        logger.debug("Generated new X25519 key pair for ECDH")

    def get_private_key_bytes(self) -> bytes:
        """
        Get the private key as raw bytes.

        Returns:
            bytes: 32-byte private key
        """
        if self._private_key is None:
            raise RuntimeError("ECDH private key not initialized")
        return self._private_key.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption()
        )

    def get_public_key_bytes(self) -> bytes:
        """
        Get the public key as raw bytes.

        Returns:
            bytes: 32-byte public key
        """
        if self._public_key is None:
            raise RuntimeError("ECDH public key not initialized")
        return self._public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )

    def get_public_key_hex(self) -> str:
        """
        Get the public key as hexadecimal string.

        Returns:
            str: 64-character hexadecimal public key
        """
        return self.get_public_key_bytes().hex().upper()

    def compute_shared_secret(self, peer_public_key_bytes: bytes) -> bytes:
        """
        Compute shared secret using our private key and peer's public key.

        Args:
            peer_public_key_bytes (bytes): Peer's 32-byte X25519 public key

        Returns:
            bytes: 32-byte shared secret

        Raises:
            ValueError: If peer public key is invalid
        """
        if self._private_key is None:
            raise RuntimeError("ECDH private key not initialized")

        try:
            peer_public_key = x25519.X25519PublicKey.from_public_bytes(peer_public_key_bytes)
            shared_secret = self._private_key.exchange(peer_public_key)
            logger.debug("Computed ECDH shared secret")
            return shared_secret
        except Exception as e:
            logger.error(f"Failed to compute ECDH shared secret: {e}")
            raise ValueError(f"Invalid peer public key: {e}")

    def rotate_keypair(self) -> None:
        """Rotate the ECDH key pair for forward secrecy."""
        old_public = self.get_public_key_hex() if self._public_key else "None"
        self._generate_keypair()
        new_public = self.get_public_key_hex()
        logger.info(f"Rotated ECDH keypair: {old_public} -> {new_public}")


# Global ECDH instance for singleton use (can be replaced with dependency injection)
_ecdh_instance: Optional[ECDHExchange] = None


def get_ecdh_exchange() -> ECDHExchange:
    """
    Get or create the global ECDH exchange instance.

    Returns:
        ECDHExchange: Global ECDH exchange instance
    """
    global _ecdh_instance
    if _ecdh_instance is None:
        _ecdh_instance = ECDHExchange()
    return _ecdh_instance


def reset_ecdh_exchange() -> None:
    """Reset the global ECDH exchange instance (for testing)."""
    global _ecdh_instance
    _ecdh_instance = None