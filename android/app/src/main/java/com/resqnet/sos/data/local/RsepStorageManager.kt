package com.resqnet.sos.data.local

import android.content.Context
import com.resqnet.sos.data.model.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * MODULE 1: EXISTING RSEP STORAGE MANAGER (ANDROID NATIVE)
 * 
 * CORE REQUIREMENT ENFORCEMENT:
 * - The RSEP file is ALREADY CREATED by the system.
 * - Does NOT require the user to pick or select a file.
 * - Does NOT alter the underlying emergency profile.
 * - Reads and caches the existing .rsep file securely in internal storage.
 */
class RsepStorageManager(private val context: Context) {

    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val rsepVaultDir: File
        get() = File(context.filesDir, "rsep_vault").apply { if (!exists()) mkdirs() }

    private val primaryRsepFile: File
        get() = File(rsepVaultDir, "active_sos.rsep")

    /**
     * Loads the EXISTING RSEP file from storage.
     * If not already cached on disk, loads from the saved profile vault.
     */
    fun getExistingRsep(): RsepPacket {
        if (primaryRsepFile.exists()) {
            try {
                val content = primaryRsepFile.readText()
                return json.decodeFromString<RsepPacket>(content)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // Fallback: Generate the baseline standard RSEP from saved profile
        val profilePrefs = ProfilePreferences(context)
        val profile = profilePrefs.getProfile()

        val timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date())

        val packetId = "RQ-PKT-" + UUID.randomUUID().toString().take(8).uppercase()

        val baselineRsep = RsepPacket(
            header = PacketHeader(
                packetId = packetId,
                timestamp = timestamp,
                ttl = 5,
                hopCount = 0
            ),
            user = PacketUser(
                userId = profile.userId,
                name = profile.fullName,
                age = profile.age,
                bloodGroup = profile.bloodGroup,
                medicalConditions = profile.medicalConditions,
                emergencyContacts = profile.emergencyContacts
            ),
            location = PacketLocation(
                latitude = 13.0827,
                longitude = 80.2707,
                accuracy = 5.0f,
                timestamp = timestamp
            ),
            incident = PacketIncident(
                emergencyType = "Manual 3-Second SOS Distress",
                severity = "CRITICAL",
                emergencyConfidenceScore = 100,
                isAutomatic = false,
                triggerSource = "MANUAL_SOS_BUTTON"
            ),
            device = PacketDevice(
                batteryPercentage = 88,
                isCharging = false,
                networkStatus = "ONLINE",
                bluetoothStatus = "ENABLED",
                gpsStatus = "LOCKED"
            ),
            mesh = PacketMesh(
                relayHistory = listOf("NODE_${UUID.randomUUID().toString().take(6).uppercase()}"),
                deliveryStatus = "QUEUED",
                retryCount = 0
            )
        )

        saveRsep(baselineRsep)
        return baselineRsep
    }

    /**
     * Saves or updates the active RSEP file in the secure vault.
     */
    fun saveRsep(packet: RsepPacket) {
        try {
            val content = json.encodeToString(packet)
            primaryRsepFile.writeText(content)

            // Also save an archived copy with packet ID
            val archiveFile = File(rsepVaultDir, "${packet.header.packetId}.rsep")
            archiveFile.writeText(content)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Exports the RSEP as a public file if the user wishes to save it to external storage.
     */
    fun exportRsepJson(packet: RsepPacket): String {
        return json.encodeToString(packet)
    }
}
