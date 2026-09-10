package com.resqnet.sos.data.local

import android.content.Context
import com.resqnet.sos.data.model.SosLocationRecord
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

/**
 * Persistent local database manager for SOS Location Tracking & History.
 * Stores, queries, indexes, and manages transmission status for offline location records.
 */
class SosLocationRepository(private val context: Context) {

    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val locationDir: File
        get() = File(context.filesDir, "sos_location_vault").apply { if (!exists()) mkdirs() }

    /**
     * Saves a new location update to local persistent storage.
     */
    fun saveLocationRecord(record: SosLocationRecord) {
        try {
            val fileName = "loc_${record.sosId}_${record.timestamp}.json"
            val file = File(locationDir, fileName)
            val content = json.encodeToString(record)
            file.writeText(content)
            println("[SosLocationRepository] 📍 Saved persistent location record (${record.latitude}, ${record.longitude}, pending=${!record.isTransmitted})")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Gets all persistent location records for a specific SOS session ordered by timestamp.
     */
    fun getLocationHistory(sosId: String): List<SosLocationRecord> {
        val records = mutableListOf<SosLocationRecord>()
        try {
            val files = locationDir.listFiles { _, name -> name.startsWith("loc_${sosId}_") && name.endsWith(".json") } ?: emptyArray()
            files.sortBy { it.lastModified() }
            for (file in files) {
                try {
                    val record = json.decodeFromString<SosLocationRecord>(file.readText())
                    records.add(record)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return records
    }

    /**
     * Retrieves the latest valid location record across all sessions or for a given SOS ID.
     */
    fun getLatestLocation(sosId: String? = null): SosLocationRecord? {
        try {
            val files = locationDir.listFiles { _, name ->
                name.startsWith("loc_") && name.endsWith(".json") && (sosId == null || name.contains(sosId))
            } ?: emptyArray()

            files.sortByDescending { it.lastModified() }
            val latestFile = files.firstOrNull() ?: return null
            return json.decodeFromString<SosLocationRecord>(latestFile.readText())
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    /**
     * Retrieves all unsent pending location records marked for network transmission or relay.
     */
    fun getPendingLocationRecords(): List<SosLocationRecord> {
        val pending = mutableListOf<SosLocationRecord>()
        try {
            val files = locationDir.listFiles { _, name -> name.startsWith("loc_") && name.endsWith(".json") } ?: emptyArray()
            files.sortBy { it.lastModified() }
            for (file in files) {
                try {
                    val record = json.decodeFromString<SosLocationRecord>(file.readText())
                    if (!record.isTransmitted) {
                        pending.add(record)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return pending
    }

    /**
     * Marks location records as transmitted upon successful cloud or relay upload.
     */
    fun markAsTransmitted(records: List<SosLocationRecord>) {
        for (record in records) {
            try {
                record.isTransmitted = true
                saveLocationRecord(record)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Retention policy: cleans up location records older than maxAgeDays (default 7 days).
     */
    fun cleanupExpiredData(maxAgeDays: Int = 7) {
        try {
            val maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000L
            val now = System.currentTimeMillis()
            val files = locationDir.listFiles() ?: return
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
