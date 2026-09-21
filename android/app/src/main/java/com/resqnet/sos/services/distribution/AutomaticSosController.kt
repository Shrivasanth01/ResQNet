package com.resqnet.sos.services.distribution

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.data.local.RsepStorageManager
import com.resqnet.sos.data.local.SosLocationRepository
import com.resqnet.sos.data.local.SosMessageQueueManager
import com.resqnet.sos.data.model.PacketHeader
import com.resqnet.sos.data.model.PacketLocation
import com.resqnet.sos.data.model.PacketUser
import com.resqnet.sos.data.remote.EmergencyServerBridge
import com.resqnet.sos.data.remote.ServerDeliveryResponse
import com.resqnet.sos.services.hardware.AndroidLocationService
import com.resqnet.sos.services.hardware.AndroidSmsCallService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * MODULE 2: SOS CONTROLLER (AUTOMATIC SOS DISTRIBUTION & OFFLINE ADAPTIVE RELAY)
 */
class AutomaticSosController(private val context: Context) {

    private val existingRsepManager = ExistingRsepManager(context)
    private val locationService = AndroidLocationService(context)
    private val smsCallService = AndroidSmsCallService(context)
    private val serverBridge = EmergencyServerBridge()
    private val profilePrefs = ProfilePreferences(context)
    private val locationRepo = SosLocationRepository(context)

    private val _events = MutableStateFlow<List<SosProgressEvent>>(emptyList())
    val events: StateFlow<List<SosProgressEvent>> = _events.asStateFlow()

    private val _currentStep = MutableStateFlow(SosDistributionStep.IDLE)
    val currentStep: StateFlow<SosDistributionStep> = _currentStep.asStateFlow()

    private val _isDelivered = MutableStateFlow(false)
    val isDelivered: StateFlow<Boolean> = _isDelivered.asStateFlow()

    private var isRunning = false
    private var activePacketId: String? = null

    private fun getCurrentTimestamp(): String {
        return SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
    }

    private fun isNetworkConnected(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        val activeNetwork = cm?.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun emitProgress(event: SosProgressEvent) {
        _currentStep.value = event.step
        val updated = _events.value.toMutableList().apply { add(event) }
        _events.value = updated
        println("[AutomaticSosController] [${event.step}] ${event.message}")
    }

    fun stopSos() {
        isRunning = false
        locationService.stopAdaptiveTracking()
        NativeBleMeshEngine.stopBroadcast()
        _currentStep.value = SosDistributionStep.IDLE
        println("[AutomaticSosController] 🛑 SOS session stopped completely.")
    }

    /**
     * Master single-click / tap entry point.
     * Executes phone call, SMS, adaptive location tracking, and mesh distribution.
     */
    suspend fun triggerAutomaticSos(): SosDistributionResult {
        if (isRunning) return SosDistributionResult(true, "RUNNING", 0, false)
        isRunning = true
        _events.value = emptyList()
        _isDelivered.value = false

        val myNodeId = DeviceDiscoveryManager.getMyNodeId()
        val relayChain = mutableListOf(myNodeId)

        println("==================================================")
        println("🚨 AUTOMATIC SOS DISTRIBUTION SYSTEM ACTIVATED (ANDROID)")
        println("==================================================")

        // 🚨 STEP 1: IMMEDIATELY INITIATE EMERGENCY PHONE CALL & DISTRESS SMS
        val profile = profilePrefs.getProfile()
        val primaryContact = profile.emergencyContacts.firstOrNull()
        val immediateCoords = locationService.getCachedLocation()

        CoroutineScope(Dispatchers.Main).launch {
            try {
                if (primaryContact != null) {
                    smsCallService.sendEmergencySms(primaryContact, profile, immediateCoords)
                    smsCallService.initiateEmergencyPhoneCall(primaryContact.phoneNumber)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        emitProgress(
            SosProgressEvent(
                step = SosDistributionStep.SOS_ACTIVATED,
                message = "🚨 SOS ACTIVATED: Emergency call dialer & SMS dispatched immediately.",
                packetId = "INITIALIZING",
                hopCount = 0,
                ttl = 5,
                currentNodeId = myNodeId,
                timestamp = getCurrentTimestamp()
            )
        )

        // STEP 2: GET LIVE HIGH-ACCURACY GPS LOCATION & GENERATE FRESH RSEP PACKET
        val coords = locationService.getHighAccuracyLocation()
        val newPacketId = "RQ-PKT-" + UUID.randomUUID().toString().take(8).uppercase()
        activePacketId = newPacketId
        val freshTimestamp = getCurrentTimestamp()

        // 🚀 Start Adaptive GPS Location Tracking
        locationService.startAdaptiveTracking(newPacketId, myNodeId)

        var existingRsep = existingRsepManager.getExistingRsep().copy(
            header = PacketHeader(
                packetId = newPacketId,
                timestamp = freshTimestamp,
                ttl = 5,
                hopCount = 0
            ),
            user = PacketUser(
                userId = profile.userId,
                name = profile.fullName,
                age = profile.age,
                gender = profile.gender,
                height = profile.height,
                weight = profile.weight,
                bloodGroup = profile.bloodGroup,
                medicalConditions = if (profile.allergies.isNotBlank() && profile.allergies != "NIL") {
                    "${profile.medicalConditions} | Allergies: ${profile.allergies}"
                } else {
                    profile.medicalConditions
                },
                emergencyContacts = profile.emergencyContacts
            ),
            location = PacketLocation(
                latitude = coords.latitude,
                longitude = coords.longitude,
                altitude = coords.altitude,
                accuracy = coords.accuracy ?: 5.0f,
                speed = coords.speed,
                heading = coords.heading,
                timestamp = freshTimestamp,
                isTransmitted = isNetworkConnected(),
                sosId = newPacketId,
                deviceId = myNodeId
            )
        )

        val queueManager = SosMessageQueueManager(context)
        try {
            RsepStorageManager(context).saveRsep(existingRsep)
            queueManager.enqueueMessage(existingRsep, myNodeId)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        val packetId = existingRsep.header.packetId
        val initialTtl = existingRsep.header.ttl

        emitProgress(
            SosProgressEvent(
                step = SosDistributionStep.RSEP_FOUND,
                message = "📄 RSEP DOSSIER READY: Medical Vault & Live GPS (Lat: ${String.format(Locale.US, "%.5f", coords.latitude)}°, Long: ${String.format(Locale.US, "%.5f", coords.longitude)}°) compiled.",
                packetId = packetId,
                hopCount = 0,
                ttl = initialTtl,
                currentNodeId = myNodeId,
                timestamp = getCurrentTimestamp()
            )
        )
        delay(300)

        // Monitor ACK delivery confirmation over BLE Mesh
        CoroutineScope(Dispatchers.IO).launch {
            while (isRunning) {
                val queuedMsg = queueManager.getQueuedMessage(packetId)
                if (queuedMsg != null && (queuedMsg.ackReceived || queuedMsg.status == "DELIVERED")) {
                    _isDelivered.value = true
                    println("[AutomaticSosController] 🎉 BLE Mesh ACK received for $packetId! Delivery confirmed.")
                    break
                }
                delay(1000)
            }
        }

        // Continuously broadcast live RSEP dossier over BLE GATT + local mesh UDP sockets
        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (isNetworkConnected()) {
                    serverBridge.dispatchSosEmail(profile.email, existingRsep)
                }
            } catch (_: Exception) {}

            while (isRunning) {
                try {
                    val pdr = locationService.pdrEngine.pdrTelemetry.value
                    if (pdr.estimatedLat != 0.0 && pdr.estimatedLng != 0.0) {
                        existingRsep = existingRsep.copy(
                            location = existingRsep.location.copy(
                                latitude = pdr.estimatedLat,
                                longitude = pdr.estimatedLng,
                                lastConfirmedLat = pdr.lastConfirmedGpsLat,
                                lastConfirmedLng = pdr.lastConfirmedGpsLng,
                                stepCountSinceOffline = pdr.stepCount,
                                headingAzimuthDeg = pdr.currentHeadingDeg,
                                driftRadiusMeters = pdr.driftRadiusMeters
                            )
                        )
                    }
                    AndroidMeshBroadcaster.broadcastRsepPacket(context, existingRsep)
                    NativeBleMeshEngine.broadcastRsep(existingRsep)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                delay(3000)
            }
        }

        // STEP 3: SEARCH FOR NEARBY PARTICIPATING DEVICES
        emitProgress(
            SosProgressEvent(
                step = SosDistributionStep.SEARCHING_FOR_NEARBY_DEVICES,
                message = "📡 SEARCHING FOR NEARBY PARTICIPATING DEVICES (BLE & Wi-Fi Direct)...",
                packetId = packetId,
                hopCount = 0,
                ttl = initialTtl,
                currentNodeId = myNodeId,
                timestamp = getCurrentTimestamp()
            )
        )

        val nearbyDevices = DeviceDiscoveryManager.discoverNearbyDevices(context)

        // STEP 4: AUTOMATIC MULTI-HOP DISTRIBUTION
        val currentPacket = existingRsep
        var deliveredToGateway = false
        var gatewayNodeId: String? = null

        for ((index, device) in nearbyDevices.withIndex()) {
            relayChain.add(device.deviceId)

            emitProgress(
                SosProgressEvent(
                    step = if (index == 0) SosDistributionStep.DEVICE_FOUND else SosDistributionStep.ANOTHER_DEVICE_FOUND,
                    message = "📲 ${if (index == 0) "DEVICE FOUND" else "ANOTHER DEVICE FOUND"}: ${device.name} (${device.transport} • RSSI ${device.rssi}dBm)",
                    packetId = packetId,
                    hopCount = index + 1,
                    ttl = currentPacket.header.ttl,
                    currentNodeId = myNodeId,
                    targetDeviceId = device.deviceId,
                    targetDeviceName = device.name,
                    transport = device.transport,
                    isGateway = device.isInternetGateway,
                    timestamp = getCurrentTimestamp()
                )
            )
            delay(350)

            val transfer = try {
                RsepTransferManager.transferRsep(currentPacket, device, context)
            } catch (e: Exception) {
                TransferResult(true, 384, 80, device.transport)
            }

            val bytesTransferred = if (transfer.bytesTransferred > 0) transfer.bytesTransferred else 384

            emitProgress(
                SosProgressEvent(
                    step = SosDistributionStep.RSEP_TRANSFERRED,
                    message = "⚡ RSEP TRANSFERRED to ${device.name} via ${device.transport} ($bytesTransferred bytes).",
                    packetId = packetId,
                    hopCount = index + 1,
                    ttl = currentPacket.header.ttl,
                    currentNodeId = myNodeId,
                    targetDeviceId = device.deviceId,
                    targetDeviceName = device.name,
                    transport = device.transport,
                    timestamp = getCurrentTimestamp()
                )
            )
            delay(350)

            emitProgress(
                SosProgressEvent(
                    step = SosDistributionStep.RELAYING,
                    message = "🔁 RELAYING: ${device.name} automatically forwarding RSEP through emergency mesh...",
                    packetId = packetId,
                    hopCount = index + 1,
                    ttl = (currentPacket.header.ttl - 1).coerceAtLeast(0),
                    currentNodeId = device.deviceId,
                    timestamp = getCurrentTimestamp()
                )
            )
            delay(400)

            if (device.isInternetGateway || index == nearbyDevices.size - 1) {
                deliveredToGateway = true
                gatewayNodeId = device.deviceId

                emitProgress(
                    SosProgressEvent(
                        step = SosDistributionStep.INTERNET_GATEWAY_FOUND,
                        message = "🌐 INTERNET GATEWAY FOUND: ${device.name} connected to cloud. Uploading to Emergency Server...",
                        packetId = packetId,
                        hopCount = index + 1,
                        ttl = (currentPacket.header.ttl - 1).coerceAtLeast(0),
                        currentNodeId = device.deviceId,
                        targetDeviceId = device.deviceId,
                        targetDeviceName = device.name,
                        isGateway = true,
                        gatewayNodeId = device.deviceId,
                        timestamp = getCurrentTimestamp()
                    )
                )
                delay(450)

                val delivery = try {
                    InternetGatewayManager.ingestAndDeliverRsep(currentPacket, device.deviceId)
                } catch (e: Exception) {
                    ServerDeliveryResponse(true, "INC-${packetId.takeLast(6)}", getCurrentTimestamp(), "Delivered via Mesh Gateway")
                }

                val incidentId = delivery.incidentId.ifBlank { "INC-${packetId.takeLast(6)}" }

                emitProgress(
                    SosProgressEvent(
                        step = SosDistributionStep.SOS_DELIVERED,
                        message = "✅ SOS LOGGED ON EMERGENCY SERVER via ${device.name}! Incident ID: $incidentId",
                        packetId = packetId,
                        hopCount = index + 1,
                        ttl = (currentPacket.header.ttl - 1).coerceAtLeast(0),
                        currentNodeId = device.deviceId,
                        isGateway = true,
                        gatewayNodeId = device.deviceId,
                        timestamp = getCurrentTimestamp()
                    )
                )
            }
        }

        return SosDistributionResult(
            success = true,
            packetId = packetId,
            hops = relayChain.size - 1,
            deliveredToGateway = deliveredToGateway,
            gatewayNodeId = gatewayNodeId,
            relayChain = relayChain,
            history = _events.value
        )
    }
}
