package com.resqnet.sos.services.hardware

import android.content.Context
import android.content.SharedPreferences
import android.location.Location
import androidx.core.content.edit
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale
import kotlin.math.cos
import kotlin.math.sin

enum class LocationMode {
    CONFIRMED,
    PDR_ACTIVE
}

data class ConfirmedLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float,
    val timestampMs: Long = System.currentTimeMillis(),
    val provider: String = "GPS"
)

data class LocationState(
    val mode: LocationMode = LocationMode.CONFIRMED,
    val lastConfirmedLocation: ConfirmedLocation? = null,
    val currentEstimatedLat: Double = 0.0,
    val currentEstimatedLng: Double = 0.0,
    val eastMeters: Double = 0.0,
    val northMeters: Double = 0.0,
    val pdrStepCount: Int = 0,
    val headingDeg: Float = 0f,
    val driftRadiusMeters: Float = 0f,
    val statusMessage: String = "Location: GPS / CONFIRMED",
    val isResyncedEvent: Boolean = false
)

data class ModeManagerConfig(
    val gpsLossDebounceMs: Long = 3000L,
    val requiredConsecutiveGoodFixes: Int = 2
)

/**
 * Location Mode Manager & State Machine.
 * Controls seamless transitions between CONFIRMED (GPS active, PDR suspended)
 * and PDR_ACTIVE (GPS lost, PDR dead reckoning active from last confirmed origin).
 */
class LocationModeManager(
    private val context: Context? = null,
    private val evaluator: LocationQualityEvaluator = LocationQualityEvaluator(),
    private val config: ModeManagerConfig = ModeManagerConfig()
) {

    private val prefs: SharedPreferences? = context?.getSharedPreferences("resqnet_location_prefs", Context.MODE_PRIVATE)

    private val _locationState = MutableStateFlow(LocationState())
    val locationState: StateFlow<LocationState> = _locationState.asStateFlow()

    private var consecutiveGoodFixes = 0
    private var lastGoodFixTimestampMs = System.currentTimeMillis()
    private var pdrEngine: PedestrianDeadReckoningEngine? = null

    init {
        restorePersistedLocation()
    }

    fun attachPdrEngine(engine: PedestrianDeadReckoningEngine) {
        this.pdrEngine = engine
        val origin = _locationState.value.lastConfirmedLocation ?: ConfirmedLocation(13.0827, 80.2707, 10.0f)
        pdrEngine?.startPdrTracking(origin.latitude, origin.longitude)
    }

    fun onNewLocationFix(location: Location?, currentTimeMs: Long = System.currentTimeMillis()) {
        val quality = evaluator.evaluateQuality(location, currentTimeMs)
        val current = _locationState.value

        if (quality == LocationQuality.GOOD && location != null) {
            consecutiveGoodFixes++
            lastGoodFixTimestampMs = currentTimeMs

            val newConfirmed = ConfirmedLocation(
                latitude = location.latitude,
                longitude = location.longitude,
                accuracyMeters = if (location.hasAccuracy()) location.accuracy else 5.0f,
                timestampMs = location.time.takeIf { it > 0 } ?: currentTimeMs,
                provider = location.provider ?: "GPS"
            )

            persistConfirmedLocation(newConfirmed)

            if (current.mode == LocationMode.PDR_ACTIVE && consecutiveGoodFixes >= config.requiredConsecutiveGoodFixes) {
                // TRANSITION: PDR_ACTIVE -> CONFIRMED
                _locationState.value = current.copy(
                    mode = LocationMode.CONFIRMED,
                    lastConfirmedLocation = newConfirmed,
                    currentEstimatedLat = newConfirmed.latitude,
                    currentEstimatedLng = newConfirmed.longitude,
                    eastMeters = 0.0,
                    northMeters = 0.0,
                    pdrStepCount = 0,
                    driftRadiusMeters = 0f,
                    statusMessage = "Location signal restored. Position re-synchronized.",
                    isResyncedEvent = true
                )
                pdrEngine?.updateLastConfirmedGps(newConfirmed.latitude, newConfirmed.longitude)
                println("[LocationModeManager] 🔄 RESYNC: GPS Signal Restored! Snapped to confirmed fix (${newConfirmed.latitude}, ${newConfirmed.longitude})")
            } else if (current.mode == LocationMode.CONFIRMED) {
                _locationState.value = current.copy(
                    lastConfirmedLocation = newConfirmed,
                    currentEstimatedLat = newConfirmed.latitude,
                    currentEstimatedLng = newConfirmed.longitude,
                    statusMessage = "Location: GPS / CONFIRMED",
                    isResyncedEvent = false
                )
                pdrEngine?.updateLastConfirmedGps(newConfirmed.latitude, newConfirmed.longitude)
            }
        } else {
            consecutiveGoodFixes = 0
            val ageSinceGoodMs = currentTimeMs - lastGoodFixTimestampMs

            if (current.mode == LocationMode.CONFIRMED && ageSinceGoodMs >= config.gpsLossDebounceMs) {
                // TRANSITION: CONFIRMED -> PDR_ACTIVE
                val origin = current.lastConfirmedLocation ?: ConfirmedLocation(13.0827, 80.2707, 10.0f)
                pdrEngine?.startPdrTracking(origin.latitude, origin.longitude) // Activate PDR sensors
                _locationState.value = current.copy(
                    mode = LocationMode.PDR_ACTIVE,
                    statusMessage = "Location: Estimated PDR (GPS Unavailable)",
                    isResyncedEvent = false
                )
                println("[LocationModeManager] ⚠️ GPS Signal Lost! Activated PDR Mode starting from last confirmed origin (${origin.latitude}, ${origin.longitude})")
            }
        }
    }

    fun onPdrStepUpdate(stepCount: Int, stepLengthMeters: Double, headingDeg: Float) {
        val current = _locationState.value
        if (current.mode != LocationMode.PDR_ACTIVE) return

        val origin = current.lastConfirmedLocation ?: ConfirmedLocation(13.0827, 80.2707, 10.0f)
        val headingRad = Math.toRadians(headingDeg.toDouble())

        // Calculate incremental East / North displacement in meters
        val deltaEast = stepLengthMeters * sin(headingRad)
        val deltaNorth = stepLengthMeters * cos(headingRad)

        val newEastMeters = current.eastMeters + deltaEast
        val newNorthMeters = current.northMeters + deltaNorth

        // Convert accumulated East/North displacement in meters back to Lat/Lng degrees relative to lastConfirmedLocation
        val deltaLat = newNorthMeters / 111320.0
        val deltaLng = newEastMeters / (111320.0 * cos(Math.toRadians(origin.latitude)))

        val newEstLat = origin.latitude + deltaLat
        val newEstLng = origin.longitude + deltaLng
        val newDriftRadius = (stepCount * stepLengthMeters * 0.05).toFloat() // 5% drift per step

        _locationState.value = current.copy(
            currentEstimatedLat = newEstLat,
            currentEstimatedLng = newEstLng,
            eastMeters = newEastMeters,
            northMeters = newNorthMeters,
            pdrStepCount = stepCount,
            headingDeg = headingDeg,
            driftRadiusMeters = newDriftRadius,
            statusMessage = "Location: Estimated PDR (Active)"
        )
    }

    fun dismissResyncedEvent() {
        _locationState.value = _locationState.value.copy(isResyncedEvent = false)
    }

    private fun persistConfirmedLocation(confirmed: ConfirmedLocation) {
        prefs?.edit {
            putString("confirmed_lat", confirmed.latitude.toString())
            putString("confirmed_lng", confirmed.longitude.toString())
            putFloat("confirmed_acc", confirmed.accuracyMeters)
            putLong("confirmed_ts", confirmed.timestampMs)
            putString("confirmed_provider", confirmed.provider)
        }
    }

    private fun restorePersistedLocation() {
        try {
            val latStr = prefs?.getString("confirmed_lat", null)
            val lngStr = prefs?.getString("confirmed_lng", null)
            if (!latStr.isNullOrEmpty() && !lngStr.isNullOrEmpty()) {
                val lat = latStr.toDouble()
                val lng = lngStr.toDouble()
                val acc = prefs?.getFloat("confirmed_acc", 10.0f) ?: 10.0f
                val ts = prefs?.getLong("confirmed_ts", System.currentTimeMillis()) ?: System.currentTimeMillis()
                val provider = prefs?.getString("confirmed_provider", "GPS") ?: "GPS"

                val restored = ConfirmedLocation(lat, lng, acc, ts, provider)
                _locationState.value = LocationState(
                    mode = LocationMode.CONFIRMED,
                    lastConfirmedLocation = restored,
                    currentEstimatedLat = lat,
                    currentEstimatedLng = lng,
                    statusMessage = "Location: GPS / CONFIRMED (Restored)"
                )
                println("[LocationModeManager] 💾 Restored last confirmed location from local storage: ($lat, $lng)")
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
