package com.resqnet.sos.ui.screens.auth

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Shield
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
import com.resqnet.sos.data.remote.EmergencyServerBridge
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.navigation.Screen
import kotlinx.coroutines.launch
import java.net.URLEncoder

@Composable
fun LoginScreen(navController: NavController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val serverBridge = remember { EmergencyServerBridge() }

    var email by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ResQBackground)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // App Header & Logo
        Icon(
            imageVector = Icons.Default.Shield,
            contentDescription = "ResQNet Shield Logo",
            tint = ResQCyan,
            modifier = Modifier.size(72.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "ResQNet SOS",
            color = Color.White,
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold
        )

        Text(
            text = "Emergency Mesh Network & Cloud Sync",
            color = ResQTextSecondary,
            fontSize = 13.sp
        )

        Spacer(modifier = Modifier.height(36.dp))

        // Info Card
        Card(
            colors = CardDefaults.cardColors(containerColor = ResQSurface),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Sign in with your Gmail Account",
                    color = ResQCyan,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Enter the Gmail address you already used on the Web or Mobile app. Your profile, emergency contacts, and medical vault will automatically sync.",
                    color = ResQTextSecondary,
                    fontSize = 12.sp,
                    lineHeight = 16.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Email TextField
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Gmail Address", color = ResQTextSecondary) },
            placeholder = { Text("your.email@gmail.com", color = Color.Gray) },
            leadingIcon = {
                Icon(Icons.Default.Email, contentDescription = "Email", tint = ResQCyan)
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
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

        Spacer(modifier = Modifier.height(24.dp))

        // Action Button
        Button(
            onClick = {
                val cleanEmail = email.trim().lowercase()
                if (cleanEmail.isEmpty() || !cleanEmail.contains("@")) {
                    Toast.makeText(context, "Please enter a valid Gmail address.", Toast.LENGTH_SHORT).show()
                    return@Button
                }

                isLoading = true
                scope.launch {
                    try {
                        val (requestId, mode) = serverBridge.sendEmailOtp(cleanEmail)
                        isLoading = false
                        val encodedEmail = URLEncoder.encode(cleanEmail, "UTF-8")
                        val encodedReqId = URLEncoder.encode(requestId, "UTF-8")
                        navController.navigate("${Screen.VerifyOtp.route}/$encodedEmail/$encodedReqId")
                    } catch (e: Exception) {
                        isLoading = false
                        Toast.makeText(context, "Could not send OTP: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
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
                    text = "Continue with Gmail",
                    color = Color.Black,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "OTP will be sent to your Gmail inbox (Demo OTP: 123456)",
            color = Color.Gray,
            fontSize = 11.sp,
            textAlign = TextAlign.Center
        )
    }
}
