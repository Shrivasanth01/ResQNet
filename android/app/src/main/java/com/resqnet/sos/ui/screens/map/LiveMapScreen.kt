package com.resqnet.sos.ui.screens.map

import android.widget.Toast
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.data.local.RsepStorageManager
import com.resqnet.sos.services.hardware.AndroidLocationService
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.navigation.Screen

data class IncidentDisplay(
    val id: String,
    val title: String,
    val severity: String,
    val distance: String,
    val time: String,
    val latitude: Double,
    val longitude: Double
)

@Composable
fun LiveMapScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val locationService = remember { AndroidLocationService(context) }
    val storageManager = remember { RsepStorageManager(context) }
    val coords = remember { locationService.getCachedLocation() }

    var showOfflineBanner by remember { mutableStateOf(true) }

    val mockIncidents = remember {
        listOf(
            IncidentDisplay(
                id = "RQ-PKT-1A04607E3D5",
                title = "Manual SOS Distress (Siva Ajish Ram R)",
                severity = "CRITICAL",
                distance = "Mesh Hop (< 300m)",
                time = "2 mins ago",
                latitude = coords.latitude,
                longitude = coords.longitude
            ),
            IncidentDisplay(
                id = "RQ-PKT-8D883F12DA02",
                title = "Medical Distress Alert (Citizen)",
                severity = "CRITICAL",
                distance = "Mesh Hop (< 800m)",
                time = "5 mins ago",
                latitude = coords.latitude + 0.002,
                longitude = coords.longitude + 0.003
            )
        )
    }

    Scaffold(
        containerColor = ResQBackground,
        bottomBar = {
            NavigationBar(containerColor = ResQSurface, tonalElevation = 8.dp) {
                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate(Screen.Dashboard.route) },
                    icon = { Icon(Icons.Default.Home, contentDescription = null, tint = ResQTextSecondary) },
                    label = { Text("Home", color = ResQTextSecondary, fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = true,
                    onClick = { },
                    icon = { Icon(Icons.Default.Map, contentDescription = null, tint = ResQCyan) },
                    label = { Text("Map", color = ResQCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate(Screen.Reports.route) },
                    icon = { Icon(Icons.Default.Assessment, contentDescription = null, tint = ResQTextSecondary) },
                    label = { Text("Reports", color = ResQTextSecondary, fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate(Screen.Settings.route) },
                    icon = { Icon(Icons.Default.Settings, contentDescription = null, tint = ResQTextSecondary) },
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
                .padding(horizontal = 16.dp, vertical = 16.dp)
        ) {
            Text(
                text = "Tactical Emergency Map",
                style = MaterialTheme.typography.headlineMedium,
                color = ResQTextPrimary
            )
            Text(
                text = "Live distress signals received via offline P2P mesh relay",
                style = MaterialTheme.typography.bodyMedium,
                color = ResQTextSecondary
            )

            Spacer(modifier = Modifier.height(16.dp))

            // =========================================================================
            // GPS TELEMETRY RADAR BANNER
            // =========================================================================
            Card(
                colors = CardDefaults.cardColors(containerColor = ResQSurface),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, ResQCardBorder, RoundedCornerShape(14.dp))
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(ResQCyan.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.MyLocation, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(22.dp))
                    }

                    Column {
                        Text(
                            text = "Live GPS Telemetry",
                            style = MaterialTheme.typography.titleLarge,
                            color = ResQTextPrimary,
                            fontSize = 14.sp
                        )
                        Text(
                            text = "Lat: ${String.format("%.5f", coords.latitude)}° N  •  Long: ${String.format("%.5f", coords.longitude)}° E",
                            color = ResQCyan,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // =========================================================================
            // INCOMING OFFLINE RSEP FILE ALERT BANNER
            // =========================================================================
            if (showOfflineBanner) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF07172C)),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(2.dp, ResQCyan, RoundedCornerShape(16.dp))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .background(ResQCyan.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                    .border(1.dp, ResQCyan.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(Icons.Default.BluetoothAudio, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(14.dp))
                                    Text(
                                        text = "OFFLINE BLUETOOTH / WI-FI RECEPTION",
                                        color = ResQCyan,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                            }

                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Dismiss",
                                tint = ResQTextSecondary,
                                modifier = Modifier
                                    .size(18.dp)
                                    .clickable { showOfflineBanner = false }
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "🚨 Incoming Emergency Distress File Received",
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                                .padding(10.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Victim:", color = ResQTextSecondary, fontSize = 11.sp)
                                Text("Siva Ajish Ram R", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Blood Group:", color = ResQTextSecondary, fontSize = 11.sp)
                                Text("O+", color = ResQCrimson, fontSize = 11.sp, fontWeight = FontWeight.Black)
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Coordinates:", color = ResQTextSecondary, fontSize = 11.sp)
                                Text("${coords.latitude}, ${coords.longitude}", color = Color.White, fontSize = 11.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = {
                                val rsep = storageManager.getExistingRsep()
                                val jsonStr = storageManager.exportRsepJson(rsep)
                                Toast.makeText(context, "Downloaded .rsep file (${jsonStr.toByteArray().size} bytes) to vault!", Toast.LENGTH_LONG).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ResQBlue),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Download .rsep File", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
            }

            // =========================================================================
            // SURROUNDING ACTIVE EMERGENCIES LIST
            // =========================================================================
            Text(
                text = "Surrounding Active Emergencies (${mockIncidents.size})",
                style = MaterialTheme.typography.titleLarge,
                color = ResQTextPrimary,
                fontSize = 16.sp
            )

            Spacer(modifier = Modifier.height(10.dp))

            mockIncidents.forEach { inc ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = ResQSurface),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 10.dp)
                        .border(1.dp, ResQCrimson.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(ResQCrimson.copy(alpha = 0.2f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.LocalHospital, contentDescription = null, tint = ResQCrimson, modifier = Modifier.size(22.dp))
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("MEDICAL", color = ResQCrimson, fontSize = 10.sp, fontWeight = FontWeight.Black)
                                Text(inc.distance, color = ResQTextSecondary, fontSize = 10.sp)
                            }
                            Text(inc.title, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Text("ID: ${inc.id}", color = ResQTextMuted, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            }
        }
    }
}
