package com.resqnet.sos.ui.screens.sos

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.services.distribution.*
import com.resqnet.sos.ui.navigation.Screen
import com.resqnet.sos.services.hardware.AndroidLocationService
import com.resqnet.sos.services.hardware.AndroidSmsCallService
import com.resqnet.sos.theme.*
import kotlinx.coroutines.launch

@Composable
fun ActiveSosScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val controller = remember { AutomaticSosController(context) }
    val locationService = remember { AndroidLocationService(context) }
    val smsCallService = remember { AndroidSmsCallService(context) }
    val profilePrefs = remember { ProfilePreferences(context) }

    val events by controller.events.collectAsState()
    val currentStep by controller.currentStep.collectAsState()
    val isDelivered by controller.isDelivered.collectAsState()

    val profile = remember { profilePrefs.getProfile() }
    val primaryContact = remember { profile.emergencyContacts.firstOrNull() }
    var locationCoords by remember { mutableStateOf(locationService.getCachedLocation()) }

    // Launch automated SOS distribution automatically on screen load
    LaunchedEffect(Unit) {
        scope.launch {
            locationCoords = locationService.getHighAccuracyLocation()
        }
        controller.triggerAutomaticSos()
    }

    Scaffold(
        containerColor = ResQBackground,
        bottomBar = {
            Surface(
                color = ResQSurface,
                tonalElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = { navController.popBackStack() },
                        colors = ButtonDefaults.buttonColors(containerColor = ResQCrimson),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Cancel, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Cancel SOS", fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = {
                            if (primaryContact != null) {
                                smsCallService.initiateEmergencyPhoneCall(primaryContact.phoneNumber)
                            } else {
                                navController.navigate(Screen.EmergencyContacts.route)
                            }
                        },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = ResQCyan),
                        border = ButtonDefaults.outlinedButtonBorder.copy(brush = Brush.linearGradient(listOf(ResQCyan, ResQBlue))),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(if (primaryContact != null) Icons.Default.Call else Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(if (primaryContact != null) "Re-Dial Call" else "Add Contact", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 16.dp)
        ) {
            // =========================================================================
            // TOP EMERGENCY STATUS BANNER
            // =========================================================================
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (isDelivered) ResQGreen.copy(alpha = 0.15f) else ResQCrimson.copy(alpha = 0.15f)
                ),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.5.dp,
                        if (isDelivered) ResQGreen else ResQCrimson,
                        RoundedCornerShape(14.dp)
                    )
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                if (isDelivered) ResQGreen else ResQCrimson,
                                CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isDelivered) Icons.Default.CheckCircle else Icons.Default.Warning,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Column {
                        Text(
                            text = if (isDelivered) "SOS DELIVERED TO EMERGENCY SERVER" else "EMERGENCY SOS BROADCAST ACTIVE",
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.5.sp
                        )
                        Text(
                            text = if (isDelivered) "Incident logged in cloud central triage" else "Broadcasting through offline BLE & Wi-Fi Mesh",
                            color = ResQTextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // =========================================================================
            // AUTOMATIC SOS DISTRIBUTION PROGRESS CARD (THE 10-STEP MESH TIMELINE)
            // =========================================================================
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF091428)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.5.dp, ResQCyan, RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.Hub, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(20.dp))
                            Text(
                                text = "Automatic SOS Distribution",
                                style = MaterialTheme.typography.titleLarge,
                                color = Color.White,
                                fontSize = 15.sp
                            )
                        }

                        Box(
                            modifier = Modifier
                                .background(ResQCyan.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                .border(1.dp, ResQCyan.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "⚡ 100% AUTOMATIC",
                                color = ResQCyan,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Pre-existing RSEP file distributing across nearby participating mesh devices:",
                        color = ResQTextSecondary,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Progress Stepper List
                    events.forEachIndexed { index, evt ->
                        Row(modifier = Modifier.fillMaxWidth()) {
                            // Indicator column
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.width(26.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(20.dp)
                                        .background(
                                            when (evt.step) {
                                                SosDistributionStep.SOS_DELIVERED -> ResQGreen
                                                SosDistributionStep.INTERNET_GATEWAY_FOUND -> ResQYellow
                                                SosDistributionStep.RSEP_TRANSFERRED -> Color(0xFF8B5CF6)
                                                else -> ResQBlue
                                            },
                                            CircleShape
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = when (evt.step) {
                                            SosDistributionStep.SOS_DELIVERED -> Icons.Default.Check
                                            SosDistributionStep.INTERNET_GATEWAY_FOUND -> Icons.Default.CloudDone
                                            SosDistributionStep.RSEP_TRANSFERRED -> Icons.Default.FlashOn
                                            SosDistributionStep.DEVICE_FOUND, SosDistributionStep.ANOTHER_DEVICE_FOUND -> Icons.Default.Devices
                                            SosDistributionStep.RSEP_FOUND -> Icons.Default.Description
                                            else -> Icons.Default.Sensors
                                        },
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(12.dp)
                                    )
                                }

                                if (index < events.size - 1) {
                                    Box(
                                        modifier = Modifier
                                            .width(2.dp)
                                            .height(38.dp)
                                            .background(Color.White.copy(alpha = 0.15f))
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            // Content Box
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.04f)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(bottom = 10.dp)
                                    .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = evt.step.name.replace("_", " "),
                                            color = Color.White,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Black
                                        )

                                        if (!evt.transport.isNullOrEmpty()) {
                                            Box(
                                                modifier = Modifier
                                                    .background(ResQBlue.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Text(
                                                    text = if (evt.transport == "BLE") "BLE (Bluetooth)" else evt.transport,
                                                    color = Color(0xFF93C5FD),
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(4.dp))

                                    Text(
                                        text = evt.message,
                                        color = Color(0xFFCBD5E1),
                                        fontSize = 11.sp,
                                        lineHeight = 15.sp
                                    )

                                    Spacer(modifier = Modifier.height(4.dp))

                                    Text(
                                        text = "Hop: ${evt.hopCount} • TTL: ${evt.ttl} • Node: ${evt.currentNodeId}",
                                        color = ResQTextMuted,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // =========================================================================
            // EMERGENCY CONTACTS & DISPATCH SUMMARY
            // =========================================================================
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0D1B2A)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.5.dp, Color(0xFF0284C7), RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.ForwardToInbox, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(20.dp))
                        Text(
                            text = "Emergency Contacts Alerted",
                            style = MaterialTheme.typography.titleLarge,
                            color = ResQTextPrimary,
                            fontSize = 15.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Live GPS distress beacon & Medical Vault transmitted to:",
                        color = ResQTextSecondary,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    if (primaryContact != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(ResQGreen.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                .border(1.dp, ResQGreen.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ResQGreen, modifier = Modifier.size(16.dp))
                                Column {
                                    Text(
                                        text = "${primaryContact.name} (${primaryContact.phoneNumber})",
                                        color = Color(0xFF86EFAC),
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Call dialer & SMS dispatched automatically",
                                        color = ResQTextSecondary,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    } else {
                        // NO CONTACT SAVED: Prominent Add Contact Button
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF2C1305)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, ResQYellow, RoundedCornerShape(10.dp))
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "⚠️ No Emergency Contact Registered!",
                                    color = ResQYellow,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Register your family or guardian's phone number so the app can automatically call and SMS them during SOS.",
                                    color = ResQTextSecondary,
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = { navController.navigate(Screen.EmergencyContacts.route) },
                                    colors = ButtonDefaults.buttonColors(containerColor = ResQYellow),
                                    shape = RoundedCornerShape(6.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = Color.Black, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Add Family / Guardian Phone Number", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Medical Pill Snippet
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .background(ResQCrimson.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text("Blood: ${profile.bloodGroup}", color = ResQCrimson, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Box(
                            modifier = Modifier
                                .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text("Allergies: ${profile.allergies}", color = ResQTextSecondary, fontSize = 11.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // =========================================================================
            // LIVE GPS TELEMETRY CARD
            // =========================================================================
            Card(
                colors = CardDefaults.cardColors(containerColor = ResQSurface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, ResQCardBorder, RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.MyLocation, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(20.dp))
                        Text(
                            text = "Live GPS Coordinates",
                            style = MaterialTheme.typography.titleLarge,
                            color = ResQTextPrimary,
                            fontSize = 15.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Lat: ${String.format("%.5f", locationCoords.latitude)}° N  •  Long: ${String.format("%.5f", locationCoords.longitude)}° E",
                        color = ResQCyan,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            val mapUri = Uri.parse("https://www.google.com/maps?q=${locationCoords.latitude},${locationCoords.longitude}")
                            context.startActivity(Intent(Intent.ACTION_VIEW, mapUri))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ResQBlue),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Map, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Open Live Location in Google Maps", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // =========================================================================
            // MANUAL SYSTEM SHARE / BLUETOOTH RSEP EXPORT CARD
            // =========================================================================
            Card(
                colors = CardDefaults.cardColors(containerColor = ResQSurface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, ResQCyan.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Bluetooth, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(20.dp))
                        Text(
                            text = "Direct Bluetooth / System Share",
                            style = MaterialTheme.typography.titleLarge,
                            color = ResQTextPrimary,
                            fontSize = 15.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Send your active .rsep dossier file directly to a nearby phone or device using native Android Bluetooth or Nearby Share:",
                        color = ResQTextSecondary,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            try {
                                val rsepStorageManager = com.resqnet.sos.data.local.RsepStorageManager(context)
                                val rsepPacket = rsepStorageManager.getExistingRsep()
                                val rsepJson = rsepStorageManager.exportRsepJson(rsepPacket)

                                val shareText = "🚨 RESQNET EMERGENCY RSEP DOSSIER 🚨\n\n" +
                                        "Victim Name: ${profile.fullName}\n" +
                                        "Age: ${profile.age} yrs • Gender: ${profile.gender}\n" +
                                        "Height: ${profile.height} cm • Weight: ${profile.weight} kg\n" +
                                        "Blood Group: ${profile.bloodGroup}\n" +
                                        "Allergies: ${profile.allergies}\n" +
                                        "Medical Conditions: ${profile.medicalConditions}\n" +
                                        "Emergency Contact: ${primaryContact?.name ?: "Guardian"} (${primaryContact?.phoneNumber ?: "112"})\n" +
                                        "Live Location: https://www.google.com/maps?q=${locationCoords.latitude},${locationCoords.longitude}\n\n" +
                                        "RAW RSEP PAYLOAD:\n$rsepJson"

                                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                    type = "text/plain"
                                    putExtra(Intent.EXTRA_SUBJECT, "ResQNet Emergency RSEP Dossier - ${profile.fullName}")
                                    putExtra(Intent.EXTRA_TEXT, shareText)
                                }
                                context.startActivity(Intent.createChooser(shareIntent, "Send RSEP File via Bluetooth / Nearby Share"))
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ResQCyan),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Share, contentDescription = null, tint = Color.Black, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Send .rsep File via Bluetooth / Nearby Share",
                            color = Color.Black,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
