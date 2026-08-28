import { runPhase7TestSuite } from "./phase7_sos_delivery.test.js";

runPhase7TestSuite().then(({ total, passed, results }) => {
  if (passed === total) {
    console.log("SUCCESS: ALL PHASE 7 SOS DELIVERY TESTS PASSED!");
    process.exit(0);
  } else {
    console.error(`FAILURE: ${total - passed} TESTS FAILED.`);
    process.exit(1);
  }
}).catch((err) => {
  console.error("FATAL ERROR RUNNING PHASE 7 TESTS:", err);
  process.exit(1);
});
