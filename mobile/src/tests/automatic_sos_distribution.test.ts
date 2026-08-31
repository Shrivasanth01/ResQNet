import {
  ExistingRSEPManager,
  DuplicateDetectionManager,
  TTLManager,
  DeviceDiscoveryManager,
  AutomaticConnectionManager,
  RSEPTransferManager,
  AutomaticRelayManager,
  InternetGatewayManager,
  AutomaticSOSController,
  SOSProgressEvent,
} from "../services/distribution";
import { PacketBuilder } from "../services/packet/PacketBuilder";

async function runAutomaticSOSDistributionTests() {
  console.log("================================================================================");
  console.log("🧪 RESQNET AUTOMATIC SOS DISTRIBUTION SYSTEM — FULL TEST SUITE");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Existing RSEP System (Zero Regeneration, Zero Manual Selection)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 1] Existing RSEP System (Zero User Selection & Zero Regeneration)");
  const rsep = await ExistingRSEPManager.getExistingRSEP();
  assert(!!rsep && !!rsep.header.packetId, "Loads existing RSEP file from storage/vault automatically");
  assert(rsep.incident.severity === "CRITICAL", "Preserves source emergency packet metadata without altering dossier");
  assert(rsep.header.ttl === 64 || rsep.header.ttl === 5, "Maintains original TTL limit");

  // -------------------------------------------------------------------------
  // TEST 2: Duplicate Protection (DUPLICATE -> IGNORE)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 2] Duplicate Protection Firewall");
  DuplicateDetectionManager.resetRegistry();
  const testPacketId = "SOS-TEST-998877";

  const firstArrival = DuplicateDetectionManager.isDuplicate(testPacketId, 1);
  assert(!firstArrival, "First arrival of RSEP marked as RECEIVED (Not duplicate)");

  const secondArrival = DuplicateDetectionManager.isDuplicate(testPacketId, 2);
  assert(secondArrival, "Second arrival with same ID identified as DUPLICATE -> IGNORE");

  const thirdArrival = DuplicateDetectionManager.isDuplicate(testPacketId, 3);
  assert(thirdArrival, "Third arrival correctly suppressed from looping in mesh");
  assert(DuplicateDetectionManager.getDuplicateSuppressionCount() === 2, "Duplicate counter recorded exactly 2 suppressed loop attempts");

  // -------------------------------------------------------------------------
  // TEST 3: TTL / Relay Limit Management
  // -------------------------------------------------------------------------
  console.log("\n[TEST 3] TTL & Relay Limit Management");
  let packetHop = await PacketBuilder.buildEmergencyPacket({
    emergencyType: "TTL Test",
    severity: "CRITICAL",
  });
  packetHop.header.ttl = 3;
  packetHop.header.hopCount = 0;

  assert(TTLManager.canRelay(packetHop), "Packet with TTL=3 allowed to relay");

  // Hop 1
  packetHop = TTLManager.decrementTTL(packetHop, "NODE-A");
  assert(packetHop.header.ttl === 2 && packetHop.header.hopCount === 1, "Hop 1 decrements TTL to 2 and increments hopCount to 1");

  // Hop 2
  packetHop = TTLManager.decrementTTL(packetHop, "NODE-B");
  assert(packetHop.header.ttl === 1 && packetHop.header.hopCount === 2, "Hop 2 decrements TTL to 1 and increments hopCount to 2");

  // Hop 3
  packetHop = TTLManager.decrementTTL(packetHop, "NODE-C");
  assert(packetHop.header.ttl === 0 && packetHop.header.hopCount === 3, "Hop 3 reaches TTL=0");

  assert(!TTLManager.canRelay(packetHop), "Packet with TTL=0 triggers STOP RELAYING");

  // -------------------------------------------------------------------------
  // TEST 4: Automatic Device Discovery (BLE & Wi-Fi Direct)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 4] Automatic Device Discovery");
  DeviceDiscoveryManager.setMyNodeId("NODE-USER-ALPHA");
  const discovered = await DeviceDiscoveryManager.discoverNearbyDevices();
  assert(discovered.length >= 2, `Discovered ${discovered.length} nearby participating devices automatically`);
  assert(discovered.some((d) => d.transport === "BLE"), "Discovered BLE participating devices");
  assert(discovered.some((d) => d.transport === "WIFI_DIRECT" || d.transport === "LOCAL_WIFI"), "Discovered Wi-Fi Direct / Local Wi-Fi participating devices");

  // -------------------------------------------------------------------------
  // TEST 5: Automatic Connection & RSEP Transfer
  // -------------------------------------------------------------------------
  console.log("\n[TEST 5] Automatic Connection & RSEP Transfer (Zero User Touch)");
  const targetPeer = discovered[0];
  const connected = await AutomaticConnectionManager.autoConnect(targetPeer);
  assert(connected, `Automatically established connection with ${targetPeer.name} without user prompts`);

  const transfer = await RSEPTransferManager.transferRSEP(rsep, targetPeer);
  assert(transfer.success, `Successfully transferred existing RSEP (${transfer.bytesTransferred} bytes) over ${transfer.transport}`);

  // -------------------------------------------------------------------------
  // TEST 6: Automatic Multi-Hop Relay (Device A -> Device B -> Gateway)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 6] Automatic Multi-Hop Relay Execution");
  DuplicateDetectionManager.resetRegistry();
  const relayProgressEvents: SOSProgressEvent[] = [];

  const relayResult = await AutomaticRelayManager.receiveAndAutoRelay(
    rsep,
    "DEVICE-ORIGIN",
    (evt) => relayProgressEvents.push(evt)
  );

  assert(relayResult.success, "Relay manager successfully processed and forwarded incoming RSEP");
  assert(relayProgressEvents.length > 0, "Emitted real-time relay progress events");

  // -------------------------------------------------------------------------
  // TEST 7: Single-Click Full Master Pipeline (AutomaticSOSController)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 7] Single-Click Master SOS Pipeline (AutomaticSOSController)");
  DuplicateDetectionManager.resetRegistry();
  const masterEvents: SOSProgressEvent[] = [];

  const unsubscribe = AutomaticSOSController.addProgressListener((evt) => {
    masterEvents.push(evt);
    console.log(`     [PROGRESS UI EVENT] ${evt.step}: ${evt.message}`);
  });

  const masterResult = await AutomaticSOSController.triggerAutomaticSOS();
  unsubscribe();

  assert(masterResult.success, "Single SOS click successfully executed the entire automated distribution pipeline");
  assert(masterResult.deliveredToGateway, "RSEP successfully reached an Internet Gateway node");
  assert(
    masterEvents.some((e) => e.step === "SOS_ACTIVATED"),
    "Timeline includes SOS_ACTIVATED"
  );
  assert(
    masterEvents.some((e) => e.step === "RSEP_FOUND"),
    "Timeline includes RSEP_FOUND (Existing file loaded)"
  );
  assert(
    masterEvents.some((e) => e.step === "SEARCHING_FOR_NEARBY_DEVICES"),
    "Timeline includes SEARCHING_FOR_NEARBY_DEVICES"
  );
  assert(
    masterEvents.some((e) => e.step === "INTERNET_GATEWAY_FOUND" || e.step === "SOS_DELIVERED"),
    "Timeline includes INTERNET_GATEWAY_FOUND / SOS_DELIVERED"
  );

  console.log("\n================================================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  return { passed, failed };
}

runAutomaticSOSDistributionTests()
  .then((res) => {
    if (res.failed > 0) {
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("Test execution error:", err);
    process.exit(1);
  });
