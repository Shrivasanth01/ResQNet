package com.resqnet.sos.services.distribution

import android.content.Context
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.data.remote.EmergencyServerBridge
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
 * MODULE 2: SOS CONTROLLER (AUTOMATIC SOS DISTRIBUTION SYSTEM)
 * 
 * CORE REQUIREMENT ENFORCEMENT:
 * - The user performs ONLY ONE ACTION: Press SOS.
 * - Everything else happens 100% AUTOMATICALLY.
 * - No selecting RSEP file.
 * - No selecting Bluetooth or Wi-Fi.
 * - No selecting nearby devices.
 * - No pressing Connect or Send.
 * - No manual forwarding.
 * - Emits real-time progress events for visual Jetpack Compose timeline.
 */
class AutomaticSosController(private val context: Context) {

    private val existingRsepManager = ExistingRsepManager(context)
    private val locationService = AndroidLocationService(context)
    private val smsCallService = AndroidSmsCallService(context)
    private val serverBridge = EmergencyServerBridge()
    private val profilePrefs = ProfilePreferences(context)

    private val _events = MutableStateFlow<List<SosProgressEvent>>(emptyList())
    val events: StateFlow<List<SosProgressEvent>> = _events.asStateFlow()

    private val _currentStep = MutableStateFlow(SosDistributionStep.IDLE)
    val currentStep: StateFlow<SosDistributionStep> = _currentStep.asStateFlow()

    private val _isDelivered = MutableStateFlow(false)
    val isDelivered: StateFlow<Boolean> = _isDelivered.asStateFlow()

    private var isRunning = false

    private fun getCurrentTimestamp(): String {
        return SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
    }

    private fun emitProgress(event: SosProgressEvent) {
        _currentStep.value = event.step
        val updated = _events.value.toMutableList().apply { add(event) }
        _events.value = updated
        println("[AutomaticSosController] [${event.step}] ${event.message}")
    }

    /**
     * Master single-click entry point.
     * Executes the entire automated distribution pipeline without user interaction.
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

        // STEP 1: SOS ACTIVATED
        emitProgress(
            SosProgressEvent(
                step = SosDistributionStep.SOS_ACTIVATED,
                message = "🚨 SOS ACTIVATED: Emergency broadcast initiated.",
                packetId = "INITIALIZING",
                hopCount = 0,
                ttl = 5,
                currentNodeId = myNodeId,
                timestamp = getCurrentTimestamp()
            )
        )
        delay(300)

        // STEP 2: GET LIVE HIGH-ACCURACY GPS LOCATION & LOAD VICTIM RSEP DOSSIER
        val profile = profilePrefs.getProfile()
        val coords = locationService.getHighAccuracyLocation()
        val primaryContact = profile.emergencyContacts.firstOrNull()

        // Update existing RSEP dossier with live GPS coordinates and victim medical vault
        val existingRsep = existingRsepManager.getExistingRsep().copy(
            user = com.resqnet.sos.data.model.PacketUser(
                userId = profile.userId,
                name = profile.fullName,
                age = profile.age,
                bloodGroup = profile.bloodGroup,
                medicalConditions = profile.medicalConditions,
                emergencyContacts = profile.emergencyContacts
            ),
            location = com.resqnet.sos.data.model.PacketLocation(
                latitude = coords.latitude,
                longitude = coords.longitude,
                accuracy = 5.0f,
                timestamp = getCurrentTimestamp()
            )
        )

        val packetId = existingRsep.header.packetId
        val initialTtl = existingRsep.header.ttl

        emitProgress(
            SosProgressEvent(
                step = SosDistributionStep.RSEP_FOUND,
                message = "📄 RSEP DOSSIER READY: Victim medical vault & Live GPS ($coords) compiled.",
                packetId = packetId,
                hopCount = 0,
                ttl = initialTtl,
                currentNodeId = myNodeId,
                timestamp = getCurrentTimestamp()
            )
        )
        delay(350)

        // STEP 2B: IMMEDIATELY INITIATE EMERGENCY PHONE CALL & DISTRESS SMS TO CONTACTS
        CoroutineScope(Dispatchers.Main).launch {
            try {
                if (primaryContact != null) {
                    // 1. Send SMS with Live Google Maps GPS location link & medical details
                    smsCallService.sendEmergencySms(primaryContact, profile, coords)

                    // 2. Automatically dial emergency call to primary emergency contact
                    smsCallService.initiateEmergencyPhoneCall(primaryContact.phoneNumber)
                }
                serverBridge.dispatchSosEmail(profile.email, existingRsep)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // STEP 3: AUTOMATICALLY SEARCH FOR NEARBY PARTICIPATING DEVICES
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

        val nearbyDevices = DeviceDiscoveryManager.discoverNearbyDevices()

        // STEP 4: AUTOMATIC MULTI-HOP DISTRIBUTION OVER NEARBY DEVICES
        var currentPacket = existingRsep
        var deliveredToGateway = false
        var gatewayNodeId: String? = null

        for ((index, device) in nearbyDevices.withIndex()) {
            relayChain.add(device.deviceId)

            // STEP 4A: DEVICE FOUND
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
            delay(400)

            // STEP 4B: AUTOMATICALLY CONNECT & TRANSFER EXISTING RSEP
            val transfer = RsepTransferManager.transferRsep(currentPacket, device)
            if (transfer.success) {
                emitProgress(
                    SosProgressEvent(
                        step = SosDistributionStep.RSEP_TRANSFERRED,
                        message = "⚡ RSEP TRANSFERRED to ${device.name} via ${device.transport} (${transfer.bytesTransferred} bytes).",
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
                delay(400)

                // STEP 4C: AUTOMATIC RELAY THROUGH MESH NODE
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
                delay(500)

                // STEP 4D: CHECK IF TARGET NODE IS AN INTERNET GATEWAY
                if (device.isInternetGateway) {
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
                    delay(500)

                    val delivery = InternetGatewayManager.ingestAndDeliverRsep(currentPacket, device.deviceId)

                    emitProgress(
                        SosProgressEvent(
                            step = SosDistributionStep.SOS_DELIVERED,
                            message = "✅ SOS DELIVERED TO EMERGENCY SERVER via ${device.name}! Incident ID: ${delivery.incidentId}",
                            packetId = packetId,
                            hopCount = index + 1,
                            ttl = (currentPacket.header.ttl - 1).coerceAtLeast(0),
                            currentNodeId = device.deviceId,
                            isGateway = true,
                            gatewayNodeId = device.deviceId,
                            timestamp = getCurrentTimestamp()
                        )
                    )
                    _isDelivered.value = true
                    break // Destination reached! Stop further relaying.
                }
            }
        }

        isRunning = false
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
