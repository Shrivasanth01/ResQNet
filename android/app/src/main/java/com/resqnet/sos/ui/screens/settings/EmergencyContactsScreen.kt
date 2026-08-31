package com.resqnet.sos.ui.screens.settings

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.data.local.RsepStorageManager
import com.resqnet.sos.data.model.EmergencyContact
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.navigation.Screen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmergencyContactsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val profilePrefs = remember { ProfilePreferences(context) }
    val storageManager = remember { RsepStorageManager(context) }
    val initialProfile = remember { profilePrefs.getProfile() }

    var contacts by remember { mutableStateOf(initialProfile.emergencyContacts) }
    var showAddDialog by remember { mutableStateOf(false) }

    var newName by remember { mutableStateOf("") }
    var newPhone by remember { mutableStateOf("") }
    var newRelationship by remember { mutableStateOf("") }

    Scaffold(
        containerColor = ResQBackground,
        topBar = {
            TopAppBar(
                title = { Text("Emergency Contacts", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { 
                        if (contacts.isEmpty()) {
                            Toast.makeText(context, "Please add at least one contact.", Toast.LENGTH_SHORT).show()
                        } else {
                            navController.popBackStack() 
                        }
                    }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = ResQCyan)
                    }
                },
                actions = {
                    TextButton(onClick = {
                        if (contacts.isEmpty()) {
                            Toast.makeText(context, "Add at least one contact to proceed.", Toast.LENGTH_SHORT).show()
                        } else {
                            val updated = initialProfile.copy(emergencyContacts = contacts)
                            profilePrefs.saveProfile(updated)

                            // Update RSEP in vault
                            val rsep = storageManager.getExistingRsep()
                            val updatedRsep = rsep.copy(
                                user = rsep.user.copy(emergencyContacts = contacts)
                            )
                            storageManager.saveRsep(updatedRsep)

                            Toast.makeText(context, "Contacts Saved!", Toast.LENGTH_SHORT).show()
                            
                            // If we came from registration, we might want to go to Dashboard
                            if (navController.previousBackStackEntry?.destination?.route?.contains("verify_otp") == true) {
                                navController.navigate(Screen.Dashboard.route) {
                                    popUpTo(0) { inclusive = true }
                                }
                            } else {
                                navController.popBackStack()
                            }
                        }
                    }) {
                        Text("SAVE", color = ResQCyan, fontWeight = FontWeight.Bold)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ResQSurface)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = ResQCyan,
                contentColor = ResQBackground
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Contact")
            }
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            if (contacts.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().padding(vertical = 40.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.ContactPhone, contentDescription = null, tint = ResQTextMuted, modifier = Modifier.size(64.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("No Emergency Contacts", color = Color.White, fontWeight = FontWeight.Bold)
                        Text("You must add at least one contact for SOS alerts.", color = ResQTextSecondary, fontSize = 12.sp)
                    }
                }
            } else {
                contacts.forEachIndexed { index, contact ->
                    ContactItem(
                        contact = contact,
                        onDelete = {
                            contacts = contacts.filterIndexed { i, _ -> i != index }
                        }
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }

            if (contacts.isNotEmpty()) {
                Spacer(modifier = Modifier.height(20.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = ResQSurface.copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth().border(1.dp, ResQCardBorder, RoundedCornerShape(12.dp))
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "These contacts will receive your location via SMS and Automated Voice Call during an SOS emergency.",
                            color = ResQTextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            containerColor = ResQSurface,
            title = { Text("Add Emergency Contact", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = newName,
                        onValueChange = { newName = it },
                        label = { Text("Full Name", color = ResQTextSecondary) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = ResQCyan
                        ),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = newPhone,
                        onValueChange = { newPhone = it },
                        label = { Text("Phone Number", color = ResQTextSecondary) },
                        placeholder = { Text("+91 ...", color = Color.Gray) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = ResQCyan
                        ),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = newRelationship,
                        onValueChange = { newRelationship = it },
                        label = { Text("Relationship (e.g. Parent, Spouse)", color = ResQTextSecondary) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = ResQCyan
                        ),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newName.isNotBlank() && newPhone.isNotBlank()) {
                            contacts = contacts + EmergencyContact(
                                name = newName,
                                phoneNumber = newPhone,
                                relationship = newRelationship.ifBlank { "Emergency Contact" },
                                priorityOrder = contacts.size + 1
                            )
                            newName = ""
                            newPhone = ""
                            newRelationship = ""
                            showAddDialog = false
                        } else {
                            Toast.makeText(context, "Please enter name and phone.", Toast.LENGTH_SHORT).show()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ResQCyan)
                ) {
                    Text("Add", color = ResQBackground, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Cancel", color = ResQTextSecondary)
                }
            }
        )
    }
}

@Composable
fun ContactItem(
    contact: EmergencyContact,
    onDelete: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = ResQSurface),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, ResQCardBorder, RoundedCornerShape(12.dp))
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(ResQCyan.copy(alpha = 0.15f), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Person, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(22.dp))
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(contact.name, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text(contact.phoneNumber, color = ResQCyan, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                Text(contact.relationship, color = ResQTextSecondary, fontSize = 11.sp)
            }

            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ResQCrimson.copy(alpha = 0.7f), modifier = Modifier.size(20.dp))
            }
        }
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF0F172A)
@Composable
fun EmergencyContactsPreview() {
    ResQNetTheme {
        EmergencyContactsScreen(navController = rememberNavController())
    }
}
