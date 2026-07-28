from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True) # UUID string
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profile = relationship("EmergencyProfile", back_populates="user", uselist=False)

class EmergencyProfile(Base):
    __tablename__ = "emergency_profiles"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    age = Column(String, nullable=True)
    blood_group = Column(String, nullable=False)
    medical_conditions = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    emergency_contacts = Column(JSON, nullable=True) # List of contact objects
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="profile")

class IncidentReport(Base):
    __tablename__ = "incident_reports"
    incident_id = Column(String, primary_key=True, index=True) # Unique nanoid / RQ-PKT ID
    packet_id = Column(String, ForeignKey("packet_log.packet_id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    emergency_type = Column(String, nullable=False)
    severity = Column(String, nullable=False, index=True) # CRITICAL, HIGH, MODERATE, LOW, INFO
    emergency_confidence_score = Column(Integer, nullable=False) # 0 to 100
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=True)
    status = Column(String, default="OPEN", index=True) # OPEN, DISPATCHED, RESOLVED, FALSE_ALARM
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PacketLog(Base):
    __tablename__ = "packet_log"
    packet_id = Column(String, primary_key=True, index=True)
    raw_payload = Column(JSON, nullable=False)
    received_at = Column(DateTime, default=datetime.utcnow, index=True)
    gateway_id = Column(String, nullable=True)
    signature = Column(String, nullable=True)

class PacketReceipt(Base):
    __tablename__ = "packet_receipts"
    receipt_id = Column(String, primary_key=True, index=True)
    packet_id = Column(String, ForeignKey("packet_log.packet_id"), nullable=False, index=True)
    status = Column(String, nullable=False) # ACKNOWLEDGED, REJECTED, STORED
    gateway_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class CommunicationLog(Base):
    __tablename__ = "communication_log"
    log_id = Column(String, primary_key=True, index=True)
    packet_id = Column(String, nullable=True, index=True)
    communication_method = Column(String, nullable=False) # INTERNET, MESH, SATELLITE
    node_id = Column(String, nullable=False)
    gateway_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    result = Column(String, nullable=False) # SUCCESS, FAILURE, REJECTED
    latency_ms = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class GatewayNode(Base):
    __tablename__ = "gateway_nodes"
    gateway_id = Column(String, primary_key=True, index=True)
    node_name = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    status = Column(String, default="ONLINE") # ONLINE, OFFLINE, CONGESTED
    last_heartbeat = Column(DateTime, default=datetime.utcnow)

class ResponderUnit(Base):
    __tablename__ = "responder_units"
    unit_id = Column(String, primary_key=True, index=True)
    callsign = Column(String, unique=True, nullable=False)
    unit_type = Column(String, nullable=False) # AMBULANCE, FIRE_TRUCK, HELICOPTER, COMMAND_POST
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    status = Column(String, default="AVAILABLE") # AVAILABLE, DISPATCHED, OUT_OF_SERVICE
    last_updated = Column(DateTime, default=datetime.utcnow)

class IncidentTimeline(Base):
    __tablename__ = "incident_timeline"
    timeline_id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, ForeignKey("incident_reports.incident_id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    ecs_snapshot = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
