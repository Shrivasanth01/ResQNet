package com.resqnet.sos.ui.screens.dashboard

import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.ui.draw.clip
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
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.navigation.Screen
import kotlinx.coroutines.delay

@Composable
fun DashboardScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val vibrator = remember { context.getSystemService(Vibrator::class.java) }
    var isHoldingSos by remember { mutableStateOf(false) }
    var countdownProgress by remember { mutableFloatStateOf(0f) }

    // Pulsing animated ring for Hero SOS button
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    // Handle 3-second hold countdown
    LaunchedEffect(isHoldingSos) {
        if (isHoldingSos) {
            countdownProgress = 0f
            val totalSteps = 30
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
            NavigationBar(
                containerColor = ResQSurface,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = true,
                    onClick = { },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home", tint = ResQCyan) },
                    label = { Text("Home", color = ResQCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate(Screen.Map.route) },
                    icon = { Icon(Icons.Default.Map, contentDescription = "Map", tint = ResQTextSecondary) },
                    label = { Text("Map", color = ResQTextSecondary, fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate(Screen.Reports.route) },
                    icon = { Icon(Icons.Default.Assessment, contentDescription = "Reports", tint = ResQTextSecondary) },
                    label = { Text("Reports", color = ResQTextSecondary, fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate(Screen.Settings.route) },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings", tint = ResQTextSecondary) },
                    label = { Text("Settings", color = ResQTextSecondary, fontSize = 11.sp) }
                )
            }
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header: Title & Mesh Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "ResQNet",
                        style = MaterialTheme.typography.headlineMedium,
                        color = ResQTextPrimary
                    )
                    Text(
                        text = "Decentralized Emergency SOS",
                        style = MaterialTheme.typography.bodyMedium,
                        color = ResQTextSecondary
                    )
                }

                Row(
                    modifier = Modifier
                        .background(ResQGreen.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                        .border(1.dp, ResQGreen.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(ResQGreen, CircleShape)
                    )
                    Text(
                        text = "MESH ACTIVE",
                        color = ResQGreen,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 0.5.sp
                    )
                }
            }

            // RECEIVED MESH EMERGENCY ALERTS CARD
            val receivedVault = remember { com.resqnet.sos.data.local.ReceivedIncidentsVault(context) }
            val receivedPackets = remember { receivedVault.getReceivedPackets() }

            if (receivedPackets.isNotEmpty()) {
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
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = ResQCrimson, modifier = Modifier.size(20.dp))
                            Text(
                                text = "🚨 RECEIVED MESH SOS ALERTS (${receivedPackets.size})",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        receivedPackets.take(3).forEach { pkt ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f)),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 8.dp)
                                    .border(1.dp, ResQCrimson.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text("Victim: ${pkt.user.name}", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                    Text("Blood: ${pkt.user.bloodGroup} • Medical: ${pkt.user.medicalConditions}", color = ResQCyan, fontSize = 11.sp)
                                    Text("GPS: ${pkt.location.latitude}, ${pkt.location.longitude}", color = ResQTextSecondary, fontSize = 10.sp)

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
                            },
                            onTap = {
                                // Instant tap triggers SOS directly
                                navController.navigate(Screen.ActiveSos.route)
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
                            text = if (isHoldingSos) "HOLDING..." else "PRESS OR HOLD",
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
                text = "Hold for 3 seconds or tap for instant mesh distress broadcast",
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
                                text = "Mesh Network Radios",
                                style = MaterialTheme.typography.titleLarge,
                                color = ResQTextPrimary,
                                fontSize = 15.sp
                            )
                        }

                        Text(
                            text = "3 PEERS NEARBY",
                            color = ResQCyan,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        RadioBadge(name = "BLE 5.0", icon = Icons.Default.Bluetooth, status = "ONLINE", color = ResQCyan)
                        RadioBadge(name = "Wi-Fi Direct", icon = Icons.Default.Wifi, status = "ONLINE", color = ResQGreen)
                        RadioBadge(name = "Cloud Server", icon = Icons.Default.CloudQueue, status = "READY", color = ResQBlue)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // =========================================================================
            // QUICK ACTION TILES
            // =========================================================================
            Text(
                text = "Emergency Quick Access",
                style = MaterialTheme.typography.titleLarge,
                color = ResQTextPrimary,
                modifier = Modifier.fillMaxWidth(),
                fontSize = 16.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickTile(
                    title = "Tactical Map",
                    subtitle = "Nearby Incidents",
                    icon = Icons.Default.Map,
                    iconColor = ResQCyan,
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate(Screen.Map.route) }
                )
                QuickTile(
                    title = "Medical Vault",
                    subtitle = "Blood: O+ • Allergies",
                    icon = Icons.Default.MedicalServices,
                    iconColor = ResQCrimson,
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate(Screen.MedicalVault.route) }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickTile(
                    title = "Incident Log",
                    subtitle = "Past Dispatches",
                    icon = Icons.Default.Assessment,
                    iconColor = ResQYellow,
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate(Screen.Reports.route) }
                )
                QuickTile(
                    title = "Emergency Calls",
                    subtitle = "Primary Contact / 112",
                    icon = Icons.Default.Phone,
                    iconColor = ResQGreen,
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate(Screen.ActiveSos.route) }
                )
            }
        }
    }
}

@Composable
fun RadioBadge(name: String, icon: ImageVector, status: String, color: Color) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .background(color.copy(alpha = 0.1f), RoundedCornerShape(10.dp))
            .padding(horizontal = 14.dp, vertical = 8.dp)
    ) {
        Icon(icon, contentDescription = name, tint = color, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.height(4.dp))
        Text(name, color = ResQTextPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Text(status, color = color, fontSize = 9.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
fun QuickTile(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconColor: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = ResQSurface),
        shape = RoundedCornerShape(14.dp),
        modifier = modifier
            .border(1.dp, ResQCardBorder, RoundedCornerShape(14.dp))
            .clickable { onClick() }
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(iconColor.copy(alpha = 0.15f), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = title, tint = iconColor, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(title, style = MaterialTheme.typography.titleLarge, color = ResQTextPrimary, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(2.dp))
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = ResQTextSecondary, fontSize = 11.sp)
        }
    }
}
