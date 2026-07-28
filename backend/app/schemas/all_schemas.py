from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# ============================================================================
# MOBILE EMERGENCY PACKET SCHEMA (Mirroring Phase 1.5 Contract)
# ============================================================================

class PacketHeaderSchema(BaseModel):
    packetId: str = Field(..., description="Unique packet identifier from mobile device")
    timestamp: str
    version: str = Field(default="1.5.0-PROD")
    ttl: int = Field(default=64, ge=0)
    hopCount: int = Field(default=0, ge=0)
    packetType: str
    encryptionVersion: str = Field(default="NONE")

class EmergencyContactSchema(BaseModel):
    name: str
    phoneNumber: str
    relationship: str
    priorityOrder: int = 1

class PacketUserSchema(BaseModel):
    userId: str
    name: str
    age: str = "Unknown"
    bloodGroup: str
    medicalConditions: str = "None reported"
    emergencyContacts: List[EmergencyContactSchema] = []

class PacketLocationSchema(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    altitude: Optional[float] = 0.0
    accuracy: Optional[float] = 0.0
    speed: Optional[float] = 0.0
    heading: Optional[float] = 0.0
    timestamp: str

class PacketIncidentSchema(BaseModel):
    emergencyType: str
    severity: str
    emergencyConfidenceScore: int = Field(..., ge=0, le=100)
    isAutomatic: bool = False
    triggerSource: str = "MANUAL_SOS_BUTTON"
    additionalDescription: Optional[str] = None

class PacketDeviceSchema(BaseModel):
    batteryPercentage: int = Field(..., ge=0, le=100)
    isCharging: bool = False
    networkStatus: str = "ONLINE"
    bluetoothStatus: str = "ENABLED"
    gpsStatus: str = "LOCKED"

class PacketMeshSchema(BaseModel):
    relayHistory: List[str] = []
    gatewayNode: Optional[str] = None
    deliveryStatus: str = "QUEUED"
    retryCount: int = 0
    lastAttemptTimestamp: Optional[str] = None

class EmergencyPacketIngestSchema(BaseModel):
    header: PacketHeaderSchema
    user: PacketUserSchema
    location: PacketLocationSchema
    incident: PacketIncidentSchema
    device: PacketDeviceSchema
    mesh: PacketMeshSchema
    signature: Optional[str] = None

class PacketAckResponse(BaseModel):
    status: str = "ACKNOWLEDGED"
    ack_id: str
    packet_id: str
    gateway_id: str
    server_timestamp: str

# ============================================================================
# USER & PROFILE REGISTRATION SCHEMAS
# ============================================================================

class UserRegisterRequest(BaseModel):
    full_name: str
    email: str
    phone_number: str
    age: str = "30"
    blood_group: str = "O+"
    medical_conditions: str = "None"
    allergies: str = "None"
    emergency_contacts: List[EmergencyContactSchema] = []

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone_number: str
    blood_group: str
    created_at: str

# ============================================================================
# INCIDENT & TIMELINE SCHEMAS
# ============================================================================

class TimelineItemSchema(BaseModel):
    timeline_id: str
    timestamp: str
    event_type: str
    summary: str
    ecs_snapshot: Optional[int] = None

class IncidentDetailResponse(BaseModel):
    incident_id: str
    packet_id: str
    user_id: Optional[str] = None
    emergency_type: str
    severity: str
    emergency_confidence_score: int
    latitude: float
    longitude: float
    altitude: Optional[float] = 0.0
    status: str
    created_at: str
    updated_at: Optional[str] = None
    assigned_responder_id: Optional[str] = None
    timeline: List[TimelineItemSchema] = []
    medicalVault: Optional[Dict[str, Any]] = None
    meshRoute: List[str] = []
    gatewayId: Optional[str] = None
    ackId: Optional[str] = None

    class Config:
        populate_by_name = True

class HealthStatusResponse(BaseModel):
    status: str
    version: str
    database_status: str
    active_websocket_connections: int
    timestamp: str
