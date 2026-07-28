from sqlalchemy.orm import Session
from app.schemas.all_schemas import EmergencyPacketIngestSchema, PacketAckResponse
from app.models.all_models import PacketLog
from app.services.packet_validation import PacketValidationService
from app.services.incident_service import IncidentService
from app.services.acknowledgement import AcknowledgementService
from app.services.notification import NotificationService
from app.security.crypto_utils import decrypt_aes256_gcm
from app.security.replay_cache import replay_cache
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("PacketProcessingService")

class PacketProcessingService:
    @staticmethod
    async def process_incoming_packet(db: Session, packet: EmergencyPacketIngestSchema, gateway_id: str = None) -> PacketAckResponse:
        active_gw = gateway_id or settings.GATEWAY_NODE_ID
        packet_id = packet.header.packetId
        
        logger.info(f"GATEWAY_VERIFICATION: Ingesting packet {packet_id} via gateway {active_gw}", extra={"packet_id": packet_id, "gateway_id": active_gw})
        
        # 1. Validate incoming packet (Ed25519 signature, timestamp drift, replay protection)
        is_valid, errors = PacketValidationService.validate(packet)
        if not is_valid:
            error_summary = "; ".join(errors)
            logger.warning(f"PACKET_REJECTED: Discarded packet {packet_id}: {error_summary}", extra={"packet_id": packet_id, "result": "REJECTED"})
            raise ValueError(f"Packet validation failure: {error_summary}")

        # Record packetId and signature in server ReplayCache after successful validation
        replay_cache.add(packet_id)
        if packet.signature:
            replay_cache.add(packet.signature)
            
        logger.info(f"PACKET_VERIFIED: Successfully validated envelope for packet {packet_id}", extra={"packet_id": packet_id})

        # Decrypt sensitive PHI fields for triage database persistence
        decrypted_dict = packet.model_dump()
        if decrypted_dict.get("user"):
            user_data = decrypted_dict["user"]
            user_data["name"] = decrypt_aes256_gcm(user_data.get("name", ""))
            user_data["medicalConditions"] = decrypt_aes256_gcm(user_data.get("medicalConditions", ""))
            if isinstance(user_data.get("emergencyContacts"), list):
                for contact in user_data["emergencyContacts"]:
                    contact["name"] = decrypt_aes256_gcm(contact.get("name", ""))
                    contact["phoneNumber"] = decrypt_aes256_gcm(contact.get("phoneNumber", ""))

        if decrypted_dict.get("incident") and decrypted_dict["incident"].get("additionalDescription"):
            decrypted_dict["incident"]["additionalDescription"] = decrypt_aes256_gcm(decrypted_dict["incident"]["additionalDescription"])
            
        # 2. Persist raw packet payload into immutable packet_log
        existing_log = db.query(PacketLog).filter(PacketLog.packet_id == packet_id).first()
        if not existing_log:
            pkt_log = PacketLog(
                packet_id=packet_id,
                raw_payload=decrypted_dict,
                gateway_id=active_gw,
                signature=packet.signature
            )
            db.add(pkt_log)
            db.commit()
            db.refresh(pkt_log)
            
        # 3. Create or Update authoritative Incident Report & Timeline
        incident = IncidentService.create_or_update_from_packet(db, packet)
        
        # 4. Generate delivery receipt acknowledgment (ACK)
        ack_res = AcknowledgementService.create_ack(db, packet_id, active_gw)
        
        # 5. Broadcast real-time websocket alert to connected triage operator consoles
        await NotificationService.broadcast_new_incident(
            incident.incident_id,
            packet_id,
            incident.emergency_confidence_score,
            incident.emergency_type,
            incident.severity,
            incident.latitude,
            incident.longitude,
            gateway_id=active_gw,
            ack_id=ack_res.ack_id
        )
        await NotificationService.broadcast_acknowledgement(ack_res.ack_id, packet_id, active_gw)
        
        return ack_res
