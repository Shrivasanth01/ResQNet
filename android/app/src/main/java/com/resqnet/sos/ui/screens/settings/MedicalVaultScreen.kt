package com.resqnet.sos.ui.screens.settings

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.data.local.RsepStorageManager
import com.resqnet.sos.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MedicalVaultScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val profilePrefs = remember { ProfilePreferences(context) }
    val storageManager = remember { RsepStorageManager(context) }
    val initialProfile = remember { profilePrefs.getProfile() }

    var bloodGroup by remember { mutableStateOf(initialProfile.bloodGroup) }
    var allergies by remember { mutableStateOf(initialProfile.allergies) }
    var medicalConditions by remember { mutableStateOf(initialProfile.medicalConditions) }
    var age by remember { mutableStateOf(initialProfile.age) }

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

            OutlinedTextField(
                value = bloodGroup,
                onValueChange = { bloodGroup = it },
                label = { Text("Blood Group", color = ResQTextSecondary) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = ResQCyan,
                    unfocusedBorderColor = ResQCardBorder
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = age,
                onValueChange = { age = it },
                label = { Text("Age", color = ResQTextSecondary) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = ResQCyan,
                    unfocusedBorderColor = ResQCardBorder
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = allergies,
                onValueChange = { allergies = it },
                label = { Text("Known Allergies (e.g. Penicillin, Peanuts)", color = ResQTextSecondary) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = ResQCyan,
                    unfocusedBorderColor = ResQCardBorder
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = medicalConditions,
                onValueChange = { medicalConditions = it },
                label = { Text("Pre-existing Medical Conditions", color = ResQTextSecondary) },
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
                    val updated = initialProfile.copy(
                        bloodGroup = bloodGroup,
                        age = age,
                        allergies = allergies,
                        medicalConditions = medicalConditions
                    )
                    profilePrefs.saveProfile(updated)

                    // Update RSEP in vault
                    val rsep = storageManager.getExistingRsep()
                    val updatedRsep = rsep.copy(
                        user = rsep.user.copy(
                            bloodGroup = bloodGroup,
                            age = age,
                            medicalConditions = "$allergies | $medicalConditions"
                        )
                    )
                    storageManager.saveRsep(updatedRsep)

                    Toast.makeText(context, "Medical Vault Saved & Synced to RSEP!", Toast.LENGTH_SHORT).show()
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
        }
    }
}
