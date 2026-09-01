package com.resqnet.sos.ui.screens.auth

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.data.remote.EmergencyServerBridge
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.navigation.Screen
import kotlinx.coroutines.launch

@Composable
fun VerifyOtpScreen(
    navController: NavController,
    email: String,
    requestId: String
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val profilePrefs = remember { ProfilePreferences(context) }
    val serverBridge = remember { EmergencyServerBridge() }

    var otpCode by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var statusText by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ResQBackground)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.VerifiedUser,
            contentDescription = "Verify Icon",
            tint = ResQCyan,
            modifier = Modifier.size(64.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Enter Verification Code",
            color = Color.White,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Code sent to: $email",
            color = ResQCyan,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium
        )

        Spacer(modifier = Modifier.height(28.dp))

        // OTP Input
        OutlinedTextField(
            value = otpCode,
            onValueChange = { if (it.length <= 6) otpCode = it },
            label = { Text("6-Digit Verification Code", color = ResQTextSecondary) },
            placeholder = { Text("123456", color = Color.Gray) },
            leadingIcon = {
                Icon(Icons.Default.Lock, contentDescription = "OTP Code", tint = ResQCyan)
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = ResQCyan,
                unfocusedBorderColor = ResQTextSecondary.copy(alpha = 0.5f),
                focusedLabelColor = ResQCyan,
                cursorColor = ResQCyan,
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Default / Demo OTP code is 123456",
            color = Color.Gray,
            fontSize = 11.sp,
            textAlign = TextAlign.Center
        )

        if (statusText.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = statusText,
                color = ResQCyan,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (otpCode.trim().length < 4) {
                    Toast.makeText(context, "Please enter the full verification code.", Toast.LENGTH_SHORT).show()
                    return@Button
                }

                isLoading = true
                statusText = "Verifying code with ResQNet server..."

                scope.launch {
                    try {
                        val verified = serverBridge.verifyEmailOtp(email, otpCode, requestId)
                        if (verified) {
                            statusText = "Syncing profile from Cloud database..."
                            val cloudProfile = serverBridge.fetchProfileByEmail(email)

                            val existingLocal = profilePrefs.getProfile()
                            val updatedProfile = if (cloudProfile != null) {
                                cloudProfile.copy(
                                    emergencyContacts = if (cloudProfile.emergencyContacts.isNotEmpty()) {
                                        cloudProfile.emergencyContacts
                                    } else existingLocal.emergencyContacts
                                )
                            } else {
                                existingLocal.copy(email = email)
                            }

                            profilePrefs.saveProfile(updatedProfile)
                            profilePrefs.setLoggedIn(true)
                            profilePrefs.setProfileComplete(true)

                            isLoading = false
                            Toast.makeText(context, "Logged in as ${email}. Syncing profile...", Toast.LENGTH_SHORT).show()

                            val hasContacts = cloudProfile?.emergencyContacts?.isNotEmpty() == true
                            val destination = if (hasContacts) Screen.Dashboard.route else Screen.EmergencyContacts.route

                            navController.navigate(destination) {
                                popUpTo(Screen.Login.route) { inclusive = true }
                            }
                        } else {
                            isLoading = false
                            statusText = "Invalid OTP code. Try entering 123456."
                            Toast.makeText(context, "Invalid OTP code. Please try again.", Toast.LENGTH_SHORT).show()
                        }
                    } catch (e: Exception) {
                        isLoading = false
                        statusText = "Verification failed: ${e.localizedMessage}"
                    }
                }
            },
            enabled = !isLoading,
            colors = ButtonDefaults.buttonColors(containerColor = ResQCyan),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    color = Color.Black,
                    modifier = Modifier.size(24.dp)
                )
            } else {
                Text(
                    text = "Verify & Sync Web Profile",
                    color = Color.Black,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
