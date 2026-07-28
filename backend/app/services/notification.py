from typing import Any, Dict
from app.websocket.manager import manager
from app.utils.logger import get_logger

logger = get_logger("NotificationService")

class NotificationService:
    @staticmethod
    async def broadcast_new_incident(incident_id: str, packet_id: str, ecs: int, emergency_type: str, severity: str, lat: float, lng: float, gateway_id: str = None, ack_id: str = None):
        message = {
            "event": "NEW_EMERGENCY_INCIDENT",
            "data": {
                "incident_id": incident_id,
                "packet_id": packet_id,
                "emergency_type": emergency_type,
                "severity": severity,
                "emergency_confidence_score": ecs,
                "latitude": lat,
                "longitude": lng,
                "altitude": 0.0,
                "status": "OPEN",
                "alert_priority": "IMMEDIATE" if ecs >= 85 else "HIGH",
                "meshRoute": [],
                "gatewayId": gateway_id,
                "ackId": ack_id,
                "medicalVault": None,
                "assigned_responder_id": None
            }
        }
        logger.info(f"Broadcasting real-time alert for incident {incident_id} (ECS: {ecs}) via WebSocket")
        await manager.broadcast(message)

    @staticmethod
    async def broadcast_acknowledgement(ack_id: str, packet_id: str, gateway_id: str):
        message = {
            "event": "PACKET_ACKNOWLEDGED",
            "data": {
                "ack_id": ack_id,
                "packet_id": packet_id,
                "gateway_id": gateway_id,
                "status": "DELIVERED_CONFIRMED"
            }
        }
        await manager.broadcast(message)
