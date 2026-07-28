from typing import Tuple, List
import time
from datetime import datetime, timezone
from app.schemas.all_schemas import EmergencyPacketIngestSchema
from app.security.crypto_utils import build_canonical_packet_string, verify_ed25519_signature
from app.security.replay_cache import replay_cache
from app.utils.logger import get_logger

logger = get_logger("PacketValidationService")

class PacketValidationService:
    @staticmethod
    def validate(packet: EmergencyPacketIngestSchema) -> Tuple[bool, List[str]]:
        errors = []
        
        # 1. Header integrity check
        if not packet.header.packetId:
            errors.append("Header packetId cannot be empty.")
            
        if packet.header.ttl <= 0:
            errors.append(f"EXPIRED_PACKET: Packet TTL is expired or zero ({packet.header.ttl}).")

        # 2. Replay Protection Check
        if packet.header.packetId and replay_cache.has(packet.header.packetId):
            logger.warning(f"REPLAY_DETECTED: Duplicate packetId {packet.header.packetId} rejected.")
            errors.append(f"REPLAY_DETECTED: Packet {packet.header.packetId} has already been processed.")
            
        if packet.signature and replay_cache.has(packet.signature):
            logger.warning(f"REPLAY_DETECTED: Duplicate signature rejected for packet {packet.header.packetId}.")
            errors.append("REPLAY_DETECTED: Duplicate digital signature submission.")

        # 3. Timestamp Freshness & Clock Drift Check
        if packet.header.timestamp:
            try:
                # Handle ISO-8601 string parsing
                ts_str = packet.header.timestamp.replace("Z", "+00:00")
                pkt_time = datetime.fromisoformat(ts_str).timestamp()
                now = time.time()
                
                # Reject if more than 5 minutes in future
                if pkt_time > now + 300:
                    errors.append("EXPIRED_PACKET: Timestamp is too far in the future.")
                    
                # Reject if older than 24 hours
                if now - pkt_time > 86400:
                    errors.append("EXPIRED_PACKET: Timestamp is older than 24-hour expiration window.")
            except Exception as e:
                errors.append(f"Invalid timestamp format ({packet.header.timestamp}): {e}")

        # 4. Ed25519 Signature Verification
        if packet.signature:
            canonical_payload = build_canonical_packet_string(packet.model_dump())
            is_valid_sig = verify_ed25519_signature(canonical_payload, packet.signature)
            if not is_valid_sig:
                logger.warning(f"INVALID_SIGNATURE: Ed25519 signature validation failed for packet {packet.header.packetId}.")
                errors.append("INVALID_SIGNATURE: Cryptographic Ed25519 digital signature verification failed.")
        else:
            errors.append("INVALID_SIGNATURE: Missing required digital signature.")

        # 5. Location boundaries
        if not (-90.0 <= packet.location.latitude <= 90.0):
            errors.append(f"Invalid latitude boundary ({packet.location.latitude}).")
        if not (-180.0 <= packet.location.longitude <= 180.0):
            errors.append(f"Invalid longitude boundary ({packet.location.longitude}).")
            
        # 6. Emergency Confidence Score limits (ECS 0 to 100)
        if not (0 <= packet.incident.emergencyConfidenceScore <= 100):
            errors.append(f"Emergency Confidence Score ({packet.incident.emergencyConfidenceScore}) out of bounds [0, 100].")
            
        # 7. Mandatory clinical user fields
        if not packet.user.bloodGroup:
            errors.append("Blood group is required for cloud triage assessment.")
            
        return (len(errors) == 0, errors)
