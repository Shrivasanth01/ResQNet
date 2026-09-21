package com.resqnet.sos.data.local

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

@Serializable
data class SentSosRecord(
    val packetId: String,
    val timestampMillis: Long,
    val status: String,
    val latitude: Double = 0.0,
    val longitude: Double = 0.0
)

/**
 * Vault for storing local audit records when this device transmits an SOS distress dispatch.
 */
class SentIncidentsVault(private val context: Context) {

    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val sentDir: File
        get() = File(context.filesDir, "sent_rseps").apply { if (!exists()) mkdirs() }

    fun saveSentDispatch(record: SentSosRecord) {
        try {
            val file = File(sentDir, "${record.packetId}.sent")
            val content = json.encodeToString(record)
            file.writeText(content)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getSentDispatches(): List<SentSosRecord> {
        val list = mutableListOf<SentSosRecord>()
        try {
            val files = sentDir.listFiles { _, name -> name.endsWith(".sent") } ?: emptyArray()
            files.sortByDescending { it.lastModified() }
            for (file in files) {
                try {
                    val content = file.readText()
                    val record = json.decodeFromString<SentSosRecord>(content)
                    list.add(record)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }

    fun clearSentDispatches() {
        try {
            sentDir.listFiles()?.forEach { it.delete() }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
