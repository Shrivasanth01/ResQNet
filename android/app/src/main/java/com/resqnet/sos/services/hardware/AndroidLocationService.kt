package com.resqnet.sos.services.hardware

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
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

    val pdrEngine = PedestrianDeadReckoningEngine(context)

    private var cachedCoordinates: GpsCoordinates = GpsCoordinates(
        latitude = 0.0,
        longitude = 0.0,
        accuracy = 0.0f
    )

    private fun fetchSystemBestLastLocation(): Location? {
        try {
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            @SuppressLint("MissingPermission")
            val gpsLoc = try { lm?.getLastKnownLocation(LocationManager.GPS_PROVIDER) } catch (_: Exception) { null }
            @SuppressLint("MissingPermission")
            val netLoc = try { lm?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER) } catch (_: Exception) { null }
            @SuppressLint("MissingPermission")
            val passLoc = try { lm?.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER) } catch (_: Exception) { null }

            val candidates = listOfNotNull(gpsLoc, netLoc, passLoc)
            return candidates.maxByOrNull { it.time }
        } catch (_: Exception) {
            return null
        }
    }

    @SuppressLint("MissingPermission")
    fun startGeneralLocationUpdates() {
        try {
            val best = fetchSystemBestLastLocation()
            if (best != null && best.latitude != 0.0 && best.longitude != 0.0) {
                cachedCoordinates = GpsCoordinates(
                    latitude = best.latitude,
                    longitude = best.longitude,
                    altitude = if (best.hasAltitude()) best.altitude else null,
                    accuracy = if (best.hasAccuracy()) best.accuracy else null,
                    speed = if (best.hasSpeed()) best.speed else null,
                    heading = if (best.hasBearing()) best.bearing else null
                )
                pdrEngine.updateLastConfirmedGps(best.latitude, best.longitude)
            }

            val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 2000L)
                .setMinUpdateIntervalMillis(1000L)
                .setGranularity(Granularity.GRANULARITY_FINE)
                .build()

            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, context.mainLooper)
            println("[AndroidLocationService] 🚀 Continuous General Location Updates Active.")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    init {
        startGeneralLocationUpdates()
    }

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

            // Update cached coordinates and PDR base GPS origin
            cachedCoordinates = GpsCoordinates(
                latitude = location.latitude,
                longitude = location.longitude,
                altitude = if (location.hasAltitude()) location.altitude else null,
                accuracy = if (location.hasAccuracy()) location.accuracy else null,
                speed = if (location.hasSpeed()) location.speed else null,
                heading = if (location.hasBearing()) location.bearing else null
            )
            pdrEngine.updateLastConfirmedGps(location.latitude, location.longitude)

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

            // Update PDR base GPS origin if fix is accurate
            if (location.hasAccuracy() && location.accuracy <= 25.0f) {
                pdrEngine.updateLastConfirmedGps(location.latitude, location.longitude)
            }

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
            pdrEngine.startPdrTracking(cachedCoordinates.latitude, cachedCoordinates.longitude)
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
            pdrEngine.stopPdrTracking()
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
            ).await() ?: fetchSystemBestLastLocation()

            if (location != null && location.latitude != 0.0 && location.longitude != 0.0) {
                cachedCoordinates = GpsCoordinates(
                    latitude = location.latitude,
                    longitude = location.longitude,
                    altitude = if (location.hasAltitude()) location.altitude else null,
                    accuracy = if (location.hasAccuracy()) location.accuracy else null,
                    speed = if (location.hasSpeed()) location.speed else null,
                    heading = if (location.hasBearing()) location.bearing else null
                )
                pdrEngine.updateLastConfirmedGps(location.latitude, location.longitude)
                println("[AndroidLocationService] 🎯 High Accuracy Location Fix Obain: (${location.latitude}, ${location.longitude})")
            }
            cachedCoordinates
        } catch (e: Exception) {
            e.printStackTrace()
            val best = fetchSystemBestLastLocation()
            if (best != null && best.latitude != 0.0 && best.longitude != 0.0) {
                cachedCoordinates = GpsCoordinates(
                    latitude = best.latitude,
                    longitude = best.longitude,
                    altitude = if (best.hasAltitude()) best.altitude else null,
                    accuracy = if (best.hasAccuracy()) best.accuracy else null,
                    speed = if (best.hasSpeed()) best.speed else null,
                    heading = if (best.hasBearing()) best.bearing else null
                )
                pdrEngine.updateLastConfirmedGps(best.latitude, best.longitude)
            }
            cachedCoordinates
        }
    }

    fun getCachedLocation(): GpsCoordinates {
        return cachedCoordinates
    }

    companion object {
        @Volatile
        private var INSTANCE: AndroidLocationService? = null

        fun getInstance(context: Context): AndroidLocationService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: AndroidLocationService(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
}
