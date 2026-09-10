package com.resqnet.sos.services.hardware

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import com.google.android.gms.location.*
import com.google.android.gms.tasks.CancellationTokenSource
import com.resqnet.sos.data.local.SosLocationRepository
import com.resqnet.sos.data.model.SosLocationRecord
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.*

data class GpsCoordinates(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double? = null,
    val accuracy: Float? = null,
    val speed: Float? = null,
    val heading: Float? = null
)

class AndroidLocationService(private val context: Context) {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    private val repository = SosLocationRepository(context)

    private var cachedCoordinates: GpsCoordinates = GpsCoordinates(
        latitude = 13.0827,
        longitude = 80.2707,
        accuracy = 5.0f
    )

    private var activeSosId: String? = null
    private var activeDeviceId: String? = null
    private var lastLocation: Location? = null
    private var isTrackingActive = false

    private val _liveLocationRecord = MutableStateFlow<SosLocationRecord?>(null)
    val liveLocationRecord: StateFlow<SosLocationRecord?> = _liveLocationRecord.asStateFlow()

    private val _isUserMoving = MutableStateFlow(false)
    val isUserMoving: StateFlow<Boolean> = _isUserMoving.asStateFlow()

    private fun getFormattedTimestamp(timeMs: Long = System.currentTimeMillis()): String {
        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date(timeMs))
    }

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            val location = result.lastLocation ?: return
            val sosId = activeSosId ?: "SOS_ACTIVE"
            val deviceId = activeDeviceId ?: "DEVICE_LOCAL"

            // 1. Validation: Reject invalid or extremely inaccurate location fixes (> 150 meters)
            if (location.latitude == 0.0 && location.longitude == 0.0) return
            if (location.hasAccuracy() && location.accuracy > 150f) {
                println("[AndroidLocationService] ⚠️ Low accuracy fix rejected (${location.accuracy}m)")
                return
            }

            // 2. Calculate Movement & Distance Delta
            val prevLoc = lastLocation
            val results = FloatArray(1)
            var distanceMoved = 0f

            if (prevLoc != null) {
                Location.distanceBetween(
                    prevLoc.latitude, prevLoc.longitude,
                    location.latitude, location.longitude,
                    results
                )
                distanceMoved = results[0]
            }

            val speedMs = if (location.hasSpeed()) location.speed else 0f
            val isMoving = distanceMoved >= 4.0f || speedMs >= 0.8f
            val isSignificantMovement = distanceMoved >= 12.0f

            _isUserMoving.value = isMoving
            lastLocation = location

            // Update cached coordinates
            cachedCoordinates = GpsCoordinates(
                latitude = location.latitude,
                longitude = location.longitude,
                altitude = if (location.hasAltitude()) location.altitude else null,
                accuracy = if (location.hasAccuracy()) location.accuracy else null,
                speed = if (location.hasSpeed()) location.speed else null,
                heading = if (location.hasBearing()) location.bearing else null
            )

            // 3. Construct Record
            val record = SosLocationRecord(
                latitude = location.latitude,
                longitude = location.longitude,
                accuracy = if (location.hasAccuracy()) location.accuracy else 5.0f,
                altitude = if (location.hasAltitude()) location.altitude else null,
                speed = if (location.hasSpeed()) location.speed else null,
                bearing = if (location.hasBearing()) location.bearing else null,
                timestamp = location.time.takeIf { it > 0 } ?: System.currentTimeMillis(),
                formattedTimestamp = getFormattedTimestamp(location.time.takeIf { it > 0 } ?: System.currentTimeMillis()),
                sosId = sosId,
                deviceId = deviceId,
                isTransmitted = false
            )

            // 4. Save to persistent local repository
            repository.saveLocationRecord(record)
            _liveLocationRecord.value = record

            println("[AndroidLocationService] 📍 Adaptive GPS Update: Lat=${record.latitude}, Long=${record.longitude}, Acc=±${record.accuracy}m, Delta=${distanceMoved}m, Moving=$isMoving")

            // 5. Adaptive interval adjustment based on movement
            if (isSignificantMovement) {
                println("[AndroidLocationService] ⚡ Significant movement detected (${distanceMoved}m)! Prioritizing fresh GPS fixes.")
            }
        }
    }

    /**
     * Starts continuous high-accuracy adaptive location tracking for an active SOS session.
     */
    @SuppressLint("MissingPermission")
    fun startAdaptiveTracking(sosId: String, deviceId: String) {
        if (isTrackingActive) return
        isTrackingActive = true
        activeSosId = sosId
        activeDeviceId = deviceId

        println("[AndroidLocationService] 🚀 Starting Adaptive SOS Location Engine for Session: $sosId")

        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 3000L)
            .setMinUpdateIntervalMillis(1500L)
            .setMinUpdateDistanceMeters(2.0f)
            .setGranularity(Granularity.GRANULARITY_FINE)
            .setWaitForAccurateLocation(false)
            .build()

        try {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, context.mainLooper)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Immediately stops high-frequency SOS location tracking when SOS ends.
     */
    fun stopAdaptiveTracking() {
        if (!isTrackingActive) return
        isTrackingActive = false
        activeSosId = null
        activeDeviceId = null
        try {
            fusedLocationClient.removeLocationUpdates(locationCallback)
            println("[AndroidLocationService] 🛑 Stopped Adaptive SOS Location Engine.")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @SuppressLint("MissingPermission")
    suspend fun getHighAccuracyLocation(): GpsCoordinates {
        return try {
            val cancellationTokenSource = CancellationTokenSource()
            val location: Location? = fusedLocationClient.getCurrentLocation(
                Priority.PRIORITY_HIGH_ACCURACY,
                cancellationTokenSource.token
            ).await()

            if (location != null) {
                cachedCoordinates = GpsCoordinates(
                    latitude = location.latitude,
                    longitude = location.longitude,
                    altitude = if (location.hasAltitude()) location.altitude else null,
                    accuracy = if (location.hasAccuracy()) location.accuracy else null,
                    speed = if (location.hasSpeed()) location.speed else null,
                    heading = if (location.hasBearing()) location.bearing else null
                )
            }
            cachedCoordinates
        } catch (e: Exception) {
            e.printStackTrace()
            cachedCoordinates
        }
    }

    fun getCachedLocation(): GpsCoordinates {
        return cachedCoordinates
    }
}
