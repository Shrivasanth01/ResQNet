package com.resqnet.sos.services.distribution

import android.content.Context
import com.resqnet.sos.data.local.ReceivedIncidentsVault
import com.resqnet.sos.data.model.RsepPacket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import java.net.DatagramPacket
import java.net.DatagramSocket

object AndroidMeshListener {

    private val json = Json { ignoreUnknownKeys = true }
    private const val MESH_UDP_PORT = 8888
    private var isListening = false

    fun startListening(context: Context) {
        if (isListening) return
        isListening = true

        val vault = ReceivedIncidentsVault(context)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                println("[AndroidMeshListener] 👂 Starting background UDP Mesh listener on port $MESH_UDP_PORT...")
                val socket = DatagramSocket(MESH_UDP_PORT)
                socket.reuseAddress = true
                val buffer = ByteArray(8192)

                while (isListening) {
                    val packet = DatagramPacket(buffer, buffer.size)
                    socket.receive(packet)

                    val receivedText = String(packet.data, 0, packet.length, Charsets.UTF_8)
                    println("[AndroidMeshListener] 📩 Received UDP Mesh packet from ${packet.address.hostAddress} (${packet.length} bytes)")

                    try {
                        val rsepPacket = json.decodeFromString<RsepPacket>(receivedText)
                        vault.saveReceivedPacket(rsepPacket)
                        println("[AndroidMeshListener] ✅ Saved received RSEP packet (${rsepPacket.header.packetId}) from ${rsepPacket.user.name}")
                    } catch (e: Exception) {
                        println("[AndroidMeshListener] Packet parse error: ${e.localizedMessage}")
                    }
                }
            } catch (e: Exception) {
                println("[AndroidMeshListener] UDP Socket notice: ${e.localizedMessage}")
            }
        }
    }
}
