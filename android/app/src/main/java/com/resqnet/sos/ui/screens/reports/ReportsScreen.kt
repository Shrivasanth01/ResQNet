package com.resqnet.sos.ui.screens.reports

import android.content.Intent
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
import com.resqnet.sos.data.local.ReceivedIncidentsVault
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.navigation.Screen

@Composable
fun ReportsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val receivedVault = remember { ReceivedIncidentsVault(context) }
    val receivedPackets = remember { receivedVault.getReceivedPackets() }

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
                    selected = false,
                    onClick = { navController.navigate(Screen.Map.route) },
                    icon = { Icon(Icons.Default.Map, contentDescription = null, tint = ResQTextSecondary) },
                    label = { Text("Map", color = ResQTextSecondary, fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = true,
                    onClick = { },
                    icon = { Icon(Icons.Default.Assessment, contentDescription = null, tint = ResQCyan) },
                    label = { Text("Reports", color = ResQCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
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
                text = "Incident History & Mesh Vault",
                style = MaterialTheme.typography.headlineMedium,
                color = ResQTextPrimary
            )
            Text(
                text = "Audit trail of received SOS incidents and local broadcasts",
                style = MaterialTheme.typography.bodyMedium,
                color = ResQTextSecondary
            )

            Spacer(modifier = Modifier.height(16.dp))

            // RECEIVED MESH INCIDENTS SECTION
            Text(
                text = "Received Mesh Peer Incidents (${receivedPackets.size})",
                color = ResQCyan,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (receivedPackets.isEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = ResQSurface),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                        .border(1.dp, ResQCardBorder, RoundedCornerShape(12.dp))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "No received peer incidents yet.",
                            color = ResQTextSecondary,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "When nearby victim devices broadcast SOS over Bluetooth or Wi-Fi Direct, received dossiers will automatically appear here.",
                            color = ResQTextMuted,
                            fontSize = 11.sp,
                            lineHeight = 15.sp
                        )
                    }
                }
            } else {
                receivedPackets.forEach { pkt ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E0B0B)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                            .border(1.dp, ResQCrimson.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .background(ResQCrimson, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Warning, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(pkt.user.name, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    Text("Packet ID: ${pkt.header.packetId}", color = ResQCyan, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                                }

                                Box(
                                    modifier = Modifier
                                        .background(ResQCrimson.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text("CRITICAL", color = ResQCrimson, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Text("Blood Group: ${pkt.user.bloodGroup}", color = ResQTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Text("Medical Conditions: ${pkt.user.medicalConditions}", color = ResQTextSecondary, fontSize = 11.sp)
                            Text("Live GPS: ${pkt.location.latitude}, ${pkt.location.longitude}", color = ResQCyan, fontSize = 11.sp, fontFamily = FontFamily.Monospace)

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        val mapUri = Uri.parse("https://www.google.com/maps?q=${pkt.location.latitude},${pkt.location.longitude}")
                                        context.startActivity(Intent(Intent.ACTION_VIEW, mapUri))
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = ResQBlue),
                                    shape = RoundedCornerShape(6.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Google Maps", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }

                                val contact = pkt.user.emergencyContacts.firstOrNull()
                                if (contact != null) {
                                    Button(
                                        onClick = {
                                            val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                                                data = Uri.parse("tel:${contact.phoneNumber}")
                                            }
                                            context.startActivity(dialIntent)
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = ResQGreen),
                                        shape = RoundedCornerShape(6.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("Call Contact", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // PAST DISPATCHES SECTION
            Text(
                text = "My Sent SOS Dispatches",
                color = ResQTextPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            val pastDispatches = listOf(
                Pair("RQ-PKT-1A04607E3D5", "Delivered via Gateway Node"),
                Pair("RQ-PKT-FE258212DA02", "Delivered via BLE Mesh")
            )

            pastDispatches.forEach { (id, status) ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = ResQSurface),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                        .border(1.dp, ResQCardBorder, RoundedCornerShape(14.dp))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(ResQGreen.copy(alpha = 0.15f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ResQGreen, modifier = Modifier.size(20.dp))
                        }

                        Column {
                            Text("Manual 3-Second SOS Distress", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Text("ID: $id", color = ResQCyan, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                            Text(status, color = ResQGreen, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
