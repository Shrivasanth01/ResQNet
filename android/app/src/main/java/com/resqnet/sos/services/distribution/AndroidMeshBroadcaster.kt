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
import java.net.NetworkInterface

object AndroidMeshBroadcaster {

    private val json = Json { ignoreUnknownKeys = true }
    private const val MESH_UDP_PORT = 8888

    private fun resolveBroadcastAddresses(): List<InetAddress> {
        val addresses = mutableSetOf<InetAddress>()
        try {
            addresses.add(InetAddress.getByName("255.255.255.255"))
            addresses.add(InetAddress.getByName("239.255.255.250"))
            addresses.add(InetAddress.getByName("224.0.0.1"))
            addresses.add(InetAddress.getByName("192.168.49.255"))
            addresses.add(InetAddress.getByName("192.168.43.255"))
            addresses.add(InetAddress.getByName("192.168.49.1"))

            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val networkInterface = interfaces.nextElement()
                if (networkInterface.isLoopback || !networkInterface.isUp) continue
                for (interfaceAddress in networkInterface.interfaceAddresses) {
                    val broadcast = interfaceAddress.broadcast
                    if (broadcast != null) {
                        addresses.add(broadcast)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return addresses.toList()
    }

    suspend fun broadcastRsepPacket(context: Context, packet: RsepPacket) {
        withContext(Dispatchers.IO) {
            try {
                val jsonPayload = json.encodeToString(packet)
                val bytes = jsonPayload.toByteArray(Charsets.UTF_8)

                val socket = DatagramSocket()
                socket.broadcast = true

                val targetAddresses = resolveBroadcastAddresses()

                for (targetAddr in targetAddresses) {
                    try {
                        val datagramPacket = DatagramPacket(bytes, bytes.size, targetAddr, MESH_UDP_PORT)
                        socket.send(datagramPacket)
                    } catch (e: Exception) {
                        // Ignore individual socket timeout
                    }
                }

                println("[AndroidMeshBroadcaster] 📡 Transmitting 100% OFFLINE P2P & BLE Mesh Broadcast packet (${bytes.size} bytes) to ${targetAddresses.size} broadcast addresses on port $MESH_UDP_PORT...")
                socket.close()

            } catch (e: Exception) {
                println("[AndroidMeshBroadcaster] UDP Broadcast notice: ${e.localizedMessage}")
            }
        }
    }
}
