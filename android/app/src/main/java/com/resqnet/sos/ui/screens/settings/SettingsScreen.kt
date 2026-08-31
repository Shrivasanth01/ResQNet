package com.resqnet.sos.ui.screens.settings

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
import androidx.compose.material.icons.automirrored.filled.ExitToApp
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
    var showLogoutDialog by remember { mutableStateOf(false) }

    fun performLogout() {
        profilePrefs.logout()
        Toast.makeText(context, "Logged out successfully.", Toast.LENGTH_SHORT).show()
        navController.navigate(Screen.Login.route) {
            popUpTo(0) { inclusive = true }
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = ResQSurface,
            title = {
                Text(
                    text = "Sign Out of ResQNet?",
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = "Are you sure you want to log out of ${profile.email}? You will need to sign in with your Gmail address to access your emergency profile again.",
                    color = ResQTextSecondary,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        performLogout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ResQCrimson)
                ) {
                    Text("Log Out", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel", color = ResQTextSecondary)
                }
            }
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
                text = "Manage your emergency profile, medical vault and account",
                style = MaterialTheme.typography.bodyMedium,
                color = ResQTextSecondary
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Profile Card with Sign Out Button
            Card(
                colors = CardDefaults.cardColors(containerColor = ResQSurface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, ResQCardBorder, RoundedCornerShape(16.dp))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .background(ResQCyan.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(28.dp))
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(profile.fullName, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text(profile.email, color = ResQTextSecondary, fontSize = 12.sp)
                        Text("Blood Group: ${profile.bloodGroup} • Age: ${profile.age}", color = ResQCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    IconButton(
                        onClick = { showLogoutDialog = true }
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = "Sign Out",
                            tint = ResQCrimson
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "Vault & Radios",
                color = ResQTextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

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

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Account Session",
                color = ResQTextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Dedicated Logout Button Row
            SettingsRow(
                title = "Log Out of ResQNet",
                subtitle = "Signed in as ${profile.email}",
                icon = Icons.AutoMirrored.Filled.ExitToApp,
                iconColor = ResQCrimson,
                onClick = { showLogoutDialog = true }
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
