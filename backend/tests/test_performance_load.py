import time
# pyrefly: ignore [missing-import]
import pytest
from app.security.crypto_utils import build_canonical_packet_string, generate_ed25519_keypair, sign_ed25519_payload, encrypt_aes256_gcm
from app.schemas.all_schemas import EmergencyPacketIngestSchema
from app.services.packet_validation import PacketValidationService
from app.services.packet_processing import PacketProcessingService

@pytest.fixture
def keypair():
    return generate_ed25519_keypair()

from datetime import datetime, timezone

def make_mock_packet(keypair, index: int) -> dict:
    priv_bytes, pub_bytes = keypair
    raw_name = f"Survivor #{index}"
    enc_name = encrypt_aes256_gcm(raw_name)
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    pkt = {
        "header": {
            "packetId": f"RQ-LOAD-PKT-{index:05d}",
            "version": "1.0",
            "timestamp": now_iso,
            "ttl": 5,
            "hopCount": 1,
            "packetType": "EMERGENCY_SOS",
            "encryptionVersion": "AES_256_GCM_v1"
        },
        "user": {
            "userId": f"usr_load_{index}",
            "name": enc_name,
            "bloodGroup": "O+",
            "medicalConditions": encrypt_aes256_gcm("Asthma"),
            "emergencyContacts": []
        },
        "location": {
            "latitude": 37.7749 + (index * 0.0001),
            "longitude": -122.4194 + (index * 0.0001),
            "altitude": 10.0,
            "locationConfidence": 95,
            "timestamp": now_iso
        },
        "incident": {
            "emergencyType": "Load Test Simulation",
            "severity": "CRITICAL",
            "emergencyConfidenceScore": 90
        },
        "device": {
            "deviceId": f"DEV-{index}",
            "batteryPercentage": 85
        },
        "mesh": {
            "originNodeId": f"NODE-LOAD-{index}",
            "relayHistory": []
        }
    }
    
    canonical = build_canonical_packet_string(pkt)
    pkt["signature"] = sign_ed25519_payload(priv_bytes, pub_bytes, canonical)
    return pkt

@pytest.mark.anyio
async def test_10_incidents_load_benchmark(db_session, keypair):
    packets = [EmergencyPacketIngestSchema(**make_mock_packet(keypair, i)) for i in range(10)]
    start = time.time()
    for pkt in packets:
        is_valid, errors = PacketValidationService.validate(pkt)
        assert is_valid is True
        ack = await PacketProcessingService.process_incoming_packet(db_session, pkt)
        assert ack.status == "ACKNOWLEDGED"
    duration = time.time() - start
    
    avg_ms = (duration / 10) * 1000
    print(f"\n[LOAD TEST - 10 INCIDENTS] Total: {duration:.4f}s | Avg per packet: {avg_ms:.2f}ms | Throughput: {10/duration:.1f} pkt/s")
    assert duration < 5.0

@pytest.mark.anyio
async def test_100_incidents_load_benchmark(db_session, keypair):
    packets = [EmergencyPacketIngestSchema(**make_mock_packet(keypair, i + 100)) for i in range(100)]
    start = time.time()
    for pkt in packets:
        is_valid, errors = PacketValidationService.validate(pkt)
        assert is_valid is True
        ack = await PacketProcessingService.process_incoming_packet(db_session, pkt)
        assert ack.status == "ACKNOWLEDGED"
    duration = time.time() - start
    
    avg_ms = (duration / 100) * 1000
    print(f"\n[LOAD TEST - 100 INCIDENTS] Total: {duration:.4f}s | Avg per packet: {avg_ms:.2f}ms | Throughput: {100/duration:.1f} pkt/s")
    assert duration < 10.0

@pytest.mark.anyio
async def test_1000_incidents_load_benchmark(db_session, keypair):
    # Batch verification of 1,000 packets to measure p95 latency and memory scaling
    latencies = []
    for i in range(1000):
        pkt = EmergencyPacketIngestSchema(**make_mock_packet(keypair, i + 1000))
        t0 = time.time()
        is_valid, errors = PacketValidationService.validate(pkt)
        assert is_valid is True
        ack = await PacketProcessingService.process_incoming_packet(db_session, pkt)
        assert ack.status == "ACKNOWLEDGED"
        latencies.append((time.time() - t0) * 1000)
    
    latencies.sort()
    p95 = latencies[int(len(latencies) * 0.95)]
    avg_lat = sum(latencies) / len(latencies)
    print(f"\n[LOAD TEST - 1,000 INCIDENTS] Avg Latency: {avg_lat:.2f}ms | p95 Latency: {p95:.2f}ms")
    assert p95 < 50.0 # Sub-50ms p95 latency goal
