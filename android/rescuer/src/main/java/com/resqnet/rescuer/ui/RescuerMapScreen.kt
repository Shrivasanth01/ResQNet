package com.resqnet.rescuer.ui

import android.content.Intent
import android.location.Location
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import com.resqnet.rescuer.data.RescuerVault
import com.resqnet.rescuer.theme.*
import com.resqnet.rescuer.ui.components.SlidingBottomNavBar
import com.resqnet.rescuer.ui.components.SubtleMeteorShowerBackground
import com.resqnet.sos.services.hardware.AndroidLocationService

@Composable
fun RescuerMapScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val vault = remember { RescuerVault(context) }
    val locationService = remember { AndroidLocationService(context) }
    val responderCoords = remember { locationService.getCachedLocation() }

    val victimRecords by remember { mutableStateOf(vault.getAllVictimRecords()) }

    Scaffold(
        containerColor = ResQBackground,
        bottomBar = {
            SlidingBottomNavBar(
                selectedRoute = "map",
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
                Text(
                    text = "Rescuer Tactical Radar",
                    style = MaterialTheme.typography.headlineMedium,
                    color = ResQTextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 21.sp
                )
                Text(
                    text = "Live GPS radar vectoring responder team to active victim beacons",
                    style = MaterialTheme.typography.bodyMedium,
                    color = ResQTextSecondary,
                    fontSize = 12.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Responder Live Location Radar Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = ResQSurface),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.5.dp, ResQCardBorder, RoundedCornerShape(14.dp))
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
                            Icon(Icons.Default.Navigation, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(22.dp))
                        }

                        Column {
                            Text("Responder Unit GPS Position", color = ResQTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text(
                                text = "Lat: ${String.format("%.5f", responderCoords.latitude)}° N  •  Long: ${String.format("%.5f", responderCoords.longitude)}° E",
                                color = ResQCyan,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Ingested Victim Targets (${victimRecords.size})",
                    style = MaterialTheme.typography.titleLarge,
                    color = ResQTextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                if (victimRecords.isEmpty()) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ResQSurface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, ResQCardBorder, RoundedCornerShape(12.dp))
                    ) {
                        Text("No victim GPS markers active.", color = ResQTextSecondary, fontSize = 12.sp, modifier = Modifier.padding(14.dp))
                    }
                } else {
                    victimRecords.forEach { record ->
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
                                .padding(bottom = 10.dp)
                                .border(1.5.dp, ResQCyan.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .background(ResQCrimson.copy(alpha = 0.2f), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Place, contentDescription = null, tint = ResQCrimson, modifier = Modifier.size(20.dp))
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(pkt.user.name, color = ResQTextPrimary, fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
                                    Text("Distance: ~${distanceMeters}m away", color = ResQCyan, fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                                    Text("GPS: ${pkt.location.latitude}, ${pkt.location.longitude}", color = ResQTextSecondary, fontSize = 10.5.sp, fontFamily = FontFamily.Monospace)
                                }

                                IconButton(
                                    onClick = {
                                        val mapUri = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${pkt.location.latitude},${pkt.location.longitude}")
                                        context.startActivity(Intent(Intent.ACTION_VIEW, mapUri))
                                    }
                                ) {
                                    Icon(Icons.Default.Navigation, contentDescription = "Navigate", tint = ResQBlue)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
