from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.schemas.all_schemas import EmergencyPacketIngestSchema, PacketAckResponse, IncidentDetailResponse, TimelineItemSchema
from app.services.packet_processing import PacketProcessingService
from app.services.incident_service import IncidentService
from app.services.acknowledgement import AcknowledgementService
from app.models.all_models import IncidentTimeline, PacketLog, PacketReceipt

router = APIRouter()

def _build_canonical_incident(db: Session, inc, timeline_items: list = None) -> dict:
    pkt_log = db.query(PacketLog).filter(PacketLog.packet_id == inc.packet_id).first()
    receipt = db.query(PacketReceipt).filter(PacketReceipt.packet_id == inc.packet_id).first()
    
    mesh_route = []
    gateway_id = inc.packet_id if not pkt_log else pkt_log.gateway_id
    ack_id = receipt.receipt_id if receipt else None
    medical_vault = None

    if pkt_log and isinstance(pkt_log.raw_payload, dict):
        mesh_data = pkt_log.raw_payload.get("mesh", {})
        mesh_route = mesh_data.get("relayHistory", [])
        gateway_id = mesh_data.get("gatewayNode") or gateway_id
        
        user_data = pkt_log.raw_payload.get("user")
        if user_data:
            medical_vault = {
                "userId": user_data.get("userId", inc.user_id or "UNKNOWN"),
                "fullName": user_data.get("name", "Unknown Survivor"),
                "email": "unavailable@resqnet.org",
                "phoneNumber": "+1-000-0000",
                "bloodGroup": user_data.get("bloodGroup", "Unknown"),
                "age": str(user_data.get("age", "Unknown")),
                "medicalConditions": user_data.get("medicalConditions", "None reported"),
                "allergies": "None documented",
                "emergencyContacts": user_data.get("emergencyContacts", [])
            }

    created_str = inc.created_at.isoformat() + "Z" if hasattr(inc.created_at, "isoformat") else str(inc.created_at)
    updated_str = inc.updated_at.isoformat() + "Z" if hasattr(inc, "updated_at") and inc.updated_at and hasattr(inc.updated_at, "isoformat") else created_str

    return {
        "incident_id": inc.incident_id,
        "packet_id": inc.packet_id,
        "user_id": inc.user_id,
        "emergency_type": inc.emergency_type,
        "severity": inc.severity,
        "emergency_confidence_score": inc.emergency_confidence_score,
        "latitude": inc.latitude,
        "longitude": inc.longitude,
        "altitude": inc.altitude or 0.0,
        "status": inc.status,
        "created_at": created_str,
        "updated_at": updated_str,
        "assigned_responder_id": None,
        "timeline": timeline_items or [],
        "medicalVault": medical_vault,
        "meshRoute": mesh_route,
        "gatewayId": gateway_id,
        "ackId": ack_id
    }

@router.post("/ingest", response_model=PacketAckResponse, status_code=status.HTTP_200_OK)
async def ingest_emergency_packet(packet: EmergencyPacketIngestSchema, db: Session = Depends(get_db)):
    """
    Ingest, validate, store, and stream Emergency Packets transmitted from mobile field units or mesh gateways.
    Returns cryptographic ACK response to halt edge radio re-transmission attempts.
    """
    try:
        ack_res = await PacketProcessingService.process_incoming_packet(db, packet)
        return ack_res
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error processing packet ingest")

@router.post("/ack", response_model=PacketAckResponse)
def register_packet_ack(packet_id: str = Query(..., description="Target Packet ID to acknowledge"), db: Session = Depends(get_db)):
    """
    Allows secondary satellite or Bluetooth Mesh gateway nodes to explicitly register delivery acknowledgments.
    """
    return AcknowledgementService.create_ack(db, packet_id)

@router.get("/", response_model=List[dict])
def list_active_incidents(limit: int = 50, db: Session = Depends(get_db)):
    """
    Retrieve active distress incidents ordered by creation timestamp for command dashboard ingestion.
    """
    incidents = IncidentService.list_incidents(db, limit=limit)
    return [_build_canonical_incident(db, inc) for inc in incidents]

@router.get("/{id}", response_model=IncidentDetailResponse)
def get_incident_detail(id: str, db: Session = Depends(get_db)):
    """
    Retrieve exhaustive incident telemetry, including raw packet parameters and historical timeline logs.
    """
    inc = IncidentService.get_incident(db, id)
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident report {id} not found")
        
    timelines = db.query(IncidentTimeline).filter(IncidentTimeline.incident_id == inc.incident_id).order_by(IncidentTimeline.timestamp.asc()).all()
    timeline_items = [
        TimelineItemSchema(
            timeline_id=t.timeline_id,
            timestamp=t.timestamp.isoformat() + "Z",
            event_type=t.event_type,
            summary=t.summary,
            ecs_snapshot=t.ecs_snapshot
        )
        for t in timelines
    ]
    
    return IncidentDetailResponse(**_build_canonical_incident(db, inc, timeline_items))
