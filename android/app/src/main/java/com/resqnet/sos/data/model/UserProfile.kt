package com.resqnet.sos.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    val userId: String = "USR_${System.currentTimeMillis()}",
    val fullName: String = "Siva Ajish Ram R",
    val email: String = "ResQNet7@gmail.com",
    val phoneNumber: String = "+91 98765 43210",
    val age: String = "24",
    val bloodGroup: String = "O+",
    val allergies: String = "Penicillin, Peanuts",
    val medicalConditions: String = "Asthma (Mild)",
    val emergencyContacts: List<EmergencyContact> = listOf(
        EmergencyContact(name = "Primary Guardian", phoneNumber = "+91 98765 43210", priorityOrder = 1),
        EmergencyContact(name = "Universal Emergency", phoneNumber = "112", priorityOrder = 2)
    )
)
