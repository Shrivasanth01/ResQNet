# ResQNet Threat Model – Phase B: Cryptographic Hardening & Zero-Trust Security

**Version**: 1.0.0  
**Date**: 2026-07-28  
**Classification**: Internal Security Documentation  
**Status**: ACTIVE

---

## 1. Asset Inventory

| Asset | Description | Sensitivity |
|-------|-------------|-------------|
| Patient PHI | Name, blood group, medical conditions, emergency contacts | CRITICAL |
| Ed25519 Private Keys | Node device signing keys stored in platform secure vault | CRITICAL |
| AES-256-GCM Master Mesh Key | Symmetric key for PHI field encryption | CRITICAL |
| Emergency Packets | Structured SOS payloads transiting BLE/Wi-Fi mesh | HIGH |
| Incident Database | Cloud-persisted triage records in PostgreSQL | HIGH |
| Node Identity (PublicKey) | Device-specific public key bound to signatures | HIGH |
| FastAPI Cloud Endpoint | `/api/v1/incidents/ingest` REST gateway | HIGH |
| Mesh Radio Channels | BLE 5.0 GATT, Wi-Fi Direct / mDNS P2P | MEDIUM |

---

## 2. Trust Boundaries

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│   UNTRUSTED ZONE                                                                  │
│                                                                                   │
│   ┌─────────────┐     BLE Radio      ┌───────────────┐    Wi-Fi Direct          │
│   │   Survivor  │──── PHI Encrypted ──▶  Relay Nodes  │──── PHI Encrypted ──┐   │
│   │   Mobile    │◀── Ed25519 Signed ──│  (Zero-Trust) │◀── Ed25519 Signed ──┘   │
│   └─────────────┘                    └───────────────┘                          │
│                                               │                                   │
│                            ┌──────────────────┘                                  │
│                            ▼  HTTPS / REST (TLS)                                 │
└────────────────────────────│─────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────────────────┐
│   TRUSTED ZONE (FastAPI Backend)                                                   │
│                                                                                    │
│   ┌─────────────────────────────┐    ┌──────────────────────────────────────────┐ │
│   │  PacketValidationService    │    │  PacketProcessingService                  │ │
│   │  ✓ Ed25519 verify           │    │  ✓ AES-256-GCM decrypt                   │ │
│   │  ✓ Timestamp bounds check   │    │  ✓ Register in ReplayCache               │ │
│   │  ✓ ReplayCache check        │    │  ✓ Store decrypted data                   │ │
│   └─────────────────────────────┘    └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Attack Surface

| Surface | Interface | Protocol | Exposure |
|---------|-----------|----------|----------|
| BLE 5.0 GATT | Bluetooth mesh radio | BLE advertising | Open air — any device in range |
| Wi-Fi Direct | P2P Wi-Fi / mDNS | 802.11 | Local network |
| FastAPI `/ingest` | Cloud REST API | HTTP/HTTPS | Public internet |
| FastAPI WebSocket | Real-time dashboard | WebSocket | Authenticated dashboard clients |
| expo-secure-store | Mobile key vault | Platform native | Local device physical access |

---

## 4. Threat Actors

| Actor | Capability | Motivation |
|-------|-----------|------------|
| Passive BLE Eavesdropper | Radio packet capture | Steal patient medical/identity PHI |
| Active Mesh Relay Attacker | Inject or modify packets | Disrupt emergency response coordination |
| Replay Attacker | Record and re-broadcast valid packets | Flood responder systems, drain battery |
| Rogue Gateway Node | Impersonate a trusted gateway | Spoof incident reports, redirect responders |
| Insider Threat | Physical device access | Exfiltrate private keys from device storage |
| Internet API Attacker | Send crafted payloads to `/ingest` | Inject false incident reports in command dashboard |

---

## 5. STRIDE Analysis

| Threat ID | Category | Description | Mitigated By | Residual Risk |
|-----------|----------|-------------|--------------|---------------|
| **T-01** | **Spoofing** | Rogue node generates emergency packets with a fake node identity | Ed25519 signature requires possession of device private key | LOW – No pre-shared certificate authority yet |
| **T-02** | **Tampering** | Relay node modifies GPS coordinates, ECS score, or severity before forwarding | Ed25519 signature computed over canonical payload; any byte change invalidates signature | LOW |
| **T-03** | **Repudiation** | Survivor/device denies sending a packet | Ed25519 non-repudiation: signature cryptographically bound to private key | LOW |
| **T-04** | **Information Disclosure** | BLE eavesdropper captures medical identity and conditions | AES-256-GCM authenticated encryption of all PHI fields before dispatch | LOW – Key rotation not yet implemented |
| **T-05** | **Denial of Service** | Replay flooding: recorded valid packets re-broadcast to drain battery and saturate mesh | Bounded LRU ReplayCache (10,000 entries), 24h TTL, TTL hop-limit expiration | MEDIUM – No rate-limiting layer yet |
| **T-06** | **Denial of Service** | Clock skew / timestamp manipulation to delay or falsely age packets | ±5 minute future, 24-hour past timestamp validation | LOW |
| **T-07** | **Elevation of Privilege** | Crafted API payload injection bypasses field validation | Pydantic schema enforcement + PacketValidationService + Ed25519 signature check | LOW |
| **T-08** | **Information Disclosure** | Security log leaks decrypted patient data | Structured audit logger logs only packet IDs, timestamps, event types — never PHI | LOW |
| **T-09** | **Spoofing** | Forged ACK packet silences live mesh retransmitters | ACK broadcast registered in MeshRouting.registerSeenPacket | MEDIUM – ACK tampering not signed yet |

---

## 6. Mitigations Summary

| Mitigation | Implementation | Location |
|------------|----------------|----------|
| Authenticated Encryption | AES-256-GCM (Node.js `crypto` module) | `DataVaultCipher` · `cipher.ts` |
| Ed25519 Digital Signatures | `tweetnacl.sign.detached` on mobile, `cryptography` lib on backend | `KeyManager.ts` · `crypto_utils.py` |
| Secure Key Storage | `expo-secure-store` (Android KeyStore / iOS Keychain) | `KeyManager.ts` |
| Replay Protection | Bounded LRU in-memory cache (10,000 entries, 24h TTL) | `ReplayCache.ts` · `replay_cache.py` |
| Timestamp Validation | ±5m future / 24h past bounds check | `MeshSecurity.ts` · `packet_validation.py` |
| Zero-Trust Relay Verification | Ed25519 verify + replay check before BLE/Wi-Fi forward | `MeshSecurity.verifyPacketBeforeRelay` |
| Backend Signature Enforcement | Rejects any packet missing or with invalid signature | `PacketValidationService.validate` |
| Zero-PHI Audit Logging | Structured logging without decrypted data | `MeshLogger` · `packet_processing.py` |

---

## 7. Residual Risks

| Risk | Description | Recommended Mitigation (Future) |
|------|-------------|----------------------------------|
| No Certificate Authority (CA) | Nodes are self-signed; no certificate revocation | Integrate ResQNet PKI with device enrollment + certificate revocation list |
| No Rate Limiting | DoS via high-volume crafted packet submission | Add sliding-window rate-limiter middleware to FastAPI |
| Master Mesh Key Distribution | Same AES-256-GCM key shared across all nodes | Per-session or per-session ECDH key agreement |
| ACK Packets Not Signed | Forged ACK can silence active re-transmitters | Extend Ed25519 signing to ACK broadcast payloads |
| Key Rotation | Keys never rotate | Implement `expo-task-manager` scheduled key rotation |

---

## 8. Future PKI & Certificate Authority Integration

When PKI infrastructure is available, the following migration path is recommended:

1. **Device Certificate Enrollment**: Each device generates an Ed25519 keypair, submits the public key to a ResQNet CA which issues a short-lived X.509 certificate (7-day TTL).
2. **Certificate Chain Verification**: Relay nodes and FastAPI verify the certificate chain, not just the self-signed public key embedded in the signature envelope.
3. **Certificate Revocation Lists (CRL)**: Compromised devices are revoked and blocked network-wide within TTL expiration.
4. **ECDH Session Key Agreement**: Replace shared AES-256-GCM master mesh key with per-pair ephemeral ECDH session keys, providing Perfect Forward Secrecy.

---

## 9. Penetration Test Results (Automated)

| Test # | Attack Vector | Expected Outcome | Result |
|--------|---------------|-----------------|--------|
| 1 | Valid signed encrypted packet | HTTP 200 ACKNOWLEDGED | ✅ PASSED |
| 2 | Tampered GPS coordinate after signing | HTTP 400 INVALID_SIGNATURE | ✅ PASSED |
| 3 | Modified signature hex bytes | HTTP 400 INVALID_SIGNATURE | ✅ PASSED |
| 4 | Replay same packet twice | HTTP 400 REPLAY_DETECTED | ✅ PASSED |
| 5 | Expired TTL=0 packet | HTTP 400 EXPIRED_PACKET | ✅ PASSED |
| 6 | Empty gateway header fallback | HTTP 200 with default gateway | ✅ PASSED |
| 7 | Duplicate signature on different packet | HTTP 400 INVALID_SIGNATURE or REPLAY_DETECTED | ✅ PASSED |
| 8 | Malformed JSON body | HTTP 422 Unprocessable Entity | ✅ PASSED |

**Result: 8/8 PASSED — Zero security regressions.**
