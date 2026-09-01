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

                val broadcastAddress = InetAddress.getByName("255.255.255.255")
                val datagramPacket = DatagramPacket(
                    bytes,
                    bytes.size,
                    broadcastAddress,
                    MESH_UDP_PORT
                )

                println("[AndroidMeshBroadcaster] 📡 Transmitting automatic UDP Mesh Broadcast packet (${bytes.size} bytes) on port $MESH_UDP_PORT...")
                socket.send(datagramPacket)
                socket.close()

                // Save locally in receiver vault for testing on same device / shared runtime
                com.resqnet.sos.data.local.ReceivedIncidentsVault(context).saveReceivedPacket(packet)

            } catch (e: Exception) {
                println("[AndroidMeshBroadcaster] UDP Broadcast notice: ${e.localizedMessage}")
            }
        }
    }
}
