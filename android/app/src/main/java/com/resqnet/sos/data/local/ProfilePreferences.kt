package com.resqnet.sos.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import java.util.UUID
import com.resqnet.sos.data.model.EmergencyContact
import com.resqnet.sos.data.model.UserProfile
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Handles persistent storage of user profile, Gmail credentials, medical vault, and emergency contacts.
 */
class ProfilePreferences(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("resqnet_user_prefs", Context.MODE_PRIVATE)

    private val json = Json { ignoreUnknownKeys = true }

    fun getOrCreateDeviceId(): String {
        var deviceId = prefs.getString("local_device_id", null)
        if (deviceId.isNullOrEmpty()) {
            deviceId = UUID.randomUUID().toString().take(8).uppercase()
            prefs.edit { putString("local_device_id", deviceId) }
        }
        return deviceId
    }

    fun isLoggedIn(): Boolean {
        return prefs.getBoolean("is_logged_in", false)
    }

    fun setLoggedIn(loggedIn: Boolean) {
        prefs.edit { putBoolean("is_logged_in", loggedIn) }
    }

    fun isProfileComplete(): Boolean {
        return prefs.getBoolean("is_profile_complete", false)
    }

    fun setProfileComplete(complete: Boolean) {
        prefs.edit { putBoolean("is_profile_complete", complete) }
    }

    fun saveProfile(profile: UserProfile) {
        val serialized = json.encodeToString(profile)
        prefs.edit {
            putString("saved_user_profile", serialized)
            putString("user_email", profile.email)
            putBoolean("is_profile_complete", true)
        }
    }

    fun getProfile(): UserProfile {
        val serialized = prefs.getString("saved_user_profile", null)
        if (!serialized.isNullOrEmpty()) {
            try {
                return json.decodeFromString<UserProfile>(serialized)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        return UserProfile()
    }

    fun logout() {
        prefs.edit {
            putBoolean("is_logged_in", false)
            remove("user_email")
            remove("saved_user_profile")
        }
    }

    fun getSavedEmail(): String {
        return prefs.getString("user_email", "ResQNet7@gmail.com") ?: "ResQNet7@gmail.com"
    }

    fun getEmergencyContacts(): List<EmergencyContact> {
        return getProfile().emergencyContacts
    }
}
