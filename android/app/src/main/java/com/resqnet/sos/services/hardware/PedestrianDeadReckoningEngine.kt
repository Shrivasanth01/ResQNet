package com.resqnet.sos.services.hardware

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

data class PdrTelemetry(
    val stepCount: Int = 0,
    val currentHeadingDeg: Float = 0f,
    val headingCardinal: String = "N",
    val lastConfirmedGpsLat: Double = 0.0,
    val lastConfirmedGpsLng: Double = 0.0,
    val estimatedLat: Double = 0.0,
    val estimatedLng: Double = 0.0,
    val totalMovedMeters: Double = 0.0,
    val netDisplacementMeters: Double = 0.0,
    val driftRadiusMeters: Float = 0f,
    val confidenceLevel: String = "ACQUIRING_GPS", // HIGH_GPS, MEDIUM_PDR, LOW_DRIFT, CHECKPOINT_VERIFIED, ACQUIRING_GPS
    val lastCheckpointName: String? = null
)

/**
 * High-Accuracy Biomechanically Calibrated Pedestrian Dead Reckoning (PDR) Sensor Fusion Engine.
 * Features 520ms Human Cadence Window and 12.8 m/s^2 Impact Threshold to ensure footstep counts
 * increment at normal human walking pace (~100 steps/min) without moving too fast.
 */
class PedestrianDeadReckoningEngine(context: Context) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

    private var stepDetector: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
    private var stepCounter: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    private var accelerometer: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private var gyroscope: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
    private var magnetometer: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
    private var rotationVector: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)

    private val _pdrTelemetry = MutableStateFlow(PdrTelemetry())
    val pdrTelemetry: StateFlow<PdrTelemetry> = _pdrTelemetry.asStateFlow()

    private var isTracking = false
    private var initialHardwareSteps = -1
    private var lastStepTimestampMs = 0L

    // Gyroscope + Magnetometer complementary filter variables
    private val gravityValues = FloatArray(3)
    private val geomagneticValues = FloatArray(3)
    private var hasGravity = false
    private var hasGeomagnetic = false

    fun updateLastConfirmedGps(lat: Double, lng: Double) {
        if (lat == 0.0 || lng == 0.0) return
        val current = _pdrTelemetry.value

        val deltaLat = if (current.lastConfirmedGpsLat != 0.0) current.estimatedLat - current.lastConfirmedGpsLat else 0.0
        val deltaLng = if (current.lastConfirmedGpsLng != 0.0) current.estimatedLng - current.lastConfirmedGpsLng else 0.0

        val newEstLat = lat + deltaLat
        val newEstLng = lng + deltaLng

        _pdrTelemetry.value = current.copy(
            lastConfirmedGpsLat = lat,
            lastConfirmedGpsLng = lng,
            estimatedLat = newEstLat,
            estimatedLng = newEstLng,
            confidenceLevel = "HIGH_GPS"
        )
        println("[PDR Engine] 📍 Base GPS Origin Updated to Real Fix: ($lat, $lng)")
    }

    fun startPdrTracking(initialLat: Double, initialLng: Double) {
        if (isTracking) return
        isTracking = true
        initialHardwareSteps = -1

        _pdrTelemetry.value = PdrTelemetry(
            stepCount = 0,
            currentHeadingDeg = 0f,
            headingCardinal = "N",
            lastConfirmedGpsLat = initialLat,
            lastConfirmedGpsLng = initialLng,
            estimatedLat = initialLat,
            estimatedLng = initialLng,
            totalMovedMeters = 0.0,
            netDisplacementMeters = 0.0,
            driftRadiusMeters = 0f,
            confidenceLevel = "HIGH_GPS",
            lastCheckpointName = null
        )

        stepDetector?.let { sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_FASTEST) }
        stepCounter?.let { sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_FASTEST) }
        accelerometer?.let { sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        gyroscope?.let { sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        magnetometer?.let { sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        rotationVector?.let { sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }

        println("[PDR Engine] 🚀 High-Accuracy Sensor Fusion PDR Started at Base Origin ($initialLat, $initialLng)")
    }

    fun stopPdrTracking() {
        if (!isTracking) return
        isTracking = false
        sensorManager?.unregisterListener(this)
        println("[PDR Engine] 🛑 High-Accuracy PDR Tracking Stopped.")
    }

    fun correctWithCheckpoint(checkpoint: EmergencyCheckpoint) {
        val current = _pdrTelemetry.value
        _pdrTelemetry.value = current.copy(
            lastConfirmedGpsLat = checkpoint.latitude,
            lastConfirmedGpsLng = checkpoint.longitude,
            estimatedLat = checkpoint.latitude,
            estimatedLng = checkpoint.longitude,
            netDisplacementMeters = 0.0,
            driftRadiusMeters = 0f,
            confidenceLevel = "CHECKPOINT_VERIFIED",
            lastCheckpointName = checkpoint.name
        )
        println("[PDR Engine] 🎯 Checkpoint Corrected! Reset PDR position to ${checkpoint.name} (${checkpoint.latitude}, ${checkpoint.longitude})")
    }

    @Synchronized
    private fun registerFootstep(source: String, stepLengthMeters: Double = 0.70) {
        val now = System.currentTimeMillis()
        if (now - lastStepTimestampMs >= 520L) { // Human walking cadence limit: max 1.9 steps/sec (520ms min window)
            lastStepTimestampMs = now
            processFootstepUpdate(stepLengthMeters)
            println("[PDR Engine] 👣 Footstep Registered via $source: step #${_pdrTelemetry.value.stepCount}")
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (!isTracking || event == null) return

        when (event.sensor.type) {
            Sensor.TYPE_STEP_DETECTOR -> {
                registerFootstep("STEP_DETECTOR", 0.70)
            }

            Sensor.TYPE_STEP_COUNTER -> {
                val totalHardwareSteps = event.values[0].toInt()
                if (initialHardwareSteps < 0) {
                    initialHardwareSteps = totalHardwareSteps
                }
                val netHardwareSteps = (totalHardwareSteps - initialHardwareSteps).coerceAtLeast(0)
                val pendingSteps = netHardwareSteps - _pdrTelemetry.value.stepCount
                if (pendingSteps > 0) {
                    for (i in 0 until pendingSteps) {
                        registerFootstep("STEP_COUNTER", 0.70)
                    }
                }
            }

            Sensor.TYPE_ACCELEROMETER -> {
                System.arraycopy(event.values, 0, gravityValues, 0, 3)
                hasGravity = true

                val x = event.values[0]
                val y = event.values[1]
                val z = event.values[2]
                val magnitude = sqrt(x * x + y * y + z * z)

                val now = System.currentTimeMillis()
                // Calibrated Footstep Impact Peak Detector (Threshold: 12.8 m/s^2, Min Delay: 520ms)
                if (magnitude > 12.8f && (now - lastStepTimestampMs >= 520L)) {
                    registerFootstep("ACCELEROMETER", 0.70)
                }

                updateCompassOrientation()
            }

            Sensor.TYPE_MAGNETIC_FIELD -> {
                System.arraycopy(event.values, 0, geomagneticValues, 0, 3)
                hasGeomagnetic = true
                updateCompassOrientation()
            }

            Sensor.TYPE_ROTATION_VECTOR -> {
                val rotationMatrix = FloatArray(9)
                SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
                val orientation = FloatArray(3)
                SensorManager.getOrientation(rotationMatrix, orientation)

                var azimuthDeg = Math.toDegrees(orientation[0].toDouble()).toFloat()
                if (azimuthDeg < 0) azimuthDeg += 360f

                updateHeadingState(azimuthDeg)
            }
        }
    }

    private fun updateCompassOrientation() {
        if (hasGravity && hasGeomagnetic) {
            val rotationMatrix = FloatArray(9)
            val inclinationMatrix = FloatArray(9)
            if (SensorManager.getRotationMatrix(rotationMatrix, inclinationMatrix, gravityValues, geomagneticValues)) {
                val orientation = FloatArray(3)
                SensorManager.getOrientation(rotationMatrix, orientation)
                var azimuthDeg = Math.toDegrees(orientation[0].toDouble()).toFloat()
                if (azimuthDeg < 0) azimuthDeg += 360f
                updateHeadingState(azimuthDeg)
            }
        }
    }

    private fun smoothHeadingAngle(oldDeg: Float, newDeg: Float, alpha: Float = 0.20f): Float {
        var diff = (newDeg - oldDeg) % 360f
        if (diff < -180f) diff += 360f
        if (diff > 180f) diff -= 360f
        var smoothed = oldDeg + alpha * diff
        if (smoothed < 0) smoothed += 360f
        if (smoothed >= 360) smoothed -= 360f
        return smoothed
    }

    private fun updateHeadingState(rawAzimuthDeg: Float) {
        val current = _pdrTelemetry.value
        val smoothedAzimuth = if (current.currentHeadingDeg == 0f) rawAzimuthDeg else smoothHeadingAngle(current.currentHeadingDeg, rawAzimuthDeg)

        val cardinal = when (smoothedAzimuth) {
            in 22.5f..67.5f -> "NE"
            in 67.5f..112.5f -> "E"
            in 112.5f..157.5f -> "SE"
            in 157.5f..202.5f -> "S"
            in 202.5f..247.5f -> "SW"
            in 247.5f..292.5f -> "W"
            in 247.5f..337.5f -> "NW"
            else -> "N"
        }

        _pdrTelemetry.value = current.copy(
            currentHeadingDeg = smoothedAzimuth,
            headingCardinal = cardinal
        )
    }

    private fun processFootstepUpdate(stepLengthMeters: Double) {
        val current = _pdrTelemetry.value
        val headingRad = Math.toRadians(current.currentHeadingDeg.toDouble())

        // Trigonometric displacement
        val deltaX = stepLengthMeters * sin(headingRad)
        val deltaY = stepLengthMeters * cos(headingRad)

        // Conversion from meters to latitude and longitude degrees
        val deltaLat = deltaY / 111111.0
        val deltaLng = deltaX / (111111.0 * cos(Math.toRadians(current.estimatedLat)))

        val newLat = current.estimatedLat + deltaLat
        val newLng = current.estimatedLng + deltaLng
        val newStepCount = current.stepCount + 1
        val newTotalMovedMeters = current.totalMovedMeters + stepLengthMeters
        val newDriftRadius = current.driftRadiusMeters + (stepLengthMeters.toFloat() * 0.05f) // 5% drift per step

        // Vector Net Displacement from Last Confirmed GPS Origin
        val results = FloatArray(1)
        if (current.lastConfirmedGpsLat != 0.0 && current.lastConfirmedGpsLng != 0.0) {
            Location.distanceBetween(
                current.lastConfirmedGpsLat, current.lastConfirmedGpsLng,
                newLat, newLng,
                results
            )
        }
        val netDisplacement = results[0].toDouble()

        val newConfidence = when {
            current.confidenceLevel == "CHECKPOINT_VERIFIED" -> "CHECKPOINT_VERIFIED"
            else -> "PDR_OFFLINE_TRACKING"
        }

        _pdrTelemetry.value = current.copy(
            stepCount = newStepCount,
            estimatedLat = newLat,
            estimatedLng = newLng,
            totalMovedMeters = newTotalMovedMeters,
            netDisplacementMeters = netDisplacement,
            driftRadiusMeters = newDriftRadius,
            confidenceLevel = newConfidence
        )
        println("[PDR Engine] 👣 Step #$newStepCount: stepLen=${String.format(Locale.US, "%.2f", stepLengthMeters)}m, totalWalked=${String.format(Locale.US, "%.1f", newTotalMovedMeters)}m, netFromOrigin=${String.format(Locale.US, "%.1f", netDisplacement)}m, heading=${current.currentHeadingDeg.toInt()}° (${current.headingCardinal}) -> Lat=$newLat, Lng=$newLng")
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
