import { PacketBuilder } from "../services/packet/PacketBuilder";
import { PacketEncryption } from "../services/packet/PacketEncryption";
import { CommunicationEngine } from "../services/communication/CommunicationEngine";
import { createNewUserProfile, saveCompleteProfile } from "../storage/database.web";

if (typeof (global as any).window === 'undefined') {
  (global as any).window = global;
  const storageMap: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => storageMap[key] || null,
    setItem: (key: string, val: string) => { storageMap[key] = String(val); },
    removeItem: (key: string) => { delete storageMap[key]; },
    clear: () => { for (const k in storageMap) delete storageMap[k]; }
  };
  (global as any).window.localStorage = (global as any).localStorage;
}

async function runNodePhase7() {
  console.log("\n==================================================");
  console.log("ResQNet Phase 7 SOS Delivery CLI Verification Suite");
  console.log("==================================================\n");

  const results: { name: string; success: boolean; detail: string }[] = [];

  const recordResult = (name: string, success: boolean, detail: string) => {
    results.push({ name, success, detail });
    const tag = success ? "✅ PASS" : "❌ FAIL";
    console.log(`[Phase7Test] ${tag}: ${name} - ${detail}`);
  };

  // Test 1: Direct Internet SOS Delivery & FastAPI REST Ingest
  try {
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 1: Direct Manual SOS",
      severity: "CRITICAL",
      ecs: 100,
      isAutomatic: false,
      triggerSource: "MANUAL_SOS_BUTTON",
      latitude: 37.7749,
      longitude: -122.4194,
    });

    const receipt = await CommunicationEngine.simulateInternetAvailable(packet);
    const isAck = receipt && receipt.status === "ACKNOWLEDGED";
    recordResult(
      "Test 1 — Direct Internet SOS Delivery & FastAPI ACK",
      !!isAck,
      isAck ? `ACK Received (Status: ${receipt?.status})` : `Failed status: ${receipt?.status}`
    );
  } catch (e: any) {
    recordResult("Test 1 — Direct Internet SOS Delivery & FastAPI ACK", false, String(e));
  }

  // Test 2: No Internet Fallback (Mesh / Queue Selection)
  try {
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 2: Offline SOS",
      severity: "CRITICAL",
      ecs: 100,
    });

    const receipt = await CommunicationEngine.simulateInternetLost(packet);
    const isMesh = receipt && (receipt.status === "RELAYED" || receipt.communicationMethod === "BLUETOOTH_MESH");
    recordResult(
      "Test 2 — No Internet Fallback",
      !!isMesh,
      isMesh ? `Carrier selected: ${receipt?.communicationMethod}` : `Failed carrier selection`
    );
  } catch (e: any) {
    recordResult("Test 2 — No Internet Fallback", false, String(e));
  }

  // Test 3: One-Hop Mesh Gateway Relay
  try {
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 3: One-Hop Relay",
      severity: "CRITICAL",
    });

    const sim = await CommunicationEngine.simulateGatewayDiscovered(packet);
    const hasGw = !!sim.gateway && sim.receipt?.status === "GATEWAY_FOUND";
    recordResult(
      "Test 3 — One-Hop Gateway Relay",
      hasGw,
      hasGw ? `Gateway ${sim.gateway?.gatewayId} processed emergency packet` : `Gateway missing`
    );
  } catch (e: any) {
    recordResult("Test 3 — One-Hop Gateway Relay", false, String(e));
  }

  // Test 4: Multi-Hop Mesh TTL & Hop Count Tracking
  try {
    let packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 4: Multi-Hop Mesh",
      severity: "HIGH",
    });

    const initialTTL = packet.header.ttl;
    const initialHops = packet.header.hopCount;

    packet = PacketBuilder.incrementMeshHop(packet, "NODE_B");
    packet = PacketBuilder.incrementMeshHop(packet, "NODE_C");
    packet = PacketBuilder.incrementMeshHop(packet, "NODE_D");

    const validChain = packet.header.ttl === initialTTL - 3 && packet.header.hopCount === initialHops + 3;
    recordResult(
      "Test 4 — Multi-Hop Mesh TTL & Hop Tracking",
      validChain,
      validChain ? `TTL: ${initialTTL} -> ${packet.header.ttl}, Hops: ${packet.header.hopCount}` : "Invalid hop count"
    );
  } catch (e: any) {
    recordResult("Test 4 — Multi-Hop Mesh TTL & Hop Tracking", false, String(e));
  }

  // Test 5: Duplicate Packet Suppression
  try {
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 5: Duplicate Suppression",
      severity: "CRITICAL",
    });

    const sim = await CommunicationEngine.simulateDuplicateSuppression(packet);
    const isSuppressed = sim.firstTry && !sim.secondTry;
    recordResult(
      "Test 5 — Duplicate Packet Suppression",
      isSuppressed,
      isSuppressed ? "First attempt succeeded; second duplicate attempt suppressed." : "Failed to suppress"
    );
  } catch (e: any) {
    recordResult("Test 5 — Duplicate Packet Suppression", false, String(e));
  }

  // Test 6: Ed25519 Signature Verification & Tamper Rejection
  try {
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 6: Cryptographic Verification",
      severity: "CRITICAL",
    });

    const encrypted = PacketEncryption.encryptPacket(packet);
    const isValidPre = PacketEncryption.verifySignature(encrypted);

    const tampered = {
      ...encrypted,
      location: { ...encrypted.location, latitude: encrypted.location.latitude + 10.0 },
    };
    const isValidPost = PacketEncryption.verifySignature(tampered);

    const passSig = isValidPre && !isValidPost;
    recordResult(
      "Test 6 — Ed25519 Signature Verification & Tamper Rejection",
      passSig,
      passSig ? "Valid signature verified; tampered payload rejected." : "Signature check failed"
    );
  } catch (e: any) {
    recordResult("Test 6 — Ed25519 Signature Verification & Tamper Rejection", false, String(e));
  }

  // Test 7: Location Source Tagging
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
      "Test 7 — Location Source Tagging (LIVE vs CACHED)",
      validLocs,
      validLocs ? `LIVE status: ${livePacket.device.gpsStatus}, CACHED status: ${cachedPacket.device.gpsStatus}` : "Location status mismatch"
    );
  } catch (e: any) {
    recordResult("Test 7 — Location Source Tagging (LIVE vs CACHED)", false, String(e));
  }

  // Test 8: Medical Privacy Consent Enforcement
  try {
    const testProfile = createNewUserProfile("Test User", "test@resqnet.org");
    testProfile.personal.consentToShareMedical = false;
    testProfile.medical.medicalConditions = "Asthma";
    testProfile.medical.allergies = "Dust";
    await saveCompleteProfile(testProfile);

    const privatePacket = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Test 8: Privacy Enforcement",
    });

    const isRedacted = privatePacket.user.medicalConditions === "REDACTED_BY_USER_CONSENT";
    recordResult(
      "Test 8 — Medical Privacy Consent Enforcement",
      isRedacted,
      isRedacted ? "PHI redacted according to consent preferences." : "PHI exposed"
    );
  } catch (e: any) {
    recordResult("Test 8 — Medical Privacy Consent Enforcement", false, String(e));
  }

  const passed = results.filter((r) => r.success).length;
  console.log(`\n==================================================`);
  console.log(`SUMMARY: ${passed}/${results.length} PASSED`);
  console.log(`==================================================\n`);

  if (passed === results.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runNodePhase7();
