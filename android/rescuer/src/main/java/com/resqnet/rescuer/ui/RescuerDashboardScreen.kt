package com.resqnet.rescuer.ui

import android.content.Intent
import android.location.Location
import android.net.Uri
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.rescuer.data.RescuerVault
import com.resqnet.rescuer.data.ThemePreferences
import com.resqnet.rescuer.services.RescuerBleScanner
import com.resqnet.rescuer.theme.*
import com.resqnet.rescuer.ui.components.SlidingBottomNavBar
import com.resqnet.rescuer.ui.components.SubtleMeteorShowerBackground
import com.resqnet.sos.services.hardware.AndroidLocationService
import com.resqnet.sos.services.hardware.AudioVoiceNoteRecorder
import kotlinx.coroutines.delay
import java.io.File
import java.net.URLEncoder

@Composable
fun RescuerDashboardScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val vault = remember { RescuerVault(context) }
    val themePrefs = remember { ThemePreferences.getInstance(context) }
    val isDarkMode by themePrefs.isDarkMode.collectAsState()

    val locationService = remember { AndroidLocationService(context) }
    val responderCoords = remember { locationService.getCachedLocation() }

    var victimRecords by remember { mutableStateOf(vault.getAllVictimRecords()) }
    var selectedFilter by remember { mutableStateOf("ALL") }

    val isScanning by RescuerBleScanner.isScanning.collectAsState()

    LaunchedEffect(Unit) {
        while (true) {
            victimRecords = vault.getAllVictimRecords()
            delay(1000)
        }
    }

    val filteredRecords = remember(victimRecords, selectedFilter) {
        when (selectedFilter) {
            "CRITICAL" -> victimRecords.filter { it.triageStatus == "PENDING" || it.packet.incident.severity == "CRITICAL" }
            "RESCUING" -> victimRecords.filter { it.triageStatus == "RESCUING" || it.triageStatus == "DISPATCHED" }
            "RESCUED" -> victimRecords.filter { it.triageStatus == "RESCUED" || it.triageStatus == "EVACUATED" }
            else -> victimRecords
        }
    }

    Scaffold(
        containerColor = ResQBackground,
        bottomBar = {
            SlidingBottomNavBar(
                selectedRoute = "dashboard",
                navController = navController
            )
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize()) {
            SubtleMeteorShowerBackground()

            Column(
                modifier = modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 16.dp)
            ) {
                // =========================================================================
                // RESCUER HEADER BANNER WITH THEME TOGGLE
                // =========================================================================
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "ResQNet Rescuer",
                            style = MaterialTheme.typography.headlineMedium,
                            color = ResQTextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 21.sp
                        )
                        Text(
                            text = "First Responder Tactical Triage Unit",
                            style = MaterialTheme.typography.bodyMedium,
                            color = ResQTextSecondary,
                            fontSize = 12.sp
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Scanner Status Chip
                        Row(
                            modifier = Modifier
                                .background(if (isScanning) ResQGreen.copy(alpha = 0.15f) else ResQCrimson.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                .border(1.dp, if (isScanning) ResQGreen.copy(alpha = 0.3f) else ResQCrimson.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 8.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Box(modifier = Modifier.size(7.dp).background(if (isScanning) ResQGreen else ResQCrimson, CircleShape))
                            Text(
                                text = if (isScanning) "SCANNING" else "IDLE",
                                color = if (isScanning) ResQGreen else ResQCrimson,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // Theme Mode Switch Button
                        IconButton(
                            onClick = { themePrefs.setDarkMode(!isDarkMode) },
                            modifier = Modifier
                                .size(34.dp)
                                .background(ResQSurface, CircleShape)
                                .border(1.dp, ResQCardBorder, CircleShape)
                        ) {
                            Icon(
                                imageVector = if (isDarkMode) Icons.Default.DarkMode else Icons.Default.LightMode,
                                contentDescription = "Toggle Theme",
                                tint = ResQCyan,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // =========================================================================
                // RESCUER METRIC COUNTER GRID
                // =========================================================================
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    RescuerMetricCard("Total", "${victimRecords.size}", ResQCyan, Icons.Default.Inbox, Modifier.weight(1f))
                    RescuerMetricCard("Critical", "${victimRecords.count { it.triageStatus == "PENDING" }}", ResQCrimson, Icons.Default.Warning, Modifier.weight(1f))
                    RescuerMetricCard("Progress", "${victimRecords.count { it.triageStatus == "RESCUING" || it.triageStatus == "DISPATCHED" }}", ResQYellow, Icons.Default.RunCircle, Modifier.weight(1f))
                    RescuerMetricCard("Rescued", "${victimRecords.count { it.triageStatus == "RESCUED" || it.triageStatus == "EVACUATED" }}", ResQGreen, Icons.Default.CheckCircle, Modifier.weight(1f))
                }

                Spacer(modifier = Modifier.height(16.dp))

                // =========================================================================
                // TRIAGE FILTER CHIPS
                // =========================================================================
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(selected = selectedFilter == "ALL", onClick = { selectedFilter = "ALL" }, label = { Text("ALL (${victimRecords.size})") })
                    FilterChip(selected = selectedFilter == "CRITICAL", onClick = { selectedFilter = "CRITICAL" }, label = { Text("CRITICAL 🔴") })
                    FilterChip(selected = selectedFilter == "RESCUING", onClick = { selectedFilter = "RESCUING" }, label = { Text("IN PROGRESS 🟡") })
                    FilterChip(selected = selectedFilter == "RESCUED", onClick = { selectedFilter = "RESCUED" }, label = { Text("RESCUED 🟢") })
                }

                Spacer(modifier = Modifier.height(16.dp))

                // =========================================================================
                // INGESTED VICTIM DISPATCH CARDS WITH DELETE OPTION
                // =========================================================================
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Victim Dispatches (${filteredRecords.size})",
                        style = MaterialTheme.typography.titleLarge,
                        color = ResQTextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )

                    if (victimRecords.isNotEmpty()) {
                        TextButton(
                            onClick = {
                                vault.clearAllRecords()
                                victimRecords = vault.getAllVictimRecords()
                            }
                        ) {
                            Text("Clear All", color = ResQCrimson, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (filteredRecords.isEmpty()) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ResQSurface),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, ResQCardBorder, RoundedCornerShape(14.dp))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("No victim beacons ingested yet.", color = ResQTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "When nearby victims trigger SOS over Bluetooth or Wi-Fi mesh, high-gain rescuer scanner will automatically ingest their medical dossiers here.",
                                color = ResQTextSecondary,
                                fontSize = 11.5.sp,
                                lineHeight = 15.sp
                            )
                        }
                    }
                } else {
                    filteredRecords.forEach { record ->
                        val pkt = record.packet
                        val results = FloatArray(1)
                        Location.distanceBetween(
                            responderCoords.latitude, responderCoords.longitude,
                            pkt.location.latitude, pkt.location.longitude,
                            results
                        )
                        val distanceMeters = results[0].toInt()

                        Card(
                            colors = CardDefaults.cardColors(containerColor = ResQSurface),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp)
                                .border(
                                    1.5.dp,
                                    when (record.triageStatus) {
                                        "RESCUED", "EVACUATED" -> ResQGreen
                                        "RESCUING", "DISPATCHED" -> ResQYellow
                                        else -> ResQCrimson
                                    },
                                    RoundedCornerShape(14.dp)
                                )
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(28.dp)
                                                .background(
                                                    when (record.triageStatus) {
                                                        "RESCUED", "EVACUATED" -> ResQGreen
                                                        "RESCUING", "DISPATCHED" -> ResQYellow
                                                        else -> ResQCrimson
                                                    },
                                                    CircleShape
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(Icons.Default.LocalHospital, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                        }

                                        Column {
                                            Text(pkt.user.name, color = ResQTextPrimary, fontSize = 14.5.sp, fontWeight = FontWeight.Bold)
                                            Text("ID: ${pkt.header.packetId}", color = ResQCyan, fontSize = 10.5.sp, fontFamily = FontFamily.Monospace)
                                        }
                                    }

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        StatusDropdownChip(
                                            currentStatus = record.triageStatus,
                                            onStatusChange = { newStatus ->
                                                vault.updateTriageStatus(pkt.header.packetId, newStatus)
                                                victimRecords = vault.getAllVictimRecords()
                                            }
                                        )

                                        IconButton(
                                            onClick = {
                                                vault.deleteVictimRecord(pkt.header.packetId)
                                                victimRecords = vault.getAllVictimRecords()
                                            },
                                            modifier = Modifier.size(28.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Delete,
                                                contentDescription = "Delete SOS",
                                                tint = ResQTextSecondary,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Text(
                                    text = "Blood: ${pkt.user.bloodGroup}  •  Age: ${pkt.user.age}  •  Distance: ~${distanceMeters}m away",
                                    color = ResQCyan,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )

                                if (pkt.user.medicalConditions.isNotBlank()) {
                                    Text("Medical: ${pkt.user.medicalConditions}", color = ResQTextSecondary, fontSize = 11.5.sp)
                                }

                                Text("Est Pos: ${pkt.location.latitude}, ${pkt.location.longitude}", color = Color.White, fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)

                                if (pkt.location.lastConfirmedLat != null && pkt.location.lastConfirmedLat != 0.0) {
                                    Text("Last GPS: ${pkt.location.lastConfirmedLat}, ${pkt.location.lastConfirmedLng}", color = ResQGreen, fontSize = 10.5.sp, fontFamily = FontFamily.Monospace)
                                }

                                if (pkt.location.stepCountSinceOffline > 0) {
                                    Text("PDR Vector: ${pkt.location.stepCountSinceOffline} steps (${pkt.location.headingAzimuthDeg.toInt()}°) • Drift: ±${pkt.location.driftRadiusMeters.toInt()}m", color = ResQYellow, fontSize = 10.5.sp, fontWeight = FontWeight.Bold)
                                }

                                if (pkt.incident.hasVoiceNote && !pkt.incident.voiceNoteBase64.isNullOrEmpty()) {
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Button(
                                        onClick = {
                                            try {
                                                val cachedAudio = File(context.cacheDir, "voice_${pkt.header.packetId}.aac")
                                                if (cachedAudio.exists() && cachedAudio.length() > 0) {
                                                    val player = AudioVoiceNoteRecorder(context)
                                                    player.playVoiceNote(cachedAudio)
                                                } else {
                                                    AudioVoiceNoteRecorder.playBase64Audio(context, pkt.incident.voiceNoteBase64)
                                                }
                                            } catch (e: Exception) {
                                                e.printStackTrace()
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = ResQYellow),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(Icons.Default.VolumeUp, contentDescription = null, tint = Color.Black, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Play Victim Voice Note (${pkt.incident.voiceNoteDurationSec}s)", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = {
                                            val mapUri = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${pkt.location.latitude},${pkt.location.longitude}")
                                            context.startActivity(Intent(Intent.ACTION_VIEW, mapUri))
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = ResQBlue),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(Icons.Default.Navigation, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Navigate", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }

                                    OutlinedButton(
                                        onClick = {
                                            val encodedId = URLEncoder.encode(pkt.header.packetId, "UTF-8")
                                            navController.navigate("victim_detail/$encodedId")
                                        },
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = ResQCyan),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(Icons.Default.Visibility, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Details", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RescuerMetricCard(title: String, value: String, color: Color, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(
        colors = CardDefaults.cardColors(containerColor = ResQSurface),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.border(1.5.dp, ResQCardBorder, RoundedCornerShape(12.dp))
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = title, tint = color, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, color = color, fontSize = 15.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
            Text(title, color = ResQTextSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun StatusDropdownChip(currentStatus: String, onStatusChange: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }

    Box {
        Surface(
            color = when (currentStatus) {
                "RESCUED", "EVACUATED" -> ResQGreen.copy(alpha = 0.2f)
                "RESCUING", "DISPATCHED" -> ResQYellow.copy(alpha = 0.2f)
                else -> ResQCrimson.copy(alpha = 0.2f)
            },
            shape = RoundedCornerShape(6.dp),
            modifier = Modifier.clickable { expanded = true }
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = currentStatus,
                    color = when (currentStatus) {
                        "RESCUED", "EVACUATED" -> ResQGreen
                        "RESCUING", "DISPATCHED" -> ResQYellow
                        else -> ResQCrimson
                    },
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black
                )
                Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = ResQTextPrimary, modifier = Modifier.size(14.dp))
            }
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.background(ResQSurface)
        ) {
            DropdownMenuItem(text = { Text("PENDING 🔴", color = ResQCrimson, fontSize = 11.sp, fontWeight = FontWeight.Bold) }, onClick = { onStatusChange("PENDING"); expanded = false })
            DropdownMenuItem(text = { Text("DISPATCHED 🟡", color = ResQYellow, fontSize = 11.sp, fontWeight = FontWeight.Bold) }, onClick = { onStatusChange("DISPATCHED"); expanded = false })
            DropdownMenuItem(text = { Text("RESCUING 🟡", color = ResQYellow, fontSize = 11.sp, fontWeight = FontWeight.Bold) }, onClick = { onStatusChange("RESCUING"); expanded = false })
            DropdownMenuItem(text = { Text("RESCUED 🟢", color = ResQGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold) }, onClick = { onStatusChange("RESCUED"); expanded = false })
        }
    }
}
