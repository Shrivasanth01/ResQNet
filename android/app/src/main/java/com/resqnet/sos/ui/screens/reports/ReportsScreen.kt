package com.resqnet.sos.ui.screens.reports

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
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.navigation.Screen

@Composable
fun ReportsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
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
                text = "Incident History",
                style = MaterialTheme.typography.headlineMedium,
                color = ResQTextPrimary
            )
            Text(
                text = "Audit trail of emergency broadcasts from this device",
                style = MaterialTheme.typography.bodyMedium,
                color = ResQTextSecondary
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Past Dispatches
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
