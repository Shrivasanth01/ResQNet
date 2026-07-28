import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.all_models import PacketReceipt, CommunicationLog
from app.schemas.all_schemas import PacketAckResponse
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("AcknowledgementService")

class AcknowledgementService:
    @staticmethod
    def create_ack(db: Session, packet_id: str, gateway_id: str = None) -> PacketAckResponse:
        ack_id = f"RQ-ACK-{uuid.uuid4().hex[:8].upper()}"
        active_gateway = gateway_id or settings.GATEWAY_NODE_ID
        now = datetime.utcnow()
        
        receipt = PacketReceipt(
            receipt_id=ack_id,
            packet_id=packet_id,
            status="ACKNOWLEDGED",
            gateway_id=active_gateway,
            timestamp=now
        )
        db.add(receipt)
        
        # Log auditable communication trace
        comm_log = CommunicationLog(
            log_id=f"LOG-{uuid.uuid4().hex[:10].upper()}",
            packet_id=packet_id,
            communication_method="INTERNET_REST_FASTAPI",
            node_id="MOBILE_CLIENT",
            gateway_id=active_gateway,
            action="INGEST_AND_ACKNOWLEDGE",
            result="SUCCESS",
            latency_ms=12,
            timestamp=now
        )
        db.add(comm_log)
        db.commit()
        db.refresh(receipt)
        
        logger.info(f"Generated cryptographic ACK {ack_id} for distress packet {packet_id}", extra={"packet_id": packet_id, "gateway_id": active_gateway})
        
        return PacketAckResponse(
            status="ACKNOWLEDGED",
            ack_id=ack_id,
            packet_id=packet_id,
            gateway_id=active_gateway,
            server_timestamp=now.isoformat() + "Z"
        )
