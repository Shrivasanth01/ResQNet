package com.resqnet.sos.services.hardware

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.tasks.await

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

    private var cachedCoordinates: GpsCoordinates = GpsCoordinates(
        latitude = 13.0827,
        longitude = 80.2707,
        accuracy = 5.0f
    )

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
