package com.resqnet.sos.services.distribution

import android.content.Context
import android.net.wifi.WifiManager
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.data.local.ReceivedIncidentsVault
import com.resqnet.sos.data.local.RsepStorageManager
import com.resqnet.sos.data.model.RsepPacket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetSocketAddress

object AndroidMeshListener {

    private val json = Json { ignoreUnknownKeys = true }
    private const val MESH_UDP_PORT = 8888
    @Volatile
    private var isListening = false

    fun startListening(context: Context) {
        if (isListening) return
        isListening = true

        val appContext = context.applicationContext
        val vault = ReceivedIncidentsVault(appContext)

        CoroutineScope(Dispatchers.IO).launch {
            println("[AndroidMeshListener] 👂 Acquiring Wi-Fi Multicast Lock & starting UDP listener on port $MESH_UDP_PORT...")

            var multicastLock: WifiManager.MulticastLock? = null
            var wifiLock: WifiManager.WifiLock? = null
            try {
                val wifiManager = appContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
                multicastLock = wifiManager?.createMulticastLock("resqnet_multicast_lock")?.apply {
                    setReferenceCounted(true)
                    acquire()
                }
                @Suppress("DEPRECATION")
                wifiLock = wifiManager?.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "resqnet_wifi_lock")?.apply {
                    setReferenceCounted(true)
                    acquire()
                }
            } catch (e: Exception) {
                println("[AndroidMeshListener] Wi-Fi Lock notice: ${e.localizedMessage}")
            }

            while (isListening) {
                var socket: DatagramSocket? = null
                try {
                    socket = DatagramSocket(null).apply {
                        reuseAddress = true
                        bind(InetSocketAddress(MESH_UDP_PORT))
                    }

                    val buffer = ByteArray(8192)

                    while (isListening && !socket.isClosed) {
                        val packet = DatagramPacket(buffer, buffer.size)
                        socket.receive(packet)

                        val receivedText = String(packet.data, 0, packet.length, Charsets.UTF_8)
                        println("[AndroidMeshListener] 📩 Received UDP Mesh packet from ${packet.address.hostAddress}:${packet.port} (${packet.length} bytes)")

                        try {
                            val rsepPacket = json.decodeFromString<RsepPacket>(receivedText)
                            val activeSosId = RsepStorageManager(appContext).getActiveSosPacketId()

                            if (activeSosId != null && rsepPacket.header.packetId == activeSosId) {
                                println("[AndroidMeshListener] 🛑 Ignored local loopback packet for Civilian Vault (${rsepPacket.header.packetId})")
                                try {
                                    val rescuerVaultClass = Class.forName("com.resqnet.rescuer.data.RescuerVault")
                                    val rescuerVaultInst = rescuerVaultClass.getConstructor(Context::class.java).newInstance(appContext)
                                    val saveMethod = rescuerVaultClass.getMethod("saveVictimRecord", RsepPacket::class.java, String::class.java, String::class.java)
                                    saveMethod.invoke(rescuerVaultInst, rsepPacket, "PENDING", "")
                                    println("[AndroidMeshListener] 📥 Ingested local active SOS packet into RescuerVault (${rsepPacket.header.packetId})")
                                } catch (_: Exception) {}
                            } else {
                                vault.saveReceivedPacket(rsepPacket)
                                println("[AndroidMeshListener] ✅ Saved received peer RSEP packet (${rsepPacket.header.packetId}) from ${rsepPacket.user.name}")

                                try {
                                    val rescuerVaultClass = Class.forName("com.resqnet.rescuer.data.RescuerVault")
                                    val rescuerVaultInst = rescuerVaultClass.getConstructor(Context::class.java).newInstance(appContext)
                                    val saveMethod = rescuerVaultClass.getMethod("saveVictimRecord", RsepPacket::class.java, String::class.java, String::class.java)
                                    saveMethod.invoke(rescuerVaultInst, rsepPacket, "PENDING", "")
                                    println("[AndroidMeshListener] 📥 Ingested into RescuerVault for Rescuer App (${rsepPacket.header.packetId})")
                                } catch (_: Exception) {}
                            }
                        } catch (e: Exception) {
                            println("[AndroidMeshListener] Packet parse error: ${e.localizedMessage}")
                        }
                    }
                } catch (e: Exception) {
                    println("[AndroidMeshListener] UDP Socket notice: ${e.localizedMessage}. Retrying in 2s...")
                    delay(2000)
                } finally {
                    try {
                        socket?.close()
                    } catch (_: Exception) {}
                }
            }

            try {
                multicastLock?.release()
                wifiLock?.release()
            } catch (_: Exception) {}
        }
    }
}
