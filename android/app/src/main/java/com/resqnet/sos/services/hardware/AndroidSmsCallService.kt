package com.resqnet.sos.services.hardware

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.SmsManager
import android.widget.Toast
import androidx.core.net.toUri
import com.resqnet.sos.data.model.EmergencyContact
import com.resqnet.sos.data.model.UserProfile

class AndroidSmsCallService(private val context: Context) {

    @SuppressLint("MissingPermission")
    fun initiateEmergencyPhoneCall(phoneNumber: String) {
        val cleanedPhone = phoneNumber.filter { it.isDigit() || it == '+' }
        try {
            val intent = Intent(Intent.ACTION_CALL).apply {
                data = "tel:$cleanedPhone".toUri()
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (_: Exception) {
            // Fallback to dialer if direct call permission not granted or failed
            try {
                val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                    data = "tel:$cleanedPhone".toUri()
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(dialIntent)
            } catch (_: Exception) {
                Toast.makeText(context, "Could not open phone dialer.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @SuppressLint("MissingPermission", "NewApi")
    fun sendEmergencySms(contact: EmergencyContact, profile: UserProfile, location: GpsCoordinates) {
        val mapsUrl = "https://www.google.com/maps?q=${location.latitude},${location.longitude}"
        val message = "🚨 EMERGENCY SOS ALERT!\n" +
                "Name: ${profile.fullName}\n" +
                "Blood: ${profile.bloodGroup}\n" +
                "Allergies: ${profile.allergies}\n" +
                "Live GPS: $mapsUrl\n" +
                "- Sent automatically via ResQNet"

        val cleanedPhone = contact.phoneNumber.filter { it.isDigit() || it == '+' }

        try {
            val smsManager: SmsManager? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            if (smsManager != null) {
                val parts = smsManager.divideMessage(message)
                if (parts.size > 1) {
                    smsManager.sendMultipartTextMessage(cleanedPhone, null, parts, null, null)
                } else {
                    smsManager.sendTextMessage(cleanedPhone, null, message, null, null)
                }
            } else {
                throw IllegalStateException("SmsManager is not available")
            }
        } catch (_: Exception) {
            // Fallback: SMS Intent
            try {
                val smsIntent = Intent(Intent.ACTION_VIEW).apply {
                    data = "smsto:$cleanedPhone".toUri()
                    putExtra("sms_body", message)
                    putExtra(Intent.EXTRA_TEXT, message)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(smsIntent)
            } catch (smsErr: Exception) {
                smsErr.printStackTrace()
            }
        }
    }
}
