package com.resqnet.sos.ui.screens.settings

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.navigation.Screen

@Composable
fun SettingsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val profilePrefs = remember { ProfilePreferences(context) }
    val profile = remember { profilePrefs.getProfile() }

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
                    selected = false,
                    onClick = { navController.navigate(Screen.Reports.route) },
                    icon = { Icon(Icons.Default.Assessment, contentDescription = null, tint = ResQTextSecondary) },
                    label = { Text("Reports", color = ResQTextSecondary, fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = true,
                    onClick = { },
                    icon = { Icon(Icons.Default.Settings, contentDescription = null, tint = ResQCyan) },
                    label = { Text("Settings", color = ResQCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
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
                text = "Settings & Vault",
                style = MaterialTheme.typography.headlineMedium,
                color = ResQTextPrimary
            )
            Text(
                text = "Manage your cryptographic profile and mesh radios",
                style = MaterialTheme.typography.bodyMedium,
                color = ResQTextSecondary
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Profile Card
            Card(
                colors = CardDefaults.cardColors(containerColor = ResQSurface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, ResQCardBorder, RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .background(ResQCyan.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(28.dp))
                    }

                    Column {
                        Text(profile.fullName, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text(profile.email, color = ResQTextSecondary, fontSize = 12.sp)
                        Text("Blood Group: ${profile.bloodGroup} • Age: ${profile.age}", color = ResQCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Settings Items
            SettingsRow(
                title = "Medical Emergency Vault",
                subtitle = "Blood Group, Allergies, Chronic Conditions",
                icon = Icons.Default.MedicalServices,
                iconColor = ResQCrimson,
                onClick = { navController.navigate(Screen.MedicalVault.route) }
            )

            Spacer(modifier = Modifier.height(10.dp))

            SettingsRow(
                title = "Emergency Contacts",
                subtitle = "${profile.emergencyContacts.size} Contacts Registered (Call & SMS)",
                icon = Icons.Default.Phone,
                iconColor = ResQGreen,
                onClick = { }
            )

            Spacer(modifier = Modifier.height(10.dp))

            SettingsRow(
                title = "Offline Mesh Radios",
                subtitle = "BLE 5.0 GATT & Wi-Fi Direct Peer Relay",
                icon = Icons.Default.Bluetooth,
                iconColor = ResQBlue,
                onClick = { }
            )
        }
    }
}

@Composable
fun SettingsRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconColor: Color,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = ResQSurface),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, ResQCardBorder, RoundedCornerShape(12.dp))
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(iconColor.copy(alpha = 0.15f), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(20.dp))
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(title, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Text(subtitle, color = ResQTextSecondary, fontSize = 11.sp)
            }

            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = ResQTextMuted)
        }
    }
}
