package com.resqnet.rescuer.data

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import com.resqnet.sos.data.model.RsepPacket
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

@Serializable
data class RescuerVictimRecord(
    @SerialName("packet") val packet: RsepPacket,
    @SerialName("triageStatus") var triageStatus: String = "PENDING", // PENDING, DISPATCHED, RESCUING, RESCUED, EVACUATED
    @SerialName("rescuerNotes") var rescuerNotes: String = "",
    @SerialName("lastUpdatedMs") var lastUpdatedMs: Long = System.currentTimeMillis()
)

class RescuerVault(private val context: Context) {

    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val vaultDir: File
        get() = File(context.filesDir, "rescuer_victim_vault").apply { if (!exists()) mkdirs() }

    fun saveVictimRecord(packet: RsepPacket, status: String = "PENDING", notes: String = "") {
        try {
            val file = File(vaultDir, "${packet.header.packetId}.json")
            val existing = getVictimRecord(packet.header.packetId)
            val currentStatus = existing?.triageStatus ?: status
            val currentNotes = existing?.rescuerNotes ?: notes

            val record = RescuerVictimRecord(
                packet = packet,
                triageStatus = currentStatus,
                rescuerNotes = currentNotes,
                lastUpdatedMs = System.currentTimeMillis()
            )

            file.writeText(json.encodeToString(record))
            postRescuerNotification(packet)
            println("[RescuerVault] 📥 Ingested victim SOS packet (${packet.header.packetId}) for ${packet.user.name}")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun updateTriageStatus(packetId: String, newStatus: String, notes: String? = null) {
        val record = getVictimRecord(packetId)
        if (record != null) {
            record.triageStatus = newStatus
            if (notes != null) {
                record.rescuerNotes = notes
            }
            record.lastUpdatedMs = System.currentTimeMillis()
            val file = File(vaultDir, "$packetId.json")
            file.writeText(json.encodeToString(record))
            println("[RescuerVault] 📝 Updated triage status for $packetId to $newStatus")
        }
    }

    fun getVictimRecord(packetId: String): RescuerVictimRecord? {
        try {
            val file = File(vaultDir, "$packetId.json")
            if (file.exists()) {
                return json.decodeFromString<RescuerVictimRecord>(file.readText())
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    fun getAllVictimRecords(): List<RescuerVictimRecord> {
        val records = mutableListOf<RescuerVictimRecord>()
        try {
            val files = vaultDir.listFiles { _, name -> name.endsWith(".json") } ?: emptyArray()
            files.sortByDescending { it.lastModified() }
            for (file in files) {
                try {
                    val rec = json.decodeFromString<RescuerVictimRecord>(file.readText())
                    records.add(rec)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return records
    }

    fun deleteVictimRecord(packetId: String) {
        try {
            val file = File(vaultDir, "$packetId.json")
            if (file.exists()) {
                file.delete()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun clearAllRecords() {
        try {
            vaultDir.listFiles()?.forEach { it.delete() }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @android.annotation.SuppressLint("MissingPermission")
    private fun postRescuerNotification(packet: RsepPacket) {
        try {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channelId = "rescuer_sos_alerts"

            val channel = NotificationChannel(
                channelId,
                "ResQNet Rescuer Triage Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority notifications for ingested victim SOS beacons"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)

            val builder = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.stat_sys_warning)
                .setContentTitle("🚨 RESCUER ALERT: VICTIM SOS INGESTED!")
                .setContentText("Victim: ${packet.user.name} • Blood: ${packet.user.bloodGroup} • Lat: ${packet.location.latitude}")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)

            notificationManager.notify(packet.header.packetId.hashCode(), builder.build())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
