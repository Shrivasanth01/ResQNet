package com.resqnet.rescuer.ui

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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.resqnet.rescuer.ui.components.SubtleMeteorShowerBackground

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VictimDetailScreen(
    navController: NavController,
    packetId: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val vault = remember { RescuerVault(context) }
    var victimRecord by remember { mutableStateOf(vault.getVictimRecord(packetId)) }
    var notesText by remember { mutableStateOf(victimRecord?.rescuerNotes ?: "") }

    val pkt = victimRecord?.packet

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Victim Medical Vault & Dossier", color = ResQTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text("ID: $packetId", color = ResQCyan, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ResQTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ResQSurface)
            )
        },
        containerColor = ResQBackground
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
                if (pkt == null) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ResQSurface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Victim record not found.", color = ResQCrimson, fontSize = 14.sp, modifier = Modifier.padding(16.dp))
                    }
                } else {
                    // Header Profile Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ResQSurface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, ResQCyan, RoundedCornerShape(16.dp))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .background(ResQCrimson, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(24.dp))
                                }

                                Column {
                                    Text(pkt.user.name, color = ResQTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
                                    Text("Age: ${pkt.user.age} yrs  •  Gender: ${pkt.user.gender}", color = ResQTextSecondary, fontSize = 12.sp)
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                MedicalBadge("Blood: ${pkt.user.bloodGroup}", ResQCrimson, Modifier.weight(1f))
                                MedicalBadge("Ht: ${pkt.user.height} cm", ResQCyan, Modifier.weight(1f))
                                MedicalBadge("Wt: ${pkt.user.weight} kg", ResQBlue, Modifier.weight(1f))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Medical History Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ResQSurface),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, ResQCardBorder, RoundedCornerShape(14.dp))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Medical Conditions & Vault", color = ResQTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = pkt.user.medicalConditions.ifBlank { "No medical conditions recorded." },
                                color = ResQTextSecondary,
                                fontSize = 12.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Family Emergency Contacts Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ResQSurface),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, ResQCardBorder, RoundedCornerShape(14.dp))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Family Emergency Contacts", color = ResQTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(8.dp))

                            if (pkt.user.emergencyContacts.isEmpty()) {
                                Text("No emergency contact numbers provided.", color = ResQTextSecondary, fontSize = 11.5.sp)
                            } else {
                                pkt.user.emergencyContacts.forEach { contact ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(bottom = 6.dp)
                                            .background(ResQSurfaceVariant, RoundedCornerShape(8.dp))
                                            .padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column {
                                            Text("${contact.name} (${contact.relationship})", color = ResQTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            Text(contact.phoneNumber, color = ResQCyan, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                                        }

                                        Button(
                                            onClick = {
                                                val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                                                    data = Uri.parse("tel:${contact.phoneNumber}")
                                                }
                                                context.startActivity(dialIntent)
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = ResQGreen),
                                            shape = RoundedCornerShape(6.dp)
                                        ) {
                                            Icon(Icons.Default.Call, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Call", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Rescuer Field Notes Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ResQSurface),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, ResQCyan.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Rescuer Dispatch Notes", color = ResQTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(8.dp))

                            OutlinedTextField(
                                value = notesText,
                                onValueChange = { notesText = it },
                                placeholder = { Text("Enter field observations / rescue team status...", color = ResQTextSecondary, fontSize = 12.sp) },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = ResQTextPrimary,
                                    unfocusedTextColor = ResQTextPrimary,
                                    focusedBorderColor = ResQCyan,
                                    unfocusedBorderColor = ResQCardBorder
                                ),
                                modifier = Modifier.fillMaxWidth().height(100.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            Button(
                                onClick = {
                                    vault.updateTriageStatus(packetId, victimRecord?.triageStatus ?: "PENDING", notesText)
                                    victimRecord = vault.getVictimRecord(packetId)
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = ResQCyan),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Save Rescuer Notes", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Button(
                                onClick = {
                                    vault.deleteVictimRecord(packetId)
                                    navController.popBackStack()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = ResQCrimson),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Delete SOS Dossier", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MedicalBadge(text: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
            .border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(text, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}
