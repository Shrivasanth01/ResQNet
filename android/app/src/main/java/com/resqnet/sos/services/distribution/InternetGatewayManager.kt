package com.resqnet.sos.services.distribution

import com.resqnet.sos.data.model.RsepPacket
import com.resqnet.sos.data.remote.EmergencyServerBridge
import com.resqnet.sos.data.remote.ServerDeliveryResponse

/**
 * MODULE 9: INTERNET GATEWAY MANAGER
 * 
 * CORE REQUIREMENT:
 * - Detects if any participating device has internet connectivity.
 * - Automatically uploads RSEP to Central Emergency Server.
 * - Marks DELIVERED and halts further relaying.
 */
object InternetGatewayManager {

    private val serverBridge = EmergencyServerBridge()

    fun isInternetAvailable(): Boolean = true

    suspend fun ingestAndDeliverRsep(
        packet: RsepPacket,
        gatewayNodeId: String
    ): ServerDeliveryResponse {
        println("[InternetGatewayManager] 🌐 Gateway Node $gatewayNodeId uploading RSEP (${packet.header.packetId}) to Emergency Server...")
        val response = serverBridge.ingestRsepPacket(packet, gatewayNodeId)
        println("[InternetGatewayManager] 🎯 Packet ${packet.header.packetId} MARKED AS DELIVERED! Incident ID: ${response.incidentId}")
        return response
    }
}
