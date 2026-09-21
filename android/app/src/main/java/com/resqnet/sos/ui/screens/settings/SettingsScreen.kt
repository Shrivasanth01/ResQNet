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
import com.resqnet.sos.data.local.ThemePreferences
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.components.SlidingBottomNavBar
import com.resqnet.sos.ui.components.SubtleMeteorShowerBackground
import com.resqnet.sos.ui.navigation.Screen

@Composable
fun SettingsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val profilePrefs = remember { ProfilePreferences(context) }
    val themePrefs = remember { ThemePreferences.getInstance(context) }

    val profile = remember { profilePrefs.getProfile() }
    val isDarkMode by themePrefs.isDarkMode.collectAsState()
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
                    color = ResQTextPrimary,
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
            SlidingBottomNavBar(
                selectedRoute = Screen.Settings.route,
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
                    text = "Settings & Vault",
                    style = MaterialTheme.typography.headlineMedium,
                    color = ResQTextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 21.sp
                )
                Text(
                    text = "Manage your emergency profile, medical vault and account",
                    style = MaterialTheme.typography.bodyMedium,
                    color = ResQTextSecondary,
                    fontSize = 12.sp
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Profile Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = ResQSurface),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.5.dp, ResQCardBorder, RoundedCornerShape(16.dp))
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
                            Text(profile.fullName, color = ResQTextPrimary, fontSize = 15.5.sp, fontWeight = FontWeight.Bold)
                            Text(profile.email, color = ResQTextSecondary, fontSize = 12.sp)
                            Text("Blood Group: ${profile.bloodGroup} • Age: ${profile.age}", color = ResQCyan, fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // APPEARANCE & THEME SECTION
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .width(4.dp)
                            .height(18.dp)
                            .background(ResQPurple, RoundedCornerShape(2.dp))
                    )
                    Text(
                        text = "App Theme & Interface",
                        color = ResQTextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Theme Toggle Switch Row
                Card(
                    colors = CardDefaults.cardColors(containerColor = ResQSurface),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.5.dp, ResQCardBorder, RoundedCornerShape(16.dp))
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(14.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(ResQPurple.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (isDarkMode) Icons.Default.DarkMode else Icons.Default.LightMode,
                                    contentDescription = null,
                                    tint = ResQPurple,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Column {
                                Text(
                                    text = if (isDarkMode) "Dark Theme Active" else "Light Theme Active",
                                    color = ResQTextPrimary,
                                    fontSize = 14.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = if (isDarkMode) "High-contrast matte dark charcoal" else "Clean crisp slate off-white",
                                    color = ResQTextSecondary,
                                    fontSize = 11.5.sp
                                )
                            }
                        }

                        Switch(
                            checked = isDarkMode,
                            onCheckedChange = { themePrefs.setDarkMode(it) },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = ResQPurple,
                                uncheckedThumbColor = Color.White,
                                uncheckedTrackColor = ResQCardBorder
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

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
                        text = "Vault & Radios",
                        color = ResQTextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

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
                    onClick = { navController.navigate(Screen.EmergencyContacts.route) }
                )

                Spacer(modifier = Modifier.height(10.dp))

                SettingsRow(
                    title = "Offline Mesh Radios",
                    subtitle = "BLE 5.0 GATT & Wi-Fi Direct Peer Relay",
                    icon = Icons.Default.Bluetooth,
                    iconColor = ResQBlue,
                    onClick = { navController.navigate(Screen.MeshStatus.route) }
                )

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .width(4.dp)
                            .height(18.dp)
                            .background(ResQCrimson, RoundedCornerShape(2.dp))
                    )
                    Text(
                        text = "Account Session",
                        color = ResQTextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

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
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.5.dp, ResQCardBorder, RoundedCornerShape(16.dp))
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(iconColor.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(20.dp))
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(title, color = ResQTextPrimary, fontSize = 14.5.sp, fontWeight = FontWeight.Bold)
                Text(subtitle, color = ResQTextSecondary, fontSize = 11.5.sp)
            }

            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = ResQTextSecondary)
        }
    }
}
