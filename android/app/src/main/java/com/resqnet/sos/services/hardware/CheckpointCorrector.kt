package com.resqnet.sos.services.hardware

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class EmergencyCheckpoint(
    @SerialName("id") val id: String,
    @SerialName("name") val name: String,
    @SerialName("latitude") val latitude: Double,
    @SerialName("longitude") val longitude: Double,
    @SerialName("description") val description: String
)

/**
 * Manages known disaster checkpoints (entrances, shelters, tunnel junctions, exits).
 * Scanning or selecting a checkpoint resets PDR position sensor drift to 0 meters (100% confidence).
 */
object CheckpointCorrector {

    val KNOWN_CHECKPOINTS = listOf(
        EmergencyCheckpoint(
            id = "CHK_TUNNEL_NORTH",
            name = "Tunnel Entrance North",
            latitude = 13.08270,
            longitude = 80.27070,
            description = "Main underground tunnel north entrance gate"
        ),
        EmergencyCheckpoint(
            id = "CHK_SHELTER_ALPHA",
            name = "Emergency Shelter Alpha",
            latitude = 13.08350,
            longitude = 80.27150,
            description = "Reinforced underground disaster assembly point"
        ),
        EmergencyCheckpoint(
            id = "CHK_BASEMENT_EXIT_B",
            name = "Basement Evacuation Exit B",
            latitude = 13.08410,
            longitude = 80.27210,
            description = "Stairwell exit B leading to surface emergency lane"
        ),
        EmergencyCheckpoint(
            id = "CHK_HOSPITAL_FIRST_AID",
            name = "Central First Aid Station",
            latitude = 13.08500,
            longitude = 80.27300,
            description = "Primary triage & trauma treatment tent"
        )
    )

    fun findCheckpointById(id: String): EmergencyCheckpoint? {
        return KNOWN_CHECKPOINTS.find { it.id.equals(id, ignoreCase = true) }
    }
}
