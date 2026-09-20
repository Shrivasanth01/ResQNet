package com.resqnet.sos.services.hardware

import android.location.Location

enum class LocationQuality {
    GOOD,
    POOR,
    STALE,
    UNAVAILABLE
}

data class EvaluatorConfig(
    val maxAccuracyMeters: Float = 25.0f,
    val maxAgeMs: Long = 10000L,
    val maxPlausibleSpeedMs: Float = 60.0f // 216 km/h max speed filter
)

/**
 * Location Quality Evaluator.
 * Evaluates raw Android/Fused Location fixes based on accuracy, timestamp freshness,
 * provider availability, and speed plausibility before marking a fix as CONFIRMED.
 */
class LocationQualityEvaluator(
    private val config: EvaluatorConfig = EvaluatorConfig()
) {

    fun evaluateQuality(
        location: Location?,
        currentTimeMs: Long = System.currentTimeMillis()
    ): LocationQuality {
        if (location == null) return LocationQuality.UNAVAILABLE

        if (location.latitude == 0.0 && location.longitude == 0.0) {
            return LocationQuality.UNAVAILABLE
        }

        // 1. Accuracy Check
        if (location.hasAccuracy() && location.accuracy > config.maxAccuracyMeters) {
            return LocationQuality.POOR
        }

        // 2. Timestamp Freshness Check
        val ageMs = (currentTimeMs - location.time).coerceAtLeast(0L)
        if (ageMs > config.maxAgeMs) {
            return LocationQuality.STALE
        }

        // 3. Unrealistic Speed Check
        if (location.hasSpeed() && location.speed > config.maxPlausibleSpeedMs) {
            return LocationQuality.POOR
        }

        return LocationQuality.GOOD
    }
}
