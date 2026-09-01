package com.resqnet.sos.data.local

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import com.resqnet.sos.data.model.RsepPacket
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

/**
 * Vault for storing and managing emergency RSEP packets RECEIVED from nearby victim devices via Mesh network.
 */
class ReceivedIncidentsVault(private val context: Context) {

    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val receivedDir: File
        get() = File(context.filesDir, "received_rseps").apply { if (!exists()) mkdirs() }

    fun saveReceivedPacket(packet: RsepPacket) {
        try {
            val file = File(receivedDir, "${packet.header.packetId}.rsep")
            val content = json.encodeToString(packet)
            file.writeText(content)

            // Post system notification on receiving device
            postNotification(packet)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getReceivedPackets(): List<RsepPacket> {
        val list = mutableListOf<RsepPacket>()
        try {
            val files = receivedDir.listFiles { _, name -> name.endsWith(".rsep") } ?: emptyArray()
            files.sortByDescending { it.lastModified() }
            for (file in files) {
                try {
                    val content = file.readText()
                    val packet = json.decodeFromString<RsepPacket>(content)
                    list.add(packet)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }

    fun clearReceivedPackets() {
        try {
            receivedDir.listFiles()?.forEach { it.delete() }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @android.annotation.SuppressLint("MissingPermission")
    private fun postNotification(packet: RsepPacket) {
        try {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channelId = "resqnet_sos_alerts"

            val channel = NotificationChannel(
                channelId,
                "ResQNet SOS Emergency Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority notifications for received mesh SOS alerts"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)

            val builder = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.stat_sys_warning)
                .setContentTitle("🚨 SOS DISTRESS ALERT RECEIVED!")
                .setContentText("Victim: ${packet.user.name} • Blood: ${packet.user.bloodGroup} • Lat: ${packet.location.latitude}")
                .setStyle(
                    NotificationCompat.BigTextStyle().bigText(
                        "🚨 EMERGENCY SOS RECEIVED VIA MESH!\n" +
                                "Victim Name: ${packet.user.name}\n" +
                                "Blood Group: ${packet.user.bloodGroup}\n" +
                                "Medical Conditions: ${packet.user.medicalConditions}\n" +
                                "GPS Coordinates: ${packet.location.latitude}, ${packet.location.longitude}"
                    )
                )
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)

            notificationManager.notify(packet.header.packetId.hashCode(), builder.build())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
