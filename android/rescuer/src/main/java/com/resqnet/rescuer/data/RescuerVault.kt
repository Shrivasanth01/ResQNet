package com.resqnet.rescuer.data

import android.R
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.util.Base64
import androidx.core.app.NotificationCompat
import com.resqnet.sos.data.model.RsepPacket
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.util.concurrent.ConcurrentHashMap

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
        isLenient = true
    }

    private val vaultDir: File
        get() = File(context.filesDir, "rescuer_victim_vault").apply { if (!exists()) mkdirs() }

    companion object {
        private val inMemoryCache = ConcurrentHashMap<String, RescuerVictimRecord>()
    }

    fun saveVictimRecord(packet: RsepPacket, status: String = "PENDING", notes: String = "") {
        try {
            val file = File(vaultDir, "${packet.header.packetId}.json")
            val existing = getVictimRecord(packet.header.packetId)
            val currentStatus = existing?.triageStatus ?: status
            val currentNotes = existing?.rescuerNotes ?: notes

            val mergedPacket = if (existing != null && !packet.incident.hasVoiceNote && existing.packet.incident.hasVoiceNote) {
                packet.copy(
                    incident = packet.incident.copy(
                        hasVoiceNote = true,
                        voiceNoteBase64 = existing.packet.incident.voiceNoteBase64,
                        voiceNoteDurationSec = existing.packet.incident.voiceNoteDurationSec
                    )
                )
            } else {
                packet
            }

            val record = RescuerVictimRecord(
                packet = mergedPacket,
                triageStatus = currentStatus,
                rescuerNotes = currentNotes,
                lastUpdatedMs = System.currentTimeMillis()
            )

            // 1. Store in memory cache immediately for instant UI update
            inMemoryCache[packet.header.packetId] = record

            // 2. Persist to disk
            file.writeText(json.encodeToString(record))

            // Auto-decode victim voice note payload if attached
            if (mergedPacket.incident.hasVoiceNote && !mergedPacket.incident.voiceNoteBase64.isNullOrEmpty()) {
                try {
                    val audioFile = File(context.cacheDir, "voice_${mergedPacket.header.packetId}.aac")
                    val bytes = Base64.decode(mergedPacket.incident.voiceNoteBase64, Base64.NO_WRAP)
                    audioFile.writeBytes(bytes)
                    println("[RescuerVault] 🔊 Successfully decoded victim voice note AAC file (${audioFile.length()} bytes)")
                } catch (ae: Exception) {
                    ae.printStackTrace()
                }
            }

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
            inMemoryCache[packetId] = record
            val file = File(vaultDir, "$packetId.json")
            try {
                file.writeText(json.encodeToString(record))
            } catch (e: Exception) {
                e.printStackTrace()
            }
            println("[RescuerVault] 📝 Updated triage status for $packetId to $newStatus")
        }
    }

    fun deleteVictimRecord(packetId: String) {
        inMemoryCache.remove(packetId)
        try {
            val file = File(vaultDir, "$packetId.json")
            if (file.exists()) file.delete()
            println("[RescuerVault] 🗑️ Deleted victim record $packetId")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun clearAllRecords() {
        inMemoryCache.clear()
        try {
            vaultDir.listFiles()?.forEach { if (it.name.endsWith(".json")) it.delete() }
            println("[RescuerVault] 🧹 Cleared all victim records from vault.")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getVictimRecord(packetId: String): RescuerVictimRecord? {
        inMemoryCache[packetId]?.let { return it }
        try {
            val file = File(vaultDir, "$packetId.json")
            if (file.exists()) {
                val rec = json.decodeFromString<RescuerVictimRecord>(file.readText())
                inMemoryCache[packetId] = rec
                return rec
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    fun getAllVictimRecords(): List<RescuerVictimRecord> {
        val map = LinkedHashMap<String, RescuerVictimRecord>()
        
        // 1. Load from memory cache
        inMemoryCache.forEach { (id, rec) ->
            map[id] = rec
        }

        // 2. Load from disk
        try {
            val files = vaultDir.listFiles { _, name -> name.endsWith(".json") } ?: emptyArray()
            files.sortByDescending { it.lastModified() }
            for (file in files) {
                val id = file.nameWithoutExtension
                if (!map.containsKey(id)) {
                    try {
                        val rec = json.decodeFromString<RescuerVictimRecord>(file.readText())
                        map[id] = rec
                        inMemoryCache[id] = rec
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return map.values.sortedByDescending { it.lastUpdatedMs }
    }

    private fun postRescuerNotification(packet: RsepPacket) {
        try {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
            val channelId = "rescuer_sos_alerts"

            val channel = NotificationChannel(
                channelId,
                "Rescuer Emergency SOS Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority notifications for received victim SOS distress beacons"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)

            val notification = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.drawable.ic_dialog_alert)
                .setContentTitle("🚨 SOS DISTRESS ALERT RECEIVED!")
                .setContentText("Victim Name: ${packet.user.name}\nBlood Group: ${packet.user.bloodGroup}\nMedical Conditions: ${packet.user.medicalConditions.ifBlank { "NIL" }}\nGPS Coordinates: ${packet.location.latitude}, ${packet.location.longitude}")
                .setStyle(NotificationCompat.BigTextStyle().bigText("🚨 EMERGENCY SOS RECEIVED VIA MESH!\nVictim Name: ${packet.user.name}\nBlood Group: ${packet.user.bloodGroup}\nMedical Conditions: ${packet.user.medicalConditions.ifBlank { "NIL" }}\nGPS Coordinates: ${packet.location.latitude}, ${packet.location.longitude}"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .build()

            notificationManager.notify(packet.header.packetId.hashCode(), notification)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
