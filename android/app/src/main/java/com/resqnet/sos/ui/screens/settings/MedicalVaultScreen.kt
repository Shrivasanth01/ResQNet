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
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.data.local.RsepStorageManager
import com.resqnet.sos.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MedicalVaultScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val profilePrefs = remember { ProfilePreferences(context) }
    val storageManager = remember { RsepStorageManager(context) }
    val initialProfile = remember { profilePrefs.getProfile() }

    var fullName by remember { mutableStateOf(initialProfile.fullName) }
    var age by remember { mutableStateOf(initialProfile.age) }
    var gender by remember { mutableStateOf(initialProfile.gender) }
    var height by remember { mutableStateOf(initialProfile.height) }
    var weight by remember { mutableStateOf(initialProfile.weight) }
    
    var bloodGroup by remember { mutableStateOf(initialProfile.bloodGroup) }
    var allergies by remember { mutableStateOf(initialProfile.allergies) }
    var medicalConditions by remember { mutableStateOf(initialProfile.medicalConditions) }

    // Dropdown States
    var genderExpanded by remember { mutableStateOf(false) }
    val genderOptions = listOf("Male", "Female", "Other")

    var bloodExpanded by remember { mutableStateOf(false) }
    val bloodOptions = listOf("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-")

    Scaffold(
        containerColor = ResQBackground,
        topBar = {
            TopAppBar(
                title = { Text("Medical Emergency Vault", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = ResQCyan)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ResQSurface)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.5.dp, Color(0xFF4338CA), RoundedCornerShape(14.dp))
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(Icons.Default.MedicalServices, contentDescription = null, tint = ResQCrimson, modifier = Modifier.size(24.dp))
                    Text(
                        text = "Encrypted in local vault. Embedded in every broadcasted RSEP file.",
                        color = Color(0xFFCBD5E1),
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            Text("Personal Details", color = ResQCyan, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = fullName,
                onValueChange = { fullName = it },
                label = { Text("Full Name", color = ResQTextSecondary) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = ResQCyan,
                    unfocusedBorderColor = ResQCardBorder
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = age,
                    onValueChange = { age = it },
                    label = { Text("Age", color = ResQTextSecondary) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = ResQCyan,
                        unfocusedBorderColor = ResQCardBorder
                    )
                )

                ExposedDropdownMenuBox(
                    expanded = genderExpanded,
                    onExpandedChange = { genderExpanded = !genderExpanded },
                    modifier = Modifier.weight(1f)
                ) {
                    OutlinedTextField(
                        value = gender,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Gender", color = ResQTextSecondary) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = genderExpanded) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = ResQCyan,
                            unfocusedBorderColor = ResQCardBorder
                        ),
                        modifier = Modifier.menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = genderExpanded,
                        onDismissRequest = { genderExpanded = false },
                        modifier = Modifier.background(ResQSurface)
                    ) {
                        genderOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option, color = Color.White) },
                                onClick = {
                                    gender = option
                                    genderExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = height,
                    onValueChange = { height = it },
                    label = { Text("Height (cm)", color = ResQTextSecondary) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = ResQCyan,
                        unfocusedBorderColor = ResQCardBorder
                    )
                )
                OutlinedTextField(
                    value = weight,
                    onValueChange = { weight = it },
                    label = { Text("Weight (kg)", color = ResQTextSecondary) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = ResQCyan,
                        unfocusedBorderColor = ResQCardBorder
                    )
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text("Medical Details", color = ResQCrimson, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))

            ExposedDropdownMenuBox(
                expanded = bloodExpanded,
                onExpandedChange = { bloodExpanded = !bloodExpanded },
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = bloodGroup,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Blood Group", color = ResQTextSecondary) },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = bloodExpanded) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = ResQCyan,
                        unfocusedBorderColor = ResQCardBorder
                    ),
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = bloodExpanded,
                    onDismissRequest = { bloodExpanded = false },
                    modifier = Modifier.background(ResQSurface)
                ) {
                    bloodOptions.forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option, color = Color.White) },
                            onClick = {
                                bloodGroup = option
                                bloodExpanded = false
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = allergies,
                onValueChange = { allergies = it },
                label = { Text("Allergies", color = ResQTextSecondary) },
                trailingIcon = {
                    TextButton(onClick = { allergies = "NIL" }) {
                        Text("NIL", color = ResQCyan, fontWeight = FontWeight.Bold)
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = ResQCyan,
                    unfocusedBorderColor = ResQCardBorder
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = medicalConditions,
                onValueChange = { medicalConditions = it },
                label = { Text("Medical Conditions", color = ResQTextSecondary) },
                trailingIcon = {
                    TextButton(onClick = { medicalConditions = "NIL" }) {
                        Text("NIL", color = ResQCyan, fontWeight = FontWeight.Bold)
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = ResQCyan,
                    unfocusedBorderColor = ResQCardBorder
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    if (fullName.isBlank() || age.isBlank() || gender.isBlank() || 
                        height.isBlank() || weight.isBlank() || bloodGroup.isBlank() || 
                        allergies.isBlank() || medicalConditions.isBlank()) {
                        Toast.makeText(context, "All fields are mandatory to ensure SOS safety.", Toast.LENGTH_LONG).show()
                        return@Button
                    }

                    val updated = initialProfile.copy(
                        fullName = fullName,
                        age = age,
                        gender = gender,
                        height = height,
                        weight = weight,
                        bloodGroup = bloodGroup,
                        allergies = allergies,
                        medicalConditions = medicalConditions
                    )
                    profilePrefs.saveProfile(updated)

                    // Update RSEP in vault
                    val rsep = storageManager.getExistingRsep()
                    val updatedRsep = rsep.copy(
                        user = rsep.user.copy(
                            name = fullName,
                            age = age,
                            gender = gender,
                            height = height,
                            weight = weight,
                            bloodGroup = bloodGroup,
                            medicalConditions = "$allergies | $medicalConditions"
                        )
                    )
                    storageManager.saveRsep(updatedRsep)

                    // Sync permanently to Supabase PostgreSQL database
                    scope.launch(Dispatchers.IO) {
                        try {
                            com.resqnet.sos.data.remote.EmergencyServerBridge().saveProfileToCloud(updated)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }

                    Toast.makeText(context, "Medical Vault Saved & Synced to Cloud Database!", Toast.LENGTH_SHORT).show()
                    navController.popBackStack()
                },
                colors = ButtonDefaults.buttonColors(containerColor = ResQCyan),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Save, contentDescription = null, tint = ResQBackground, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Save Vault & Update RSEP", color = ResQBackground, fontWeight = FontWeight.Black)
            }
            
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
