package com.resqnet.rescuer.ui

import android.annotation.SuppressLint
import android.content.Intent
import android.location.Location
import android.net.Uri
import android.webkit.WebView
import android.webkit.WebViewClient
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
import androidx.compose.ui.viewinterop.AndroidView
import androidx.navigation.NavController
import com.resqnet.rescuer.data.RescuerVault
import com.resqnet.sos.services.hardware.AndroidLocationService
import com.resqnet.sos.theme.*

@Composable
fun RescuerMapScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val vault = remember { RescuerVault(context) }
    val locationService = remember { AndroidLocationService(context) }
    val responderCoords = remember { locationService.getCachedLocation() }

    val victimRecords by remember { mutableStateOf(vault.getAllVictimRecords()) }

    Scaffold(
        containerColor = ResQBackground,
        bottomBar = {
            NavigationBar(containerColor = ResQSurface, tonalElevation = 8.dp) {
                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate("rescuer_dashboard") },
                    icon = { Icon(Icons.Default.LocalHospital, contentDescription = null, tint = ResQTextSecondary) },
                    label = { Text("Triage", color = ResQTextSecondary, fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = true,
                    onClick = { },
                    icon = { Icon(Icons.Default.Map, contentDescription = null, tint = ResQCyan) },
                    label = { Text("Tactical Radar", color = ResQCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
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
                text = "Rescuer Tactical Radar",
                style = MaterialTheme.typography.headlineMedium,
                color = ResQTextPrimary
            )
            Text(
                text = "Live GPS radar vectoring responder team to active victim beacons",
                style = MaterialTheme.typography.bodyMedium,
                color = ResQTextSecondary
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Responder Live Location Radar Card
            Card(
                colors = CardDefaults.cardColors(containerColor = ResQSurface),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, ResQCardBorder, RoundedCornerShape(14.dp))
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(ResQCyan.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Navigation, contentDescription = null, tint = ResQCyan, modifier = Modifier.size(22.dp))
                    }

                    Column {
                        Text("Responder Unit GPS Position", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text(
                            text = "Lat: ${String.format("%.5f", responderCoords.latitude)}° N  •  Long: ${String.format("%.5f", responderCoords.longitude)}° E",
                            color = ResQCyan,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // INTERACTIVE RESCUER LEAFLET RADAR MAP
            val victimMarkers = remember(victimRecords) {
                victimRecords.map { Pair(it.packet.location.latitude, it.packet.location.longitude) }
            }

            Card(
                colors = CardDefaults.cardColors(containerColor = ResQSurface),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
                    .border(1.5.dp, ResQCyan, RoundedCornerShape(16.dp))
            ) {
                InteractiveMapView(
                    myLat = responderCoords.latitude,
                    myLng = responderCoords.longitude,
                    victimMarkers = victimMarkers,
                    modifier = Modifier.fillMaxSize()
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Ingested Victim Targets (${victimRecords.size})",
                style = MaterialTheme.typography.titleLarge,
                color = ResQTextPrimary,
                fontSize = 15.sp
            )

            Spacer(modifier = Modifier.height(10.dp))

            if (victimRecords.isEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = ResQSurface),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("No victim GPS markers active.", color = ResQTextMuted, fontSize = 12.sp, modifier = Modifier.padding(14.dp))
                }
            } else {
                victimRecords.forEach { record ->
                    val pkt = record.packet
                    val results = FloatArray(1)
                    Location.distanceBetween(
                        responderCoords.latitude, responderCoords.longitude,
                        pkt.location.latitude, pkt.location.longitude,
                        results
                    )
                    val distanceMeters = results[0].toInt()

                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0A192F)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 10.dp)
                            .border(1.dp, ResQCyan.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(ResQCrimson.copy(alpha = 0.2f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Place, contentDescription = null, tint = ResQCrimson, modifier = Modifier.size(20.dp))
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(pkt.user.name, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Text("Distance: ~${distanceMeters}m away", color = ResQCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text("GPS: ${pkt.location.latitude}, ${pkt.location.longitude}", color = ResQTextMuted, fontSize = 10.5.sp, fontFamily = FontFamily.Monospace)
                            }

                            IconButton(
                                onClick = {
                                    val mapUri = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${pkt.location.latitude},${pkt.location.longitude}")
                                    context.startActivity(Intent(Intent.ACTION_VIEW, mapUri))
                                }
                            ) {
                                Icon(Icons.Default.Navigation, contentDescription = "Navigate", tint = ResQBlue)
                            }
                        }
                    }
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun InteractiveMapView(
    myLat: Double,
    myLng: Double,
    victimMarkers: List<Pair<Double, Double>>,
    modifier: Modifier = Modifier
) {
    val htmlContent = remember(myLat, myLng, victimMarkers) {
        val validMyLat = if (myLat != 0.0) myLat else 13.0827
        val validMyLng = if (myLng != 0.0) myLng else 80.2707

        val markersJs = victimMarkers.joinToString("\n") { (vLat, vLng) ->
            if (vLat != 0.0 && vLng != 0.0) {
                "L.marker([$vLat, $vLng], {icon: redIcon}).addTo(map).bindPopup('🚨 Victim Emergency SOS Target');"
            } else ""
        }

        """
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; background: #0B192C; }
                #map { width: 100vw; height: 100vh; background: #0B192C; }
                .leaflet-tile { filter: brightness(0.7) invert(1) contrast(1.3) hue-rotate(200deg); }
                .leaflet-control-attribution { display: none !important; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map', { zoomControl: false }).setView([$validMyLat, $validMyLng], 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19
                }).addTo(map);

                var blueIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: "<div style='background-color:#00A8E8;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px #00A8E8;'></div>",
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });

                var redIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: "<div style='background-color:#D32F2F;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px #D32F2F;'></div>",
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                L.marker([$validMyLat, $validMyLng], {icon: blueIcon}).addTo(map).bindPopup('📍 Responder Position');
                L.circle([$validMyLat, $validMyLng], {radius: 25, color: '#00A8E8', fillColor: '#00A8E8', fillOpacity: 0.25}).addTo(map);

                $markersJs
            </script>
        </body>
        </html>
        """.trimIndent()
    }

    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                webViewClient = WebViewClient()
            }
        },
        update = { webView ->
            webView.loadDataWithBaseURL("https://openstreetmap.org", htmlContent, "text/html", "UTF-8", null)
        },
        modifier = modifier
    )
}
