"""
Key Derivation Functions for ResQNet
Provides HKDF and similar key derivation for session keys.
"""

import hashlib
import hmac
from typing import Optional
from app.utils.logger import get_logger

logger = get_logger("KeyDerivation")


class KeyDerivation:
    """
    Implements HKDF (HMAC-based Key Derivation Function) for deriving
    session keys from shared secrets.
    """

    @staticmethod
    def hkdf_extract(salt: bytes, input_key_material: bytes) -> bytes:
        """
        HKDF Extract step: derives a pseudo-random key from input keying material.

        Args:
            salt (bytes): Optional salt value (can be empty)
            input_key_material (bytes): Input keying material (e.g., ECDH shared secret)

        Returns:
            bytes: Pseudo-random key
        """
        if salt is None or len(salt) == 0:
            salt = b"\x00" * 32

        return hmac.new(salt, input_key_material, hashlib.sha256).digest()

    @staticmethod
    def hkdf_expand(prk: bytes, info: bytes, length: int) -> bytes:
        """
        HKDF Expand step: expands the pseudo-random key to desired length.

        Args:
            prk (bytes): Pseudo-random key from extract step
            info (bytes): Context-specific info
            length (int): Desired output length in bytes

        Returns:
            bytes: Derived key material of specified length
        """
        hash_len = 32  # SHA-256 output length
        n = (length + hash_len - 1) // hash_len

        if n > 255:
            raise ValueError("Cannot derive more than 255 * hash_len bytes")

        okm = b""
        t = b""

        for i in range(1, n + 1):
            t = hmac.new(prk, t + info + bytes([i]), hashlib.sha256).digest()
            okm += t

        return okm[:length]

    @staticmethod
    def derive_session_key(shared_secret: bytes, salt: Optional[bytes] = None,
                          context: str = "ResQNet-Session") -> bytes:
        """
        Derive a session key from ECDH shared secret using HKDF.

        Args:
            shared_secret (bytes): ECDH shared secret
            salt (Optional[bytes]): Optional salt for domain separation
            context (str): Context string for key derivation

        Returns:
            bytes: 32-byte (256-bit) session key
        """
        info = context.encode("utf-8")
        prk = KeyDerivation.hkdf_extract(salt or b"", shared_secret)
        session_key = KeyDerivation.hkdf_expand(prk, info, 32)

        logger.debug(f"Derived session key with context: {context}")
        return session_key

    @staticmethod
    def derive_message_key(session_key: bytes, message_id: str) -> bytes:
        """
        Derive a per-message key from a session key.

        Args:
            session_key (bytes): Session key
            message_id (str): Unique message identifier

        Returns:
            bytes: 32-byte per-message key
        """
        info = f"ResQNet-Msg-{message_id}".encode("utf-8")
        prk = KeyDerivation.hkdf_extract(session_key, session_key)
        msg_key = KeyDerivation.hkdf_expand(prk, info, 32)

        return msg_key

    @staticmethod
    def derive_encryption_and_mac_keys(session_key: bytes) -> tuple[bytes, bytes]:
        """
        Derive separate encryption and MAC keys from a session key.

        Args:
            session_key (bytes): Session key

        Returns:
            tuple[bytes, bytes]: (encryption_key, mac_key), each 32 bytes
        """
        enc_key = KeyDerivation.hkdf_expand(
            session_key, b"ResQNet-Encrypt", 32
        )
        mac_key = KeyDerivation.hkdf_expand(
            session_key, b"ResQNet-MAC", 32
        )

        return enc_key, mac_key