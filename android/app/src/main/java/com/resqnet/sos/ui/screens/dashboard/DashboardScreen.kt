package com.resqnet.sos.ui.screens.dashboard

import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.Settings
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.services.distribution.NativeBleMeshEngine
import com.resqnet.sos.services.hardware.AndroidLocationService
import com.resqnet.sos.services.hardware.AudioVoiceNoteRecorder
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.components.SlidingBottomNavBar
import com.resqnet.sos.ui.components.SubtleMeteorShowerBackground
import com.resqnet.sos.ui.navigation.Screen
import kotlinx.coroutines.delay

@Composable
fun DashboardScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val locationService = remember { AndroidLocationService.getInstance(context) }
    val locationState by locationService.locationModeManager.locationState.collectAsState()
    val pdrTelemetry by locationService.pdrEngine.pdrTelemetry.collectAsState()
    var checkpointMenuExpanded by remember { mutableStateOf(false) }

    var isAirplaneModeOn by remember { mutableStateOf(false) }
    var isBluetoothOn by remember { mutableStateOf(false) }
    var signalPopupMessage by remember { mutableStateOf<String?>(null) }
    var isPopupOnlineState by remember { mutableStateOf(false) }
    var lastOnlineState by remember { mutableStateOf<Boolean?>(null) }

    val btManager = remember { context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager }
    val btAdapter = remember { btManager?.adapter }

    val vibrator = remember { context.getSystemService(Vibrator::class.java) }
    var isHoldingSos by remember { mutableStateOf(false) }
    var countdownProgress by remember { mutableFloatStateOf(0f) }

    // Subtle pulsing animation for SOS button ring
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.12f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    // Handle 2-second hold countdown (20 steps of 100ms = 2.0s)
    LaunchedEffect(isHoldingSos) {
        if (isHoldingSos) {
            countdownProgress = 0f
            val totalSteps = 20
            for (i in 1..totalSteps) {
                if (!isHoldingSos) break
                delay(100)
                countdownProgress = i / totalSteps.toFloat()
            }
            if (isHoldingSos) {
                vibrator?.vibrate(VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE))
                isHoldingSos = false
                navController.navigate(Screen.ActiveSos.route)
            }
        } else {
            countdownProgress = 0f
        }
    }

    Scaffold(
        containerColor = ResQBackground,
        bottomBar = {
            SlidingBottomNavBar(
                selectedRoute = Screen.Dashboard.route,
                navController = navController
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            SubtleMeteorShowerBackground()

            Column(
                modifier = modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // =========================================================================
                // TOP HEADER BANNER
                // =========================================================================
                Card(
                    colors = CardDefaults.cardColors(containerColor = ResQSurface),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.5.dp, ResQCardBorder, RoundedCornerShape(16.dp))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 18.dp, vertical = 14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "ResQNet",
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = ResQTextPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 21.sp
                                )
                                Box(
                                    modifier = Modifier
                                        .padding(start = 6.dp)
                                        .size(7.dp)
                                        .background(ResQCyan, CircleShape)
                                )
                            }
                            Text(
                                text = "Decentralized Emergency SOS",
                                style = MaterialTheme.typography.bodyMedium,
                                color = ResQTextSecondary,
                                fontSize = 11.5.sp
                            )
                        }

                        Surface(
                            color = if (NativeBleMeshEngine.isMeshActive.collectAsState().value) ResQGreen.copy(alpha = 0.15f) else ResQCrimson.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(8.dp),
                            border = ButtonDefaults.outlinedButtonBorder(enabled = true).copy(
                                brush = Brush.linearGradient(
                                    listOf(
                                        if (NativeBleMeshEngine.isMeshActive.collectAsState().value) ResQGreen else ResQCrimson,
                                        if (NativeBleMeshEngine.isMeshActive.collectAsState().value) ResQBlue else ResQCrimson
                                    )
                                )
                            ),
                            modifier = Modifier.clickable { navController.navigate(Screen.MeshStatus.route) }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(
                                            if (NativeBleMeshEngine.isMeshActive.collectAsState().value) ResQGreen else ResQCrimson,
                                            CircleShape
                                        )
                                )
                                Text(
                                    text = if (NativeBleMeshEngine.isMeshActive.collectAsState().value) "MESH ACTIVE" else "BT OFF",
                                    color = if (NativeBleMeshEngine.isMeshActive.collectAsState().value) ResQGreen else ResQCrimson,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 0.5.sp
                                )
                            }
                        }
                    }
                }

                // =========================================================================
                // SIGNAL STATUS POPUP BANNER (CONDITIONAL NULL-SAFE)
                // =========================================================================
                val activeSignalMsg = signalPopupMessage
                if (activeSignalMsg != null) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = if (isPopupOnlineState) Color(0xFF0F231A) else Color(0xFF07172C)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, if (isPopupOnlineState) ResQGreen else ResQCyan, RoundedCornerShape(12.dp))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    imageVector = if (isPopupOnlineState) Icons.Default.Wifi else Icons.Default.WifiOff,
                                    contentDescription = null,
                                    tint = if (isPopupOnlineState) ResQGreen else ResQCyan,
                                    modifier = Modifier.size(22.dp)
                                )
                                Text(
                                    text = activeSignalMsg,
                                    color = Color.White,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close",
                                tint = ResQTextMuted,
                                modifier = Modifier
                                    .size(18.dp)
                                    .clickable { signalPopupMessage = null }
                            )
                        }
                    }
                }
            }

            if (isAirplaneModeOn && !isBluetoothOn) {
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF2E0A0A)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.5.dp, ResQCrimson, RoundedCornerShape(12.dp))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.AirplanemodeActive,
                                contentDescription = "Airplane Mode",
                                tint = ResQCrimson,
                                modifier = Modifier.size(24.dp)
                            )
                            Column {
                                Text(
                                    text = "⚠️ AIRPLANE MODE TURNED OFF BLUETOOTH!",
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black
                                )
                                Text(
                                    text = "Airplane Mode automatically turned off Bluetooth. For offline SOS to send & receive alerts without cellular or internet, Bluetooth MUST be turned back ON.",
                                    color = ResQTextSecondary,
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Button(
                            onClick = {
                                try {
                                    val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
                                    context.startActivity(intent)
                                } catch (_: Exception) {}
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ResQCrimson),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Bluetooth, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("OPEN SETTINGS TO TURN ON BLUETOOTH", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            } else if (isAirplaneModeOn) {
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F231A)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.5.dp, ResQGreen, RoundedCornerShape(12.dp))
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.BluetoothConnected,
                            contentDescription = "Bluetooth Mesh Active",
                            tint = ResQGreen,
                            modifier = Modifier.size(24.dp)
                        )
                        Column {
                            Text(
                                text = "✈️ AIRPLANE MODE • OFFLINE BLE MESH ACTIVE",
                                color = ResQGreen,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Bluetooth LE Mesh is active and listening for nearby emergency distress signals in 100% offline mode without cellular or internet.",
                                color = ResQTextSecondary,
                                fontSize = 10.5.sp
                            )
                        }
                    }
                }
            } else if (!isBluetoothOn) {
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF281C08)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.5.dp, ResQYellow, RoundedCornerShape(12.dp))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.BluetoothDisabled,
                                contentDescription = "Bluetooth Disabled",
                                tint = ResQYellow,
                                modifier = Modifier.size(24.dp)
                            )
                            Column {
                                Text(
                                    text = "⚠️ BLUETOOTH IS TURNED OFF",
                                    color = ResQYellow,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Turn on Bluetooth to participate in offline peer-to-peer BLE mesh emergency broadcasts.",
                                    color = ResQTextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Button(
                            onClick = {
                                try {
                                    val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
                                    context.startActivity(intent)
                                } catch (_: Exception) {}
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ResQYellow),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Bluetooth, contentDescription = null, tint = Color.Black, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("ENABLE BLUETOOTH IN SETTINGS", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // =========================================================================
            // LOCATION STATE MACHINE & RE-SYNC POPUP BANNER
            // =========================================================================
            val locationService = remember { AndroidLocationService.getInstance(context) }
            val locationState by locationService.locationModeManager.locationState.collectAsState()

            if (locationState.isResyncedEvent) {
                Spacer(modifier = Modifier.height(10.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F231A)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.5.dp, ResQGreen, RoundedCornerShape(12.dp))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.GpsFixed, contentDescription = null, tint = ResQGreen, modifier = Modifier.size(22.dp))
                            Column {
                                Text("Location Signal Restored", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Black)
                                Text("Position re-synchronized to new confirmed GPS fix.", color = ResQTextSecondary, fontSize = 11.sp)
                            }
                        }
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Dismiss",
                            tint = ResQTextMuted,
                            modifier = Modifier
                                .size(18.dp)
                                .clickable { locationService.locationModeManager.dismissResyncedEvent() }
                        )
                    }
                }
            }

            LaunchedEffect(Unit) {
                locationService.startGeneralLocationUpdates()
                while (true) {
                    val realCoords = locationService.getHighAccuracyLocation()
                    if (realCoords.latitude != 0.0 && realCoords.longitude != 0.0) {
                        locationService.pdrEngine.updateLastConfirmedGps(realCoords.latitude, realCoords.longitude)
                        println("[DashboardScreen] 🎯 Real GPS origin snapped: (${realCoords.latitude}, ${realCoords.longitude})")
                        break
                    }
                    delay(1000)
                }
            }

            // RECEIVED MESH EMERGENCY ALERTS CARD WITH DELETE OPTION
            val receivedVault = remember { com.resqnet.sos.data.local.ReceivedIncidentsVault(context) }
            var receivedPacketsList by remember { mutableStateOf(receivedVault.getReceivedPackets()) }

            LaunchedEffect(Unit) {
                while (true) {
                    receivedPacketsList = receivedVault.getReceivedPackets()
                    delay(1000)
                }
            }

            if (receivedPacketsList.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))

                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E0B0B)),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.5.dp, ResQCrimson, RoundedCornerShape(16.dp))
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
                                Icon(Icons.Default.Warning, contentDescription = null, tint = ResQCrimson, modifier = Modifier.size(20.dp))
                                Text(
                                    text = "🚨 RECEIVED SOS ALERTS (${receivedPacketsList.size})",
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }

                            TextButton(
                                onClick = {
                                    receivedVault.clearReceivedPackets()
                                    receivedPacketsList = emptyList()
                                }
                            ) {
                                Text("Clear All", color = ResQCrimson, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        receivedPacketsList.forEach { pkt ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f)),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 8.dp)
                                    .border(1.dp, ResQCrimson.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        val physicalInfo = listOfNotNull(
                                            if (pkt.user.gender.isNotBlank()) pkt.user.gender else null,
                                            if (pkt.user.age.isNotBlank()) "${pkt.user.age} yrs" else null
                                        ).joinToString(" • ")

                                        Text("Victim: ${pkt.user.name}${if (physicalInfo.isNotBlank()) " ($physicalInfo)" else ""}", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                        IconButton(
                                            onClick = {
                                                receivedVault.deleteReceivedPacket(pkt.header.packetId)
                                                receivedPacketsList = receivedVault.getReceivedPackets()
                                            },
                                            modifier = Modifier.size(24.dp)
                                        ) {
                                            Icon(Icons.Default.Delete, contentDescription = "Delete Alert", tint = ResQTextMuted, modifier = Modifier.size(16.dp))
                                        }
                                    }

                                    val bodySpecs = listOfNotNull(
                                        if (pkt.user.bloodGroup.isNotBlank()) "Blood: ${pkt.user.bloodGroup}" else null,
                                        if (pkt.user.height.isNotBlank()) "Ht: ${pkt.user.height}cm" else null,
                                        if (pkt.user.weight.isNotBlank()) "Wt: ${pkt.user.weight}kg" else null
                                    ).joinToString(" • ")

                                    Text(bodySpecs, color = ResQCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    Text("Medical: ${pkt.user.medicalConditions}", color = ResQTextSecondary, fontSize = 11.sp)
                                    Text("GPS: ${pkt.location.latitude}, ${pkt.location.longitude}", color = ResQTextMuted, fontSize = 10.sp)

                                    if (pkt.incident.hasVoiceNote && !pkt.incident.voiceNoteBase64.isNullOrEmpty()) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Button(
                                            onClick = {
                                                AudioVoiceNoteRecorder.playBase64Audio(
                                                    context,
                                                    pkt.incident.voiceNoteBase64!!
                                                )
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = ResQYellow),
                                            shape = RoundedCornerShape(6.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Icon(Icons.Default.VolumeUp, contentDescription = null, tint = Color.Black, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Play Victim Voice Note (${pkt.incident.voiceNoteDurationSec}s)", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 10.5.sp)
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = {
                                                val mapUri = android.net.Uri.parse("https://www.google.com/maps?q=${pkt.location.latitude},${pkt.location.longitude}")
                                                context.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, mapUri))
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = ResQBlue),
                                            shape = RoundedCornerShape(6.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Text("View Map Location", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }

                                        val contact = pkt.user.emergencyContacts.firstOrNull()
                                        if (contact != null) {
                                            Button(
                                                onClick = {
                                                    val callIntent = android.content.Intent(android.content.Intent.ACTION_DIAL).apply {
                                                        data = android.net.Uri.parse("tel:${contact.phoneNumber}")
                                                    }
                                                    context.startActivity(callIntent)
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = ResQGreen),
                                                shape = RoundedCornerShape(6.dp),
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Text("Call Contact", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // =========================================================================
            // HERO SOS BUTTON (3-SECOND HOLD WITH PULSE ANIMATION)
            // =========================================================================
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(240.dp)
                    .pointerInput(Unit) {
                        detectTapGestures(
                            onPress = {
                                isHoldingSos = true
                                vibrator?.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
                                tryAwaitRelease()
                                isHoldingSos = false
                            }
                        )
                    }
            ) {
                // Outer Pulse Ring
                Box(
                    modifier = Modifier
                        .size(230.dp)
                        .scale(if (isHoldingSos) 1.25f else pulseScale)
                        .background(
                            Brush.radialGradient(
                                listOf(ResQCrimson.copy(alpha = 0.4f), Color.Transparent)
                            ),
                            CircleShape
                        )
                )

                // Secondary Glow Ring
                Box(
                    modifier = Modifier
                        .size(195.dp)
                        .background(ResQCrimson.copy(alpha = 0.2f), CircleShape)
                        .border(2.dp, ResQCrimson.copy(alpha = 0.5f), CircleShape)
                )

                // Main Core SOS Button
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(165.dp)
                        .shadow(20.dp, CircleShape, spotColor = ResQCrimson)
                        .background(
                            Brush.verticalGradient(listOf(ResQCrimson, ResQCrimsonDark)),
                            CircleShape
                        )
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = "SOS",
                            tint = Color.White,
                            modifier = Modifier.size(44.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (isHoldingSos) "${((1f - countdownProgress) * 3).toInt() + 1}" else "SOS",
                            color = Color.White,
                            fontSize = if (isHoldingSos) 36.sp else 28.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = if (isHoldingSos) "HOLDING..." else "HOLD 3s FOR SOS",
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                    }
                }

                // Countdown Progress Ring overlay when holding
                if (isHoldingSos) {
                    CircularProgressIndicator(
                        progress = { countdownProgress },
                        modifier = Modifier.size(180.dp),
                        color = ResQCyan,
                        strokeWidth = 6.dp,
                        trackColor = Color.Transparent
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "Hold firmly for 3 seconds to trigger mesh distress broadcast",
                style = MaterialTheme.typography.bodyMedium,
                color = ResQTextSecondary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(28.dp))

            // =========================================================================
            // MESH HARDWARE TELEMETRY CARD
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
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "ResQNet",
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = ResQTextPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 21.sp
                                )
                                Box(
                                    modifier = Modifier
                                        .padding(start = 6.dp)
                                        .size(7.dp)
                                        .background(ResQCyan, CircleShape)
                                )
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Decentralized Emergency Mesh",
                                style = MaterialTheme.typography.bodyMedium,
                                color = ResQTextSecondary,
                                fontSize = 12.sp
                            )
                        }

                        val isMeshActive = NativeBleMeshEngine.isMeshActive.collectAsState().value

                        Surface(
                            color = if (isMeshActive) ResQGreen.copy(alpha = 0.15f) else ResQCrimson.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier
                                .border(
                                    1.dp,
                                    if (isMeshActive) ResQGreen else ResQCrimson,
                                    RoundedCornerShape(20.dp)
                                )
                                .clickable { navController.navigate(Screen.MeshStatus.route) }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(7.dp)
                                        .background(if (isMeshActive) ResQGreen else ResQCrimson, CircleShape)
                                )
                                Text(
                                    text = if (isMeshActive) "MESH ONLINE" else "BT OFF",
                                    color = if (isMeshActive) ResQGreen else ResQCrimson,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                var isAirplaneModeOn by remember { mutableStateOf(false) }
                var isBluetoothOn by remember { mutableStateOf(false) }

                val btManager = remember { context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager }
                val btAdapter = remember { btManager?.adapter }

                LaunchedEffect(Unit) {
                    while (true) {
                        isAirplaneModeOn = try {
                            Settings.Global.getInt(
                                context.contentResolver,
                                Settings.Global.AIRPLANE_MODE_ON,
                                0
                            ) != 0
                        } catch (_: Exception) {
                            false
                        }
                        isBluetoothOn = btAdapter?.isEnabled == true
                        if (isBluetoothOn) {
                            NativeBleMeshEngine.init(context)
                        }
                        delay(1000)
                    }
                }

                if (isAirplaneModeOn && !isBluetoothOn) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF230D11)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, ResQCrimson, RoundedCornerShape(14.dp))
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AirplanemodeActive,
                                    contentDescription = "Airplane Mode",
                                    tint = ResQCrimson,
                                    modifier = Modifier.size(22.dp)
                                )
                                Column {
                                    Text(
                                        text = "⚠️ AIRPLANE MODE TURNED OFF BLUETOOTH!",
                                        color = ResQTextPrimary,
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Turn Bluetooth back ON for offline SOS broadcasting.",
                                        color = ResQTextSecondary,
                                        fontSize = 10.5.sp
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Button(
                                onClick = {
                                    try {
                                        val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
                                        context.startActivity(intent)
                                    } catch (_: Exception) {}
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = ResQCrimson),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Bluetooth, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("TURN ON BLUETOOTH", color = Color.White, fontSize = 10.5.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                } else if (!isBluetoothOn) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF221708)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, ResQYellow, RoundedCornerShape(14.dp))
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.BluetoothDisabled,
                                    contentDescription = "Bluetooth Disabled",
                                    tint = ResQYellow,
                                    modifier = Modifier.size(22.dp)
                                )
                                Column {
                                    Text(
                                        text = "⚠️ BLUETOOTH IS TURNED OFF",
                                        color = ResQYellow,
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Enable Bluetooth for offline BLE emergency mesh.",
                                        color = ResQTextSecondary,
                                        fontSize = 10.5.sp
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Button(
                                onClick = {
                                    try {
                                        val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
                                        context.startActivity(intent)
                                    } catch (_: Exception) {}
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = ResQYellow),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Bluetooth, contentDescription = null, tint = Color.Black, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("ENABLE BLUETOOTH", color = Color.Black, fontSize = 10.5.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                // =========================================================================
                // EVENLY ALIGNED EMERGENCY QUICK ACCESS SECTION
                // =========================================================================
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .width(4.dp)
                            .height(18.dp)
                            .background(ResQCyan, RoundedCornerShape(2.dp))
                    )
                    Text(
                        text = "Emergency Quick Access",
                        color = ResQTextPrimary,
                        fontSize = 15.5.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Single Row: First Aid Tips & Emergency Calls
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(IntrinsicSize.Max),
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    AlignedQuickTile(
                        title = "First Aid Tips",
                        subtitle = "CPR, Choking & Burns",
                        icon = Icons.Default.HealthAndSafety,
                        accentColor = ResQCrimson,
                        modifier = Modifier.weight(1f),
                        onClick = { navController.navigate(Screen.FirstAid.route) }
                    )
                    AlignedQuickTile(
                        title = "Emergency Calls",
                        subtitle = "Dial 108 & Primary",
                        icon = Icons.Default.Phone,
                        accentColor = ResQGreen,
                        modifier = Modifier.weight(1f),
                        onClick = { navController.navigate(Screen.ActiveSos.route) }
                    )
                }

                Spacer(modifier = Modifier.weight(1f))

                // =========================================================================
                // HERO SOS BUTTON
                // =========================================================================
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(bottom = 8.dp)
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(310.dp)
                            .pointerInput(Unit) {
                                detectTapGestures(
                                    onPress = {
                                        isHoldingSos = true
                                        vibrator?.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
                                        tryAwaitRelease()
                                        isHoldingSos = false
                                    }
                                )
                            }
                    ) {
                        // Subtle Outer Pulse Ring
                        Box(
                            modifier = Modifier
                                .size(300.dp)
                                .scale(if (isHoldingSos) 1.25f else pulseScale)
                                .background(
                                    Brush.radialGradient(
                                        listOf(ResQCrimson.copy(alpha = 0.38f), Color.Transparent)
                                    ),
                                    CircleShape
                                )
                        )

                        // Secondary Glow Ring
                        Box(
                            modifier = Modifier
                                .size(255.dp)
                                .background(ResQCrimson.copy(alpha = 0.16f), CircleShape)
                                .border(2.5.dp, ResQCrimson.copy(alpha = 0.45f), CircleShape)
                        )

                        // Main Core SOS Button (220dp)
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(220.dp)
                                .shadow(28.dp, CircleShape, spotColor = ResQCrimson)
                                .background(
                                    Brush.verticalGradient(listOf(ResQCrimson, ResQCrimsonDark)),
                                    CircleShape
                                )
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = "SOS",
                                    tint = Color.White,
                                    modifier = Modifier.size(60.dp)
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = if (isHoldingSos) "${((1f - countdownProgress) * 2).toInt() + 1}" else "SOS",
                                    color = Color.White,
                                    fontSize = if (isHoldingSos) 48.sp else 42.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 2.sp
                                )
                                Text(
                                    text = if (isHoldingSos) "HOLDING..." else "HOLD 2s FOR SOS",
                                    color = Color.White.copy(alpha = 0.9f),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.8.sp
                                )
                            }
                        }

                        // Countdown Progress Ring Overlay
                        if (isHoldingSos) {
                            CircularProgressIndicator(
                                progress = { countdownProgress },
                                modifier = Modifier.size(235.dp),
                                color = ResQCyan,
                                strokeWidth = 9.dp,
                                trackColor = Color.Transparent
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Surface(
                        color = ResQSurface,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth(0.95f)
                            .border(1.5.dp, ResQCardBorder, RoundedCornerShape(16.dp))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Default.CellTower,
                                contentDescription = null,
                                tint = ResQCyan,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = "In case of emergency hold this button for 2 seconds to make an SOS Call/Message",
                                color = ResQTextPrimary,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                textAlign = TextAlign.Center,
                                lineHeight = 17.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AlignedQuickTile(
    title: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = ResQSurface),
        shape = RoundedCornerShape(18.dp),
        modifier = modifier
            .fillMaxHeight()
            .border(1.5.dp, ResQCardBorder, RoundedCornerShape(18.dp))
            .clickable { onClick() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(accentColor.copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = title, tint = accentColor, modifier = Modifier.size(22.dp))
            }

            Spacer(modifier = Modifier.height(12.dp))

            Column {
                Text(
                    text = title,
                    color = ResQTextPrimary,
                    fontSize = 14.5.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    color = ResQTextSecondary,
                    fontSize = 11.5.sp,
                    maxLines = 1
                )
            }
        }
    }
}
