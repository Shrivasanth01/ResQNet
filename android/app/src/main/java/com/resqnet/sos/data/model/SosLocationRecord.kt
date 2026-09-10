package com.resqnet.sos.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Persistent location history record for offline SOS tracking.
 */
@Serializable
data class SosLocationRecord(
    @SerialName("latitude") val latitude: Double,
    @SerialName("longitude") val longitude: Double,
    @SerialName("accuracy") val accuracy: Float,
    @SerialName("altitude") val altitude: Double? = null,
    @SerialName("speed") val speed: Float? = null,
    @SerialName("bearing") val bearing: Float? = null,
    @SerialName("timestamp") val timestamp: Long,
    @SerialName("formattedTimestamp") val formattedTimestamp: String,
    @SerialName("sosId") val sosId: String,
    @SerialName("deviceId") val deviceId: String,
    @SerialName("isTransmitted") var isTransmitted: Boolean = false
) {
    /**
     * Returns location age in seconds based on current time.
     */
    fun getLocationAgeSeconds(nowMs: Long = System.currentTimeMillis()): Long {
        return ((nowMs - timestamp) / 1000L).coerceAtLeast(0L)
    }

    /**
     * Converts to PacketLocation for RSEP network serialization.
     */
    fun toPacketLocation(): PacketLocation {
        return PacketLocation(
            latitude = latitude,
            longitude = longitude,
            altitude = altitude,
            accuracy = accuracy,
            speed = speed,
            heading = bearing,
            timestamp = formattedTimestamp,
            isTransmitted = isTransmitted,
            sosId = sosId,
            deviceId = deviceId
        )
    }
}
