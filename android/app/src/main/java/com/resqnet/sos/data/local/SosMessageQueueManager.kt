package com.resqnet.sos.data.local

import android.content.Context
import com.resqnet.sos.data.model.RsepPacket
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

@Serializable
data class QueuedSosMessage(
    @SerialName("messageId") val messageId: String,
    @SerialName("sourceDeviceId") val sourceDeviceId: String,
    @SerialName("packet") val packet: RsepPacket,
    @SerialName("timestamp") val timestamp: Long = System.currentTimeMillis(),
    @SerialName("status") var status: String = "PENDING",
    @SerialName("priority") val priority: Int = 1,
    @SerialName("retryCount") var retryCount: Int = 0,
    @SerialName("lastAttemptTime") var lastAttemptTime: Long = 0L,
    @SerialName("ackReceived") var ackReceived: Boolean = false
)

/**
 * Persistent Message Queue Manager for Reliable Offline SOS Transmission & ACK Confirmation.
 * Messages survive app restarts, disconnections, and temporary device unavailability.
 */
class SosMessageQueueManager(private val context: Context) {

    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val queueDir: File
        get() = File(context.filesDir, "sos_persistent_queue").apply { if (!exists()) mkdirs() }

    fun enqueueMessage(packet: RsepPacket, sourceDeviceId: String): QueuedSosMessage {
        val messageId = packet.header.packetId
        val existing = getQueuedMessage(messageId)
        if (existing != null) {
            return existing
        }

        val queued = QueuedSosMessage(
            messageId = messageId,
            sourceDeviceId = sourceDeviceId,
            packet = packet,
            timestamp = System.currentTimeMillis(),
            status = "PENDING",
            priority = 1,
            retryCount = 0,
            lastAttemptTime = 0L,
            ackReceived = false
        )
        saveQueuedMessage(queued)
        println("[SosMessageQueueManager] 📥 Enqueued high-priority SOS message $messageId in persistent queue.")
        return queued
    }

    fun saveQueuedMessage(msg: QueuedSosMessage) {
        try {
            val file = File(queueDir, "${msg.messageId}.json")
            val content = json.encodeToString(msg)
            file.writeText(content)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getQueuedMessage(messageId: String): QueuedSosMessage? {
        try {
            val file = File(queueDir, "$messageId.json")
            if (file.exists()) {
                return json.decodeFromString<QueuedSosMessage>(file.readText())
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    fun getPendingMessages(): List<QueuedSosMessage> {
        val pending = mutableListOf<QueuedSosMessage>()
        try {
            val files = queueDir.listFiles { _, name -> name.endsWith(".json") } ?: emptyArray()
            files.sortBy { it.lastModified() }
            for (file in files) {
                try {
                    val msg = json.decodeFromString<QueuedSosMessage>(file.readText())
                    if (msg.status == "PENDING" || msg.status == "SENDING" || (!msg.ackReceived && msg.status != "DELIVERED" && msg.status != "EXPIRED")) {
                        pending.add(msg)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return pending.sortedByDescending { it.priority }
    }

    fun markAsAcked(messageId: String) {
        val msg = getQueuedMessage(messageId)
        if (msg != null) {
            msg.ackReceived = true
            msg.status = "DELIVERED"
            saveQueuedMessage(msg)
            println("[SosMessageQueueManager] ✅ ACK confirmed for $messageId! Queue status updated to DELIVERED.")
        }
    }

    fun updateAttempt(messageId: String, status: String = "SENDING") {
        val msg = getQueuedMessage(messageId)
        if (msg != null) {
            msg.status = status
            msg.retryCount += 1
            msg.lastAttemptTime = System.currentTimeMillis()
            saveQueuedMessage(msg)
        }
    }

    fun cleanupExpiredQueue(maxAgeHours: Int = 48) {
        try {
            val maxAgeMs = maxAgeHours * 3600 * 1000L
            val now = System.currentTimeMillis()
            val files = queueDir.listFiles() ?: return
            for (file in files) {
                if (now - file.lastModified() > maxAgeMs) {
                    file.delete()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
