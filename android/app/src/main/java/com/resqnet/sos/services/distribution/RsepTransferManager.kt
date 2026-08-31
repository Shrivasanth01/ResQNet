package com.resqnet.sos.services.distribution

import com.resqnet.sos.data.model.RsepPacket
import kotlinx.coroutines.delay
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

data class TransferResult(
    val success: Boolean,
    val bytesTransferred: Int,
    val transferTimeMs: Long,
    val transport: String,
    val error: String? = null
)

/**
 * MODULE 5: RSEP TRANSFER MANAGER
 * 
 * CORE REQUIREMENT:
 * - Automatically sends the EXISTING RSEP file.
 * - Does not alter or re-generate the emergency dossier content.
 * - Simulates BLE GATT chunking / Wi-Fi Direct streaming, ready for native BluetoothGattCallback.
 */
object RsepTransferManager {

    private val json = Json { ignoreUnknownKeys = true }

    suspend fun transferRsep(
        packet: RsepPacket,
        targetDevice: MeshParticipatingDevice
    ): TransferResult {
        val startTime = System.currentTimeMillis()
        println("[RsepTransferManager] 📤 Automatically transferring existing RSEP (${packet.header.packetId}) to ${targetDevice.name} via ${targetDevice.transport}...")

        // 1. Establish zero-touch auto connection
        val isConnected = ConnectionManager.autoConnect(targetDevice)
        if (!isConnected) {
            return TransferResult(
                success = false,
                bytesTransferred = 0,
                transferTimeMs = System.currentTimeMillis() - startTime,
                transport = targetDevice.transport,
                error = "Failed to establish automatic connection."
            )
        }

        // 2. Serialize existing RSEP to byte payload
        val jsonPayload = json.encodeToString(packet)
        val byteSize = jsonPayload.toByteArray().size

        if (targetDevice.transport == "BLE") {
            // BLE GATT Chunks (512-byte MTU)
            val chunkCount = (byteSize / 512) + 1
            println("[RsepTransferManager] Transmitting $chunkCount BLE GATT MTU chunks ($byteSize bytes)...")
            delay(180)
        } else {
            // Wi-Fi Direct socket stream
            println("[RsepTransferManager] Streaming high-speed Wi-Fi Direct socket payload ($byteSize bytes)...")
            delay(80)
        }

        val elapsed = System.currentTimeMillis() - startTime
        println("[RsepTransferManager] ✅ RSEP (${packet.header.packetId}) transferred successfully to ${targetDevice.name} in ${elapsed}ms ($byteSize bytes)")

        return TransferResult(
            success = true,
            bytesTransferred = byteSize,
            transferTimeMs = elapsed,
            transport = targetDevice.transport
        )
    }
}
