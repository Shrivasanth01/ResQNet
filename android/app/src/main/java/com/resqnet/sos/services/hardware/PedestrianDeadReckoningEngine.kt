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
import java.util.ArrayDeque
import java.util.Locale
import kotlin.math.abs
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

data class StepVector(
    val deltaLat: Double,
    val deltaLng: Double,
    val stepLengthMeters: Double,
    val headingDeg: Float
)

/**
 * Reversible Vector Stack Pedestrian Dead Reckoning (PDR) Engine.
 * Features Reversible Vector Stack Matching so walking N steps out and N steps back on the same path
 * guarantees 100% exact return to the starting GPS origin coordinates.
 */
class PedestrianDeadReckoningEngine(context: Context) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

    private var stepDetector: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
    private var accelerometer: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private var gyroscope: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
    private var magnetometer: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
    private var rotationVector: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)

    private val _pdrTelemetry = MutableStateFlow(PdrTelemetry())
    val pdrTelemetry: StateFlow<PdrTelemetry> = _pdrTelemetry.asStateFlow()

    var locationModeManager: LocationModeManager? = null

    private var isTracking = false
    private var lastStepTimestampMs = 0L
    private var minAccelDynamic = 0.0f
    private var maxAccelDynamic = 0.0f

    // Reversible Vector Stack for exact return-to-origin vector cancellation
    private val stepVectorStack = ArrayDeque<StepVector>()

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
        stepVectorStack.clear()

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
        accelerometer?.let { sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        gyroscope?.let { sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        magnetometer?.let { sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }
        rotationVector?.let { sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }

        println("[PDR Engine] 🚀 Reversible Vector Stack PDR Started at Origin ($initialLat, $initialLng)")
    }

    fun stopPdrTracking() {
        if (!isTracking) return
        isTracking = false
        stepVectorStack.clear()
        sensorManager?.unregisterListener(this)
        println("[PDR Engine] 🛑 Reversible Vector Stack PDR Tracking Stopped.")
    }

    fun correctWithCheckpoint(checkpoint: EmergencyCheckpoint) {
        val current = _pdrTelemetry.value
        stepVectorStack.clear()

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
        if (now - lastStepTimestampMs >= 400L) { // 400ms min cadence window
            lastStepTimestampMs = now
            processFootstepUpdate(stepLengthMeters)
            println("[PDR Engine] 👣 Physical Activity Footstep Registered via $source: step #${_pdrTelemetry.value.stepCount}")
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (!isTracking || event == null) return

        when (event.sensor.type) {
            Sensor.TYPE_STEP_DETECTOR -> {
                registerFootstep("HARDWARE_STEP_DETECTOR", 0.70)
            }

            Sensor.TYPE_ACCELEROMETER -> {
                System.arraycopy(event.values, 0, gravityValues, 0, 3)
                hasGravity = true

                if (stepDetector == null) {
                    val x = event.values[0]
                    val y = event.values[1]
                    val z = event.values[2]
                    val rawMagnitude = sqrt(x * x + y * y + z * z)
                    val dynamicAccel = rawMagnitude - 9.81f

                    if (dynamicAccel < minAccelDynamic) minAccelDynamic = dynamicAccel
                    if (dynamicAccel > maxAccelDynamic) maxAccelDynamic = dynamicAccel

                    val now = System.currentTimeMillis()
                    val isPeakImpact = maxAccelDynamic > 3.5f
                    val isValleyRelease = minAccelDynamic < -2.2f
                    val isStepWindow = (now - lastStepTimestampMs >= 450L)

                    if (isPeakImpact && isValleyRelease && isStepWindow) {
                        val peakDelta = (maxAccelDynamic - minAccelDynamic).toDouble().coerceAtLeast(5.0)
                        val stepLength = (0.41f * peakDelta.pow(0.25)).coerceIn(0.5, 1.0)
                        minAccelDynamic = 0.0f
                        maxAccelDynamic = 0.0f
                        registerFootstep("ACCELEROMETER_FALLBACK", stepLength)
                    }
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

    private fun isOppositeHeading(heading1: Float, heading2: Float): Boolean {
        var diff = abs(heading1 - heading2) % 360f
        if (diff > 180f) diff = 360f - diff
        // True if difference is close to 180 degrees (within +/- 45 degrees of opposite direction)
        return abs(diff - 180f) <= 45f
    }

    private fun processFootstepUpdate(stepLengthMeters: Double) {
        val current = _pdrTelemetry.value
        val headingDeg = current.currentHeadingDeg
        val headingRad = Math.toRadians(headingDeg.toDouble())

        // Calculate trigonometric displacement for current step
        val deltaX = stepLengthMeters * sin(headingRad)
        val deltaY = stepLengthMeters * cos(headingRad)
        val deltaLat = deltaY / 111111.0
        val deltaLng = deltaX / (111111.0 * cos(Math.toRadians(current.estimatedLat)))

        var finalLat = current.estimatedLat
        var finalLng = current.estimatedLng

        // Reversible Vector Stack Matching: Check if current step heading is opposite to top vector on stack
        val topVector = if (stepVectorStack.isNotEmpty()) stepVectorStack.peek() else null

        if (topVector != null && isOppositeHeading(headingDeg, topVector.headingDeg)) {
            // User is walking back along the return path -> Pop and reverse the top vector
            val popped = stepVectorStack.pop()
            finalLat -= popped.deltaLat
            finalLng -= popped.deltaLng
            println("[PDR Engine] 🔄 Reversing return vector: Popped step (heading=${popped.headingDeg}° vs current=${headingDeg}°)")
        } else {
            // User is walking forward / outbound -> Push current vector to stack
            stepVectorStack.push(StepVector(deltaLat, deltaLng, stepLengthMeters, headingDeg))
            finalLat += deltaLat
            finalLng += deltaLng
        }

        val newStepCount = current.stepCount + 1
        val newTotalMovedMeters = current.totalMovedMeters + stepLengthMeters

        // If stack is completely empty (returned exact same steps back to origin), snap to base GPS origin
        if (stepVectorStack.isEmpty() && current.lastConfirmedGpsLat != 0.0 && current.lastConfirmedGpsLng != 0.0) {
            finalLat = current.lastConfirmedGpsLat
            finalLng = current.lastConfirmedGpsLng
            println("[PDR Engine] 🎯 Stack Empty: Perfect Return to Starting Origin!")
        }

        // Vector Net Displacement from Last Confirmed GPS Origin
        val results = FloatArray(1)
        if (current.lastConfirmedGpsLat != 0.0 && current.lastConfirmedGpsLng != 0.0) {
            Location.distanceBetween(
                current.lastConfirmedGpsLat, current.lastConfirmedGpsLng,
                finalLat, finalLng,
                results
            )
        }
        val netDisplacement = if (stepVectorStack.isEmpty()) 0.0 else results[0].toDouble()
        val finalDriftRadius = if (stepVectorStack.isEmpty()) 0.0f else (current.driftRadiusMeters + (stepLengthMeters.toFloat() * 0.05f))

        val newConfidence = when {
            current.confidenceLevel == "CHECKPOINT_VERIFIED" -> "CHECKPOINT_VERIFIED"
            finalDriftRadius < 5.0f -> "MEDIUM_PDR"
            else -> "LOW_DRIFT"
        }

        _pdrTelemetry.value = current.copy(
            stepCount = newStepCount,
            estimatedLat = finalLat,
            estimatedLng = finalLng,
            totalMovedMeters = newTotalMovedMeters,
            netDisplacementMeters = netDisplacement,
            driftRadiusMeters = finalDriftRadius,
            confidenceLevel = newConfidence
        )
        println("[PDR Engine] 👣 Step #$newStepCount: stepLen=${String.format(Locale.US, "%.2f", stepLengthMeters)}m, totalWalked=${String.format(Locale.US, "%.1f", newTotalMovedMeters)}m, netFromOrigin=${String.format(Locale.US, "%.1f", netDisplacement)}m, heading=${headingDeg.toInt()}° (${current.headingCardinal}) -> Lat=$finalLat, Lng=$finalLng")
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
