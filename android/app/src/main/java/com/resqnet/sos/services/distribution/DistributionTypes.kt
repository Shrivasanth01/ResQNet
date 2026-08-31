package com.resqnet.sos.services.distribution

enum class SosDistributionStep {
    IDLE,
    SOS_ACTIVATED,
    RSEP_FOUND,
    SEARCHING_FOR_NEARBY_DEVICES,
    DEVICE_FOUND,
    RSEP_TRANSFERRED,
    RELAYING,
    ANOTHER_DEVICE_FOUND,
    INTERNET_GATEWAY_FOUND,
    SOS_DELIVERED
}

data class SosProgressEvent(
    val step: SosDistributionStep,
    val message: String,
    val packetId: String,
    val hopCount: Int,
    val ttl: Int,
    val currentNodeId: String,
    val targetDeviceId: String? = null,
    val targetDeviceName: String? = null,
    val transport: String? = null,
    val isGateway: Boolean = false,
    val gatewayNodeId: String? = null,
    val timestamp: String = ""
)

data class MeshParticipatingDevice(
    val deviceId: String,
    val name: String,
    val transport: String, // "BLE", "WIFI_DIRECT", "LOCAL_WIFI"
    val rssi: Int,
    val batteryLevel: Int,
    val isInternetGateway: Boolean = false,
    val hopDistance: Int = 1
)

data class SosDistributionResult(
    val success: Boolean,
    val packetId: String,
    val hops: Int,
    val deliveredToGateway: Boolean,
    val gatewayNodeId: String? = null,
    val relayChain: List<String> = emptyList(),
    val history: List<SosProgressEvent> = emptyList()
)
