package com.resqnet.sos.services.distribution

import com.resqnet.sos.data.model.RsepPacket
import kotlinx.coroutines.delay

/**
 * MODULE 6: AUTOMATIC RELAY MANAGER
 * 
 * CORE REQUIREMENT:
 * - Receiving devices automatically become relay nodes.
 * - Forwards RSEP: Device A -> Device B -> Device C -> Gateway -> Server.
 * - Stops when packet is duplicate, TTL reaches 0, or reaches Internet Gateway.
 */
object RelayManager {

    suspend fun receiveAndAutoRelay(
        incomingPacket: RsepPacket,
        fromNodeId: String,
        onProgress: (SosProgressEvent) -> Unit
    ): Boolean {
        val packetId = incomingPacket.header.packetId
        val myNodeId = DeviceDiscoveryManager.getMyNodeId()

        println("[RelayManager] 📥 Node $myNodeId received RSEP $packetId from $fromNodeId. Checking relay eligibility...")

        // 1. Duplicate Protection Check
        if (DuplicateDetectionManager.isDuplicate(packetId, incomingPacket.header.hopCount + 1)) {
            println("[RelayManager] 🚫 Duplicate detected. Halting relay.")
            return false
        }

        // 2. TTL Check
        if (!TtlManager.canRelay(incomingPacket)) {
            println("[RelayManager] 🛑 TTL <= 0. Halting relay.")
            return false
        }

        // 3. Decrement TTL and increment hopCount
        val forwardedPacket = TtlManager.decrementTtl(incomingPacket, myNodeId)

        onProgress(
            SosProgressEvent(
                step = SosDistributionStep.RELAYING,
                message = "🔁 RELAYING: Node $myNodeId forwarding RSEP across mesh (Hop ${forwardedPacket.header.hopCount})...",
                packetId = packetId,
                hopCount = forwardedPacket.header.hopCount,
                ttl = forwardedPacket.header.ttl,
                currentNodeId = myNodeId
            )
        )

        delay(300)
        return true
    }
}
