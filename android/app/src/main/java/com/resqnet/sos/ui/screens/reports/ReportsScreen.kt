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
import com.resqnet.sos.data.local.SentIncidentsVault
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.components.SlidingBottomNavBar
import com.resqnet.sos.ui.components.SubtleMeteorShowerBackground
import com.resqnet.sos.ui.navigation.Screen
import kotlinx.coroutines.delay

@Composable
fun ReportsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val receivedVault = remember { ReceivedIncidentsVault(context) }
    val sentVault = remember { SentIncidentsVault(context) }

    var receivedPacketsList by remember { mutableStateOf(receivedVault.getReceivedPackets()) }
    var sentDispatchesList by remember { mutableStateOf(sentVault.getSentDispatches()) }

    // Real-time auto refresh for received mesh alerts & sent dispatches
    LaunchedEffect(Unit) {
        while (true) {
            receivedPacketsList = receivedVault.getReceivedPackets()
            sentDispatchesList = sentVault.getSentDispatches()
            delay(1000)
        }
    }

    Scaffold(
        containerColor = ResQBackground,
        bottomBar = {
            SlidingBottomNavBar(
                selectedRoute = Screen.Reports.route,
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
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 18.dp, vertical = 18.dp)
            ) {
                Text(
                    text = "Incident History & Mesh Vault",
                    style = MaterialTheme.typography.headlineMedium,
                    color = ResQTextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 21.sp
                )
                Text(
                    text = "Audit trail of received SOS incidents and local broadcasts",
                    style = MaterialTheme.typography.bodyMedium,
                    color = ResQTextSecondary,
                    fontSize = 12.sp
                )

                Spacer(modifier = Modifier.height(20.dp))

                // RECEIVED MESH INCIDENTS SECTION WITH CLEAR BUTTON
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
                                .width(4.dp)
                                .height(18.dp)
                                .background(ResQCyan, RoundedCornerShape(2.dp))
                        )
                        Text(
                            text = "Received Mesh Incidents (${receivedPacketsList.size})",
                            color = ResQTextPrimary,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (receivedPacketsList.isNotEmpty()) {
                        TextButton(
                            onClick = {
                                receivedVault.clearReceivedPackets()
                                receivedPacketsList = emptyList()
                            }
                        ) {
                            Text("Clear History", color = ResQCrimson, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (receivedPacketsList.isEmpty()) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ResQSurface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                            .border(1.5.dp, ResQCardBorder, RoundedCornerShape(16.dp))
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                text = "No received peer incidents yet.",
                                color = ResQTextPrimary,
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "When nearby victim devices broadcast SOS over Bluetooth or Wi-Fi Direct, received dossiers will automatically appear here.",
                                color = ResQTextSecondary,
                                fontSize = 11.5.sp,
                                lineHeight = 16.sp
                            )
                        }
                    }
                } else {
                    receivedPacketsList.forEach { pkt ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF230D11)),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 14.dp)
                                .border(1.5.dp, ResQCrimson, RoundedCornerShape(16.dp))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(34.dp)
                                            .background(ResQCrimson, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Default.Warning, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                                    }

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(pkt.user.name, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                        Text("Packet ID: ${pkt.header.packetId}", color = ResQCyan, fontSize = 11.5.sp, fontFamily = FontFamily.Monospace)
                                    }

                                    IconButton(
                                        onClick = {
                                            receivedVault.deleteReceivedPacket(pkt.header.packetId)
                                            receivedPacketsList = receivedVault.getReceivedPackets()
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = "Delete Incident", tint = ResQTextSecondary, modifier = Modifier.size(20.dp))
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                val physicalInfo = listOfNotNull(
                                    if (pkt.user.gender.isNotBlank()) "Gender: ${pkt.user.gender}" else null,
                                    if (pkt.user.age.isNotBlank()) "Age: ${pkt.user.age} yrs" else null,
                                    if (pkt.user.height.isNotBlank()) "Ht: ${pkt.user.height}cm" else null,
                                    if (pkt.user.weight.isNotBlank()) "Wt: ${pkt.user.weight}kg" else null
                                ).joinToString(" • ")

                                if (physicalInfo.isNotBlank()) {
                                    Text(physicalInfo, color = ResQTextPrimary, fontSize = 12.5.sp, fontWeight = FontWeight.Bold)
                                }
                                Text("Blood Group: ${pkt.user.bloodGroup}", color = ResQCyan, fontSize = 12.5.sp, fontWeight = FontWeight.Bold)
                                Text("Medical Conditions: ${pkt.user.medicalConditions}", color = ResQTextSecondary, fontSize = 11.5.sp)
                                Text("Live GPS: ${pkt.location.latitude}, ${pkt.location.longitude}", color = ResQTextSecondary, fontSize = 11.sp, fontFamily = FontFamily.Monospace)

                                Spacer(modifier = Modifier.height(14.dp))

                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Button(
                                        onClick = {
                                            val mapUri = Uri.parse("https://www.google.com/maps?q=${pkt.location.latitude},${pkt.location.longitude}")
                                            context.startActivity(Intent(Intent.ACTION_VIEW, mapUri))
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = ResQBlue),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("Google Maps", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
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
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Text("Call Contact", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // PAST DISPATCHES SECTION WITH CLEAR BUTTON
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
                                .width(4.dp)
                                .height(18.dp)
                                .background(ResQGreen, RoundedCornerShape(2.dp))
                        )
                        Text(
                            text = "My Sent SOS Dispatches (${sentDispatchesList.size})",
                            color = ResQTextPrimary,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (sentDispatchesList.isNotEmpty()) {
                        TextButton(
                            onClick = {
                                sentVault.clearSentDispatches()
                                sentDispatchesList = emptyList()
                            }
                        ) {
                            Text("Clear Sent Log", color = ResQCrimson, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (sentDispatchesList.isEmpty()) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ResQSurface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, ResQCardBorder, RoundedCornerShape(16.dp))
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text(
                                text = "No sent SOS dispatches recorded yet.",
                                color = ResQTextPrimary,
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "When you hold the SOS button or activate emergency distress, your outgoing broadcast log will be archived here.",
                                color = ResQTextSecondary,
                                fontSize = 11.5.sp,
                                lineHeight = 16.sp
                            )
                        }
                    }
                } else {
                    sentDispatchesList.forEach { record ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ResQSurface),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp)
                                .border(1.5.dp, ResQCardBorder, RoundedCornerShape(16.dp))
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .background(ResQGreen.copy(alpha = 0.15f), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ResQGreen, modifier = Modifier.size(20.dp))
                                }

                                Column {
                                    Text("Emergency SOS Distress Broadcast", color = ResQTextPrimary, fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
                                    Text("ID: ${record.packetId}", color = ResQCyan, fontSize = 11.5.sp, fontFamily = FontFamily.Monospace)
                                    Text(record.status, color = ResQGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
