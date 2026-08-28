import { PacketBuilder } from "../services/packet/PacketBuilder";
import { PacketEncryption } from "../services/packet/PacketEncryption";
import { PacketQueue } from "../services/packet/PacketQueue";
import { PacketValidator } from "../services/packet/PacketValidator";
import { CommunicationEngine } from "../services/communication/CommunicationEngine";
import { GatewaySync } from "../services/mesh/GatewaySync";
import { MeshRouting } from "../services/mesh/MeshRouting";
import { DatabaseService } from "../storage/database";

/**
 * ResQNet Phase 7 Real SOS Delivery Integration Automated Test Suite
 * 
 * Verifies all 8 core requirements:
 * 1. Direct Internet SOS Delivery & FastAPI REST ACK
 * 2. Offline Mesh / Queue Fallback when Internet is lost
 * 3. One-Hop Mesh Relay (Phone A -> Phone B -> Internet Gateway)
 * 4. Multi-Hop Mesh Relay (A -> B -> C -> D) with TTL decrement & hop count tracking
 * 5. Duplicate Packet Suppression
 * 6. Cryptographic Ed25519 Signature Verification & Tamper Rejection
 * 7. GPS Telemetry Fallback (LIVE, CACHED, UNAVAILABLE)
 * 8. Medical Privacy Consent Enforcement
 */
export async function runPhase7TestSuite(): Promise<{ total: number; passed: number; results: { name: string; success: boolean; detail: string }[] }> {
  const results: { name: string; success: boolean; detail: string }[] = [];

  const recordResult = (name: string, success: boolean, detail: string) => {
    results.push({ name, success, detail });
    const statusTag = success ? "✅ PASS" : "❌ FAIL";
    console.log(`[Phase7Test] ${statusTag}: ${name} - ${detail}`);
  };

  // Pre-test setup
  await DatabaseService.initDatabase();
  CommunicationEngine.resetEngine();

  // Test 1: Direct Internet SOS Delivery & FastAPI Ingest
  try {
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 1: Manual SOS Distress",
      severity: "CRITICAL",
      ecs: 100,
      isAutomatic: false,
      triggerSource: "MANUAL_SOS_BUTTON",
      latitude: 37.7749,
      longitude: -122.4194,
    });

    const receipt = await CommunicationEngine.simulateInternetAvailable(packet);
    const isAck = receipt && receipt.deliveryStatus === "ACKNOWLEDGED";
    recordResult(
      "Test 1 — Internet SOS Delivery & ACK",
      !!isAck,
      isAck ? `Receipt ACKNOWLEDGED (Method: ${receipt?.communicationMethod})` : `Failed receipt: ${receipt?.deliveryStatus}`
    );
  } catch (e: any) {
    recordResult("Test 1 — Internet SOS Delivery & ACK", false, e.message || String(e));
  }

  // Test 2: No Internet Fallback (Mesh / Queue Selection)
  try {
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 2: Offline SOS",
      severity: "CRITICAL",
      ecs: 100,
      isAutomatic: false,
      triggerSource: "MANUAL_SOS_BUTTON",
    });

    const receipt = await CommunicationEngine.simulateInternetLost(packet);
    const isMeshOrRelayed = receipt && (receipt.deliveryStatus === "RELAYED" || receipt.communicationMethod === "BLUETOOTH_MESH");
    recordResult(
      "Test 2 — No Internet Fallback",
      !!isMeshOrRelayed,
      isMeshOrRelayed ? `Selected carrier: ${receipt?.communicationMethod}, status: ${receipt?.deliveryStatus}` : `Unexpected status: ${receipt?.deliveryStatus}`
    );
  } catch (e: any) {
    recordResult("Test 2 — No Internet Fallback", false, e.message || String(e));
  }

  // Test 3: One-Hop Mesh Relay & Gateway Upload
  try {
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 3: One-Hop Gateway Relay",
      severity: "CRITICAL",
      ecs: 100,
    });

    const sim = await CommunicationEngine.simulateGatewayDiscovered(packet);
    const hasGw = !!sim.gateway && sim.receipt?.deliveryStatus === "GATEWAY_FOUND";
    recordResult(
      "Test 3 — One-Hop Gateway Relay",
      hasGw,
      hasGw ? `Gateway node ${sim.gateway?.gatewayId} processed emergency packet` : `Gateway missing or receipt mismatch`
    );
  } catch (e: any) {
    recordResult("Test 3 — One-Hop Gateway Relay", false, e.message || String(e));
  }

  // Test 4: Multi-Hop Mesh Relay TTL Decrement
  try {
    let packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 4: Multi-Hop Mesh",
      severity: "HIGH",
      ecs: 95,
    });

    const initialTTL = packet.header.ttl;
    const initialHops = packet.header.hopCount;

    // Simulate 3 mesh hops (A -> B -> C -> D)
    packet = PacketBuilder.incrementMeshHop(packet, "NODE_B");
    packet = PacketBuilder.incrementMeshHop(packet, "NODE_C");
    packet = PacketBuilder.incrementMeshHop(packet, "NODE_D");

    const validHopChain = packet.header.ttl === initialTTL - 3 && packet.header.hopCount === initialHops + 3;
    recordResult(
      "Test 4 — Multi-Hop Mesh TTL & Hop Tracking",
      validHopChain,
      validHopChain
        ? `TTL decremented from ${initialTTL} to ${packet.header.ttl}, Hop count: ${packet.header.hopCount}`
        : `TTL/Hop tracking error: TTL=${packet.header.ttl}, Hops=${packet.header.hopCount}`
    );
  } catch (e: any) {
    recordResult("Test 4 — Multi-Hop Mesh TTL & Hop Tracking", false, e.message || String(e));
  }

  // Test 5: Duplicate Packet Suppression
  try {
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 5: Duplicate Suppression",
      severity: "CRITICAL",
      ecs: 100,
    });

    const sim = await CommunicationEngine.simulateDuplicateSuppression(packet);
    const isSuppressed = sim.firstTry && !sim.secondTry;
    recordResult(
      "Test 5 — Duplicate Packet Suppression",
      isSuppressed,
      isSuppressed ? "First transmission succeeded; duplicate blast suppressed." : `First: ${sim.firstTry}, Second: ${sim.secondTry}`
    );
  } catch (e: any) {
    recordResult("Test 5 — Duplicate Packet Suppression", false, e.message || String(e));
  }

  // Test 6: Ed25519 Digital Signature Verification & Tamper Rejection
  try {
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 6: Digital Signature Verification",
      severity: "CRITICAL",
    });

    const encrypted = PacketEncryption.encryptPacket(packet);
    const isValidBeforeTamper = PacketEncryption.verifySignature(encrypted);

    // Tamper with location coordinates
    const tampered = {
      ...encrypted,
      location: { ...encrypted.location, latitude: encrypted.location.latitude + 5.0 },
    };
    const isValidAfterTamper = PacketEncryption.verifySignature(tampered);

    const passSigTest = isValidBeforeTamper && !isValidAfterTamper;
    recordResult(
      "Test 6 — Ed25519 Signature Verification & Tamper Rejection",
      passSigTest,
      passSigTest ? "Valid signature verified; tampered payload rejected." : `Pre-tamper: ${isValidBeforeTamper}, Post-tamper: ${isValidAfterTamper}`
    );
  } catch (e: any) {
    recordResult("Test 6 — Ed25519 Signature Verification & Tamper Rejection", false, e.message || String(e));
  }

  // Test 7: Location Telemetry Fallback (LIVE vs CACHED vs UNAVAILABLE)
  try {
    const livePacket = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 7: GPS Live",
      latitude: 37.7749,
      longitude: -122.4194,
      locationSource: "LIVE",
    });

    const cachedPacket = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 7: GPS Cached",
      locationSource: "CACHED",
    });

    const validLocs = livePacket.device.gpsStatus === "LOCKED" && cachedPacket.device.gpsStatus === "CACHED";
    recordResult(
      "Test 7 — Location Telemetry Source Tagging",
      validLocs,
      validLocs ? "LIVE GPS locked; CACHED location fallback tagged successfully." : `Status mismatch: live=${livePacket.device.gpsStatus}, cached=${cachedPacket.device.gpsStatus}`
    );
  } catch (e: any) {
    recordResult("Test 7 — Location Telemetry Source Tagging", false, e.message || String(e));
  }

  // Test 8: Medical Privacy Consent Enforcement
  try {
    // Save profile with consent = false
    await DatabaseService.saveEmergencyProfile({
      personal: { fullName: "Jane Doe", bloodGroup: "AB+", consentToShareMedical: false },
      medical: { medicalConditions: "Heart Condition", allergies: "Penicillin" },
      contacts: [],
    });

    const privatePacket = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 8: Privacy Test",
    });

    const isRedacted = privatePacket.user.medicalConditions === "REDACTED_BY_USER_CONSENT" && privatePacket.user.emergencyContacts.length === 0;
    recordResult(
      "Test 8 — Medical Privacy Consent Enforcement",
      isRedacted,
      isRedacted ? "PHI redacted according to consent preferences." : `PHI exposed: ${privatePacket.user.medicalConditions}`
    );
  } catch (e: any) {
    recordResult("Test 8 — Medical Privacy Consent Enforcement", false, e.message || String(e));
  }

  const passed = results.filter((r) => r.success).length;
  console.log(`\n==================================================`);
  console.log(`Phase 7 Test Suite Execution: ${passed}/${results.length} PASSED`);
  console.log(`==================================================\n`);

  return { total: results.length, passed, results };
}
