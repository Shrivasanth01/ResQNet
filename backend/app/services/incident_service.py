import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.all_models import IncidentReport, IncidentTimeline
from app.schemas.all_schemas import EmergencyPacketIngestSchema

class TimelineService:
    @staticmethod
    def log_milestone(db: Session, incident_id: str, event_type: str, summary: str, ecs: Optional[int] = None, details: dict = None) -> IncidentTimeline:
        entry = IncidentTimeline(
            timeline_id=f"TML-{uuid.uuid4().hex[:10].upper()}",
            incident_id=incident_id,
            timestamp=datetime.utcnow(),
            event_type=event_type,
            summary=summary,
            ecs_snapshot=ecs,
            details=details or {}
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

class IncidentService:
    @staticmethod
    def create_or_update_from_packet(db: Session, packet: EmergencyPacketIngestSchema) -> IncidentReport:
        packet_id = packet.header.packetId
        existing = db.query(IncidentReport).filter(IncidentReport.packet_id == packet_id).first()
        if existing:
            existing.emergency_confidence_score = packet.incident.emergencyConfidenceScore
            existing.latitude = packet.location.latitude
            existing.longitude = packet.location.longitude
            existing.altitude = packet.location.altitude
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            
            TimelineService.log_milestone(
                db, 
                existing.incident_id, 
                "TELEMETRY_UPDATED", 
                f"Updated GPS coordinates and ECS ({existing.emergency_confidence_score}/100)", 
                existing.emergency_confidence_score
            )
            return existing
            
        incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        incident = IncidentReport(
            incident_id=incident_id,
            packet_id=packet_id,
            user_id=packet.user.userId,
            emergency_type=packet.incident.emergencyType,
            severity=packet.incident.severity,
            emergency_confidence_score=packet.incident.emergencyConfidenceScore,
            latitude=packet.location.latitude,
            longitude=packet.location.longitude,
            altitude=packet.location.altitude,
            status="OPEN",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        
        # Log creation on forensic timeline
        TimelineService.log_milestone(
            db,
            incident_id,
            "INCIDENT_INGESTED",
            f"Ingested emergency distress call from source {packet.incident.triggerSource}. Severity: {incident.severity}.",
            incident.emergency_confidence_score,
            {"battery": packet.device.batteryPercentage, "blood_group": packet.user.bloodGroup}
        )
        
        return incident

    @staticmethod
    def get_incident(db: Session, incident_id: str) -> Optional[IncidentReport]:
        return db.query(IncidentReport).filter(IncidentReport.incident_id == incident_id).first()

    @staticmethod
    def list_incidents(db: Session, limit: int = 50) -> List[IncidentReport]:
        return db.query(IncidentReport).order_by(IncidentReport.created_at.desc()).limit(limit).all()

    @staticmethod
    def update_status(db: Session, incident_id: str, status: str, responder_id: Optional[str] = None) -> Optional[IncidentReport]:
        inc = db.query(IncidentReport).filter(IncidentReport.incident_id == incident_id).first()
        if not inc:
            return None
        inc.status = status
        if responder_id:
            inc.assigned_responder_id = responder_id
        inc.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(inc)

        TimelineService.log_milestone(
            db,
            incident_id,
            "STATUS_UPDATED",
            f"Command operations changed status to {status}.{f' Assigned Unit: {responder_id}' if responder_id else ''}",
            inc.emergency_confidence_score
        )
        return inc
