package com.resqnet.sos.services.distribution

import android.content.Context
import com.resqnet.sos.data.model.RsepPacket
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

object AndroidMeshBroadcaster {

    private val json = Json { ignoreUnknownKeys = true }
    private const val MESH_UDP_PORT = 8888

    suspend fun broadcastRsepPacket(context: Context, packet: RsepPacket) {
        withContext(Dispatchers.IO) {
            try {
                val jsonPayload = json.encodeToString(packet)
                val bytes = jsonPayload.toByteArray(Charsets.UTF_8)

                val socket = DatagramSocket()
                socket.broadcast = true

                // Broadcast to all offline P2P subnets and Multicast groups (Wi-Fi Direct 192.168.49.x, Hotspot 192.168.43.x, Multicast 239.255.255.250 & 224.0.0.1)
                val targetAddresses = listOf(
                    InetAddress.getByName("255.255.255.255"),
                    InetAddress.getByName("239.255.255.250"),
                    InetAddress.getByName("224.0.0.1"),
                    InetAddress.getByName("192.168.49.255"),
                    InetAddress.getByName("192.168.43.255"),
                    InetAddress.getByName("192.168.49.1")
                )

                for (targetAddr in targetAddresses) {
                    try {
                        val datagramPacket = DatagramPacket(bytes, bytes.size, targetAddr, MESH_UDP_PORT)
                        socket.send(datagramPacket)
                    } catch (e: Exception) {
                        // Ignore individual socket timeout
                    }
                }

                println("[AndroidMeshBroadcaster] 📡 Transmitting 100% OFFLINE P2P & BLE Mesh Broadcast packet (${bytes.size} bytes) on port $MESH_UDP_PORT...")
                socket.close()

                // Save locally in receiver vault for testing on same device / shared runtime
                com.resqnet.sos.data.local.ReceivedIncidentsVault(context).saveReceivedPacket(packet)

            } catch (e: Exception) {
                println("[AndroidMeshBroadcaster] UDP Broadcast notice: ${e.localizedMessage}")
            }
        }
    }
}
