import pytest
from datetime import datetime, timezone
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from app.security.crypto_utils import build_canonical_packet_string, encrypt_aes256_gcm


def _generate_signed_api_test_packet(packet_id: str) -> dict:
    """Generates a valid, signed, encrypted emergency packet for API integration tests."""
    private_key = Ed25519PrivateKey.generate()
    pub_hex = private_key.public_key().public_bytes_raw().hex().upper()
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    packet = {
        "header": {
            "packetId": packet_id,
            "timestamp": now_iso,
            "version": "1.5.0-PROD",
            "ttl": 64,
            "hopCount": 2,
            "packetType": "SOS_EMERGENCY",
            "encryptionVersion": "AES_256_GCM_v1"
        },
        "user": {
            "userId": "usr_test_01",
            "name": encrypt_aes256_gcm("Alex Mercer"),
            "age": "28",
            "bloodGroup": "O+",
            "medicalConditions": encrypt_aes256_gcm("None"),
            "emergencyContacts": []
        },
        "location": {
            "latitude": 37.7749,
            "longitude": -122.4194,
            "altitude": 15.0,
            "accuracy": 4.0,
            "speed": 0.0,
            "heading": 0.0,
            "timestamp": now_iso
        },
        "incident": {
            "emergencyType": "High-Speed Vehicular Collision",
            "severity": "CRITICAL",
            "emergencyConfidenceScore": 92,
            "isAutomatic": True,
            "triggerSource": "MULTI_SENSOR_FALL",
            "additionalDescription": encrypt_aes256_gcm("Simulated test crash in blackout zone.")
        },
        "device": {
            "batteryPercentage": 45,
            "isCharging": False,
            "networkStatus": "ONLINE",
            "bluetoothStatus": "ENABLED",
            "gpsStatus": "LOCKED"
        },
        "mesh": {
            "relayHistory": ["NODE_ALPHA_01", "NODE_BETA_02"],
            "gatewayNode": "GW_SIM_001",
            "deliveryStatus": "RELAYED",
            "retryCount": 0
        }
    }

    canonical = build_canonical_packet_string(packet)
    sig_bytes = private_key.sign(canonical.encode("utf-8"))
    packet["signature"] = f"ED25519:{pub_hex}:{sig_bytes.hex().upper()}"
    return packet


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY_OPERATIONAL"
    assert "ONLINE_CONNECTIVITY_OK" in data["database_status"]

def test_user_registration_and_get(client):
    user_payload = {
        "full_name": "Dr. Elena Vance",
        "email": "elena.vance@resqnet.org",
        "phone_number": "+1-555-0199",
        "age": "34",
        "blood_group": "AB+",
        "medical_conditions": "Penicillin allergy",
        "allergies": "Penicillin",
        "emergency_contacts": [
            {
                "name": "Marcus Vance",
                "phoneNumber": "+1-555-0200",
                "relationship": "Spouse",
                "priorityOrder": 1
            }
        ]
    }
    # 1. Register User
    res = client.post("/api/v1/users/register", json=user_payload)
    assert res.status_code == 201
    user_data = res.json()
    assert user_data["full_name"] == "Dr. Elena Vance"
    assert user_data["blood_group"] == "AB+"
    
    # 2. Get User Profile by ID
    res_get = client.get(f"/api/v1/users/{user_data['id']}")
    assert res_get.status_code == 200
    assert res_get.json()["email"] == "elena.vance@resqnet.org"

def test_packet_ingest_and_acknowledgement_flow(client):
    packet_payload = _generate_signed_api_test_packet("RQ-PKT-SIM-9988")
    
    # 1. Ingest Emergency Packet with valid Ed25519 signature
    res = client.post("/api/v1/incidents/ingest", json=packet_payload)
    assert res.status_code == 200, res.text
    ack_data = res.json()
    assert ack_data["status"] == "ACKNOWLEDGED"
    assert ack_data["packet_id"] == "RQ-PKT-SIM-9988"
    assert ack_data["ack_id"].startswith("RQ-ACK-")
    
    # 2. Verify Incident populated in active incidents list
    res_list = client.get("/api/v1/incidents/")
    assert res_list.status_code == 200
    inc_list = res_list.json()
    assert len(inc_list) == 1
    assert inc_list[0]["emergency_confidence_score"] == 92
    
    # 3. Retrieve exhaustive incident details including Timeline
    incident_id = inc_list[0]["incident_id"]
    res_detail = client.get(f"/api/v1/incidents/{incident_id}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["severity"] == "CRITICAL"
    assert len(detail["timeline"]) >= 1
    assert detail["timeline"][0]["event_type"] == "INCIDENT_INGESTED"

def test_packet_validation_rejection_on_malformed_input(client):
    malformed_payload = {
        "header": {
            "packetId": "RQ-PKT-BAD",
            "timestamp": "INVALID_DATE",
            "version": "1.5.0-PROD",
            "ttl": -5,  # Invalid negative TTL
            "hopCount": 0,
            "packetType": "SOS_EMERGENCY",
            "encryptionVersion": "NONE"
        },
        "user": {
            "userId": "usr_bad_01",
            "name": "Invalid User",
            "age": "0",
            "bloodGroup": "",  # Missing mandatory blood group
            "medicalConditions": "None",
            "emergencyContacts": []
        },
        "location": {
            "latitude": 125.0,  # Out of bounds latitude (> 90)
            "longitude": -122.4194,
            "timestamp": "NOW"
        },
        "incident": {
            "emergencyType": "Test",
            "severity": "LOW",
            "emergencyConfidenceScore": 150, # Out of bounds (> 100)
            "isAutomatic": False,
            "triggerSource": "MANUAL_SOS_BUTTON"
        },
        "device": {
            "batteryPercentage": 80,
            "isCharging": False,
            "networkStatus": "ONLINE",
            "bluetoothStatus": "ENABLED",
            "gpsStatus": "LOCKED"
        },
        "mesh": {
            "relayHistory": [],
            "deliveryStatus": "QUEUED",
            "retryCount": 0
        }
    }
    
    res = client.post("/api/v1/incidents/ingest", json=malformed_payload)
    # Pydantic field validators or PacketValidationService will reject with 422 or 400
    assert res.status_code in [400, 422]
