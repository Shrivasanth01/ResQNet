package com.resqnet.sos.services.distribution

import com.resqnet.sos.data.model.RsepPacket

/**
 * MODULE 8: TTL / RELAY LIMIT MANAGER
 * 
 * CORE REQUIREMENT:
 * - Initial TTL = 5
 * - Decrements by 1 on every relay hop.
 * - When TTL = 0, STOP RELAYING.
 */
object TtlManager {

    const val INITIAL_DEFAULT_TTL = 5

    fun canRelay(packet: RsepPacket): Boolean {
        val ttl = packet.header.ttl
        if (ttl <= 0) {
            println("[TtlManager] 🛑 TTL EXPIRED (TTL=$ttl). STOP RELAYING packet ${packet.header.packetId}.")
            return false
        }
        return true
    }

    fun decrementTtl(packet: RsepPacket, relayNodeId: String): RsepPacket {
        val currentTtl = packet.header.ttl
        val currentHops = packet.header.hopCount
        val newTtl = (currentTtl - 1).coerceAtLeast(0)
        val newHops = currentHops + 1

        val updatedRelayHistory = packet.mesh.relayHistory.toMutableList().apply {
            if (!contains(relayNodeId)) add(relayNodeId)
        }

        println("[TtlManager] 📉 Hop $newHops executed by $relayNodeId: TTL decremented from $currentTtl to $newTtl")

        return packet.copy(
            header = packet.header.copy(
                ttl = newTtl,
                hopCount = newHops
            ),
            mesh = packet.mesh.copy(
                relayHistory = updatedRelayHistory
            )
        )
    }
}
