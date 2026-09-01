package com.resqnet.sos.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    val userId: String = "USR_${System.currentTimeMillis()}",
    val fullName: String = "",
    val email: String = "",
    val phoneNumber: String = "",
    val age: String = "",
    val gender: String = "",
    val height: String = "",
    val weight: String = "",
    val bloodGroup: String = "",
    val allergies: String = "",
    val medicalConditions: String = "",
    val emergencyContacts: List<EmergencyContact> = emptyList()
)
