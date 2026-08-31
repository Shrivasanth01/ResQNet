package com.resqnet.sos.services.distribution

import java.util.concurrent.ConcurrentHashMap

/**
 * MODULE 7: DUPLICATE DETECTION FIREWALL
 * 
 * CORE REQUIREMENT:
 * - Records SOS-XXXXX = RECEIVED.
 * - When same packet arrives again, logs DUPLICATE → IGNORE.
 * - Prevents broadcast storms and circular looping in the mesh.
 */
object DuplicateDetectionManager {

    private val seenPacketRegistry = ConcurrentHashMap<String, Long>()
    private var suppressedDuplicatesCount = 0

    fun isDuplicate(packetId: String, hop: Int = 1): Boolean {
        if (seenPacketRegistry.containsKey(packetId)) {
            suppressedDuplicatesCount++
            println("[DuplicateDetectionManager] 🚫 DUPLICATE DETECTED -> IGNORE: Packet $packetId already processed (Hop $hop). Dropping.")
            return true
        }

        seenPacketRegistry[packetId] = System.currentTimeMillis()
        println("[DuplicateDetectionManager] 📥 RECORDED: Packet $packetId marked as RECEIVED (Hop $hop).")
        return false
    }

    fun resetRegistry() {
        seenPacketRegistry.clear()
        suppressedDuplicatesCount = 0
    }

    fun getDuplicateSuppressionCount(): Int = suppressedDuplicatesCount
}
