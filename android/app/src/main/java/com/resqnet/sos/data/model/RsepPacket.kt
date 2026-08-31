package com.resqnet.sos.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Universal ResQNet Master Emergency RSEP Packet
 * Strictly matches the existing schema in mobile/src/types/packet.ts
 */
@Serializable
data class RsepPacket(
    @SerialName("header") val header: PacketHeader,
    @SerialName("user") val user: PacketUser,
    @SerialName("location") val location: PacketLocation,
    @SerialName("incident") val incident: PacketIncident,
    @SerialName("device") val device: PacketDevice,
    @SerialName("mesh") val mesh: PacketMesh,
    @SerialName("signature") val signature: String? = null
)

@Serializable
data class PacketHeader(
    @SerialName("packetId") val packetId: String,
    @SerialName("timestamp") val timestamp: String,
    @SerialName("version") val version: String = "1.5.0-PROD",
    @SerialName("ttl") val ttl: Int = 5,
    @SerialName("hopCount") val hopCount: Int = 0,
    @SerialName("packetType") val packetType: String = "SOS_EMERGENCY",
    @SerialName("encryptionVersion") val encryptionVersion: String = "AES_256_GCM"
)

@Serializable
data class PacketUser(
    @SerialName("userId") val userId: String,
    @SerialName("name") val name: String,
    @SerialName("age") val age: String = "",
    @SerialName("bloodGroup") val bloodGroup: String = "O+",
    @SerialName("medicalConditions") val medicalConditions: String = "",
    @SerialName("emergencyContacts") val emergencyContacts: List<EmergencyContact> = emptyList()
)

@Serializable
data class EmergencyContact(
    @SerialName("name") val name: String,
    @SerialName("phoneNumber") val phoneNumber: String,
    @SerialName("relationship") val relationship: String = "Emergency Contact",
    @SerialName("priorityOrder") val priorityOrder: Int = 1
)

@Serializable
data class PacketLocation(
    @SerialName("latitude") val latitude: Double,
    @SerialName("longitude") val longitude: Double,
    @SerialName("altitude") val altitude: Double? = null,
    @SerialName("accuracy") val accuracy: Float? = null,
    @SerialName("speed") val speed: Float? = null,
    @SerialName("heading") val heading: Float? = null,
    @SerialName("timestamp") val timestamp: String
)

@Serializable
data class PacketIncident(
    @SerialName("emergencyType") val emergencyType: String = "Manual 3-Second SOS Distress",
    @SerialName("severity") val severity: String = "CRITICAL",
    @SerialName("emergencyConfidenceScore") val emergencyConfidenceScore: Int = 100,
    @SerialName("isAutomatic") val isAutomatic: Boolean = false,
    @SerialName("triggerSource") val triggerSource: String = "MANUAL_SOS_BUTTON",
    @SerialName("additionalDescription") val additionalDescription: String? = null
)

@Serializable
data class PacketDevice(
    @SerialName("batteryPercentage") val batteryPercentage: Int = 85,
    @SerialName("isCharging") val isCharging: Boolean = false,
    @SerialName("networkStatus") val networkStatus: String = "ONLINE",
    @SerialName("bluetoothStatus") val bluetoothStatus: String = "ENABLED",
    @SerialName("gpsStatus") val gpsStatus: String = "LOCKED"
)

@Serializable
data class PacketMesh(
    @SerialName("relayHistory") val relayHistory: List<String> = emptyList(),
    @SerialName("gatewayNode") val gatewayNode: String? = null,
    @SerialName("deliveryStatus") val deliveryStatus: String = "QUEUED",
    @SerialName("retryCount") val retryCount: Int = 0,
    @SerialName("lastAttemptTimestamp") val lastAttemptTimestamp: String? = null
)
