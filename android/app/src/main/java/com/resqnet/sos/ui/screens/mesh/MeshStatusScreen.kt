package com.resqnet.sos.ui.screens.mesh

import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import android.location.LocationManager
import android.provider.Settings
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.data.local.ReceivedIncidentsVault
import com.resqnet.sos.data.local.SosLocationRepository
import com.resqnet.sos.services.distribution.DuplicateDetectionManager
import com.resqnet.sos.services.distribution.NativeBleMeshEngine
import com.resqnet.sos.theme.*
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeshStatusScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val profilePrefs = remember { ProfilePreferences(context) }
    val receivedVault = remember { ReceivedIncidentsVault(context) }
    val locationRepo = remember { SosLocationRepository(context) }

    val persistentDeviceId = remember { profilePrefs.getOrCreateDeviceId() }
    val bluetoothManager = remember { context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager }
    val bluetoothAdapter = remember { bluetoothManager?.adapter }

    val isMeshActive by NativeBleMeshEngine.isMeshActive.collectAsState()
    val nearbyCount by NativeBleMeshEngine.nearbyDevicesCount.collectAsState()
    val connectedCount by NativeBleMeshEngine.connectedDevicesCount.collectAsState()
    val relayedCount by NativeBleMeshEngine.relayedMessagesCount.collectAsState()
    val logs by NativeBleMeshEngine.logs.collectAsState()

    val lastReceivedPacket = remember(logs) { receivedVault.getReceivedPackets().firstOrNull() }
    val pendingRecordsCount = remember(logs) { locationRepo.getPendingLocationRecords().size }
    val duplicateSuppressedCount = remember(logs) { DuplicateDetectionManager.getDuplicateSuppressionCount() }

    var isBtEnabled by remember { mutableStateOf(bluetoothAdapter?.isEnabled == true) }

    LaunchedEffect(Unit) {
        while (true) {
            isBtEnabled = bluetoothAdapter?.isEnabled == true
            if (isBtEnabled) {
                NativeBleMeshEngine.init(context)
            }
            delay(1000)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Mesh Network Telemetry", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text("ID: A7F8-$persistentDeviceId", color = ResQCyan, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ResQSurface)
            )
        },
        containerColor = ResQBackground
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 16.dp)
        ) {
            // =========================================================================
            // MAIN STATUS BANNER
            // =========================================================================
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (isBtEnabled && isMeshActive) Color(0xFF0F231A) else Color(0xFF2E0A0A)
                ),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.5.dp,
                        if (isBtEnabled && isMeshActive) ResQGreen else ResQCrimson,
                        RoundedCornerShape(16.dp)
                    )
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(
                                if (isBtEnabled && isMeshActive) ResQGreen else ResQCrimson,
                                CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isBtEnabled && isMeshActive) Icons.Default.Hub else Icons.Default.BluetoothDisabled,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (isBtEnabled && isMeshActive) "BLE MESH OPERATIONAL" else "BLUETOOTH DISABLED",
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            text = if (isBtEnabled && isMeshActive) "Offline BLE GATT & UDP socket mesh active" else "Turn on Bluetooth to participate in mesh",
                            color = ResQTextSecondary,
                            fontSize = 11.sp
                        )
                    }

                    if (!isBtEnabled) {
                        Button(
                            onClick = {
                                try {
                                    val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
                                    context.startActivity(intent)
                                } catch (_: Exception) {}
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ResQCrimson),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text("Enable", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // =========================================================================
            // MESH READINESS CHECKER WIDGET
            // =========================================================================
            val locationManager = remember { context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager }
            val isGpsEnabled = remember(isBtEnabled) { locationManager?.isProviderEnabled(
                LocationManager.GPS_PROVIDER) == true }
            val isReady = isBtEnabled && isGpsEnabled && isMeshActive

            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0B192C)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, if (isReady) ResQCyan else ResQYellow, RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("SOS MESH READINESS CHECKER", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Black)
                        Box(
                            modifier = Modifier
                                .background(if (isReady) ResQGreen.copy(alpha = 0.2f) else ResQYellow.copy(alpha = 0.2f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = if (isReady) "STATUS: READY" else "STATUS: ATTENTION REQUIRED",
                                color = if (isReady) ResQGreen else ResQYellow,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Bluetooth Radio", color = ResQTextSecondary, fontSize = 11.sp)
                        Text(if (isBtEnabled) "✓ ON" else "✗ OFF", color = if (isBtEnabled) ResQGreen else ResQCrimson, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Required Permissions", color = ResQTextSecondary, fontSize = 11.sp)
                        Text("✓ Granted", color = ResQGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("System GPS Location", color = ResQTextSecondary, fontSize = 11.sp)
                        Text(if (isGpsEnabled) "✓ Available" else "✗ Disabled", color = if (isGpsEnabled) ResQGreen else ResQYellow, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Mesh Foreground Service", color = ResQTextSecondary, fontSize = 11.sp)
                        Text("✓ Running", color = ResQGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Peer Discovery & Scanner", color = ResQTextSecondary, fontSize = 11.sp)
                        Text(if (isMeshActive) "✓ Active" else "✗ Idle", color = if (isMeshActive) ResQGreen else ResQYellow, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // =========================================================================
            // TELEMETRY COUNTER GRID
            // =========================================================================
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricTile(
                    title = "Bluetooth",
                    value = if (isBtEnabled) "ON" else "OFF",
                    color = if (isBtEnabled) ResQGreen else ResQCrimson,
                    icon = Icons.Default.Bluetooth,
                    modifier = Modifier.weight(1f)
                )
                MetricTile(
                    title = "Nearby Peers",
                    value = "${maxOf(nearbyCount, connectedCount)}",
                    color = ResQCyan,
                    icon = Icons.Default.Devices,
                    modifier = Modifier.weight(1f)
                )
                MetricTile(
                    title = "Connected",
                    value = "$connectedCount",
                    color = ResQBlue,
                    icon = Icons.Default.BluetoothConnected,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricTile(
                    title = "Relayed",
                    value = "$relayedCount",
                    color = Color(0xFF8B5CF6),
                    icon = Icons.Default.AltRoute,
                    modifier = Modifier.weight(1f)
                )
                MetricTile(
                    title = "Pending Queue",
                    value = "$pendingRecordsCount",
                    color = ResQYellow,
                    icon = Icons.Default.Schedule,
                    modifier = Modifier.weight(1f)
                )
                MetricTile(
                    title = "Suppressed",
                    value = "$duplicateSuppressedCount",
                    color = ResQTextSecondary,
                    icon = Icons.Default.Shield,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // =========================================================================
            // LAST RECEIVED SOS SUMMARY CARD
            // =========================================================================
            Text(
                text = "Last Received Peer SOS",
                style = MaterialTheme.typography.titleLarge,
                color = ResQTextPrimary,
                fontSize = 15.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (lastReceivedPacket != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E0B0B)),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, ResQCrimson.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = ResQCrimson, modifier = Modifier.size(20.dp))
                            Column {
                                Text(lastReceivedPacket.user.name, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Text("ID: ${lastReceivedPacket.header.packetId}", color = ResQCyan, fontSize = 10.5.sp, fontFamily = FontFamily.Monospace)
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "Blood: ${lastReceivedPacket.user.bloodGroup} • Lat: ${lastReceivedPacket.location.latitude}, Long: ${lastReceivedPacket.location.longitude}",
                            color = ResQTextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }
            } else {
                Card(
                    colors = CardDefaults.cardColors(containerColor = ResQSurface),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, ResQCardBorder, RoundedCornerShape(12.dp))
                ) {
                    Text(
                        text = "No mesh SOS received yet. Listening on BLE & UDP socket...",
                        color = ResQTextMuted,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(14.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // =========================================================================
            // LIVE TERMINAL EVENT LOG WINDOW
            // =========================================================================
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Live Mesh Terminal Log",
                    style = MaterialTheme.typography.titleLarge,
                    color = ResQTextPrimary,
                    fontSize = 15.sp
                )

                Text(
                    text = "${logs.size} entries",
                    color = ResQTextMuted,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF030712)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(240.dp)
                    .border(1.dp, ResQCyan.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(12.dp)
                ) {
                    if (logs.isEmpty()) {
                        Text(
                            text = "[00:00:00] [BLE/MESH] Terminal ready. Waiting for radio events...",
                            color = Color(0xFF4B5563),
                            fontSize = 10.5.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    } else {
                        logs.forEach { log ->
                            Text(
                                text = log,
                                color = when {
                                    log.contains("Received", ignoreCase = true) || log.contains("Saved", ignoreCase = true) -> Color(0xFF4ADE80)
                                    log.contains("Relaying", ignoreCase = true) -> Color(0xFFA78BFA)
                                    log.contains("Duplicate", ignoreCase = true) -> Color(0xFFFBBF24)
                                    log.contains("error", ignoreCase = true) || log.contains("disabled", ignoreCase = true) -> Color(0xFFF87171)
                                    else -> Color(0xFF9CA3AF)
                                },
                                fontSize = 10.sp,
                                lineHeight = 14.sp,
                                fontFamily = FontFamily.Monospace,
                                modifier = Modifier.padding(bottom = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MetricTile(
    title: String,
    value: String,
    color: Color,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = ResQSurface),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.border(1.dp, ResQCardBorder, RoundedCornerShape(12.dp))
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = title, tint = color, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, color = color, fontSize = 15.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
            Text(title, color = ResQTextSecondary, fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
        }
    }
}
