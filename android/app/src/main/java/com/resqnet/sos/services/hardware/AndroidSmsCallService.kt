package com.resqnet.sos.services.hardware

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.telephony.SmsManager
import android.widget.Toast
import com.resqnet.sos.data.model.EmergencyContact
import com.resqnet.sos.data.model.UserProfile

class AndroidSmsCallService(private val context: Context) {

    fun initiateEmergencyPhoneCall(phoneNumber: String) {
        try {
            val intent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:${phoneNumber.replace(" ", "")}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // Fallback to dialer if direct call permission not granted
            try {
                val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                    data = Uri.parse("tel:${phoneNumber.replace(" ", "")}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(dialIntent)
            } catch (dialErr: Exception) {
                Toast.makeText(context, "Could not open phone dialer.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    fun sendEmergencySms(contact: EmergencyContact, profile: UserProfile, location: GpsCoordinates) {
        val mapsUrl = "https://www.google.com/maps?q=${location.latitude},${location.longitude}"
        val message = "🚨 EMERGENCY SOS ALERT!\n" +
                "Name: ${profile.fullName}\n" +
                "Blood: ${profile.bloodGroup}\n" +
                "Allergies: ${profile.allergies}\n" +
                "Live GPS: $mapsUrl\n" +
                "- Sent automatically via ResQNet"

        try {
            val smsManager = context.getSystemService(SmsManager::class.java)
            smsManager?.sendTextMessage(contact.phoneNumber, null, message, null, null)
        } catch (e: Exception) {
            // Fallback: SMS Intent
            try {
                val smsIntent = Intent(Intent.ACTION_VIEW).apply {
                    data = Uri.parse("smsto:${contact.phoneNumber}")
                    putExtra("sms_body", message)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(smsIntent)
            } catch (smsErr: Exception) {
                e.printStackTrace()
            }
        }
    }
}
