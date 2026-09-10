package com.resqnet.sos.services.distribution

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.Build
import android.os.ParcelUuid
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.data.local.ReceivedIncidentsVault
import com.resqnet.sos.data.local.RsepStorageManager
import com.resqnet.sos.data.local.SosMessageQueueManager
import com.resqnet.sos.data.model.RsepPacket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.*
import java.util.concurrent.ConcurrentHashMap

@SuppressLint("MissingPermission")
object NativeBleMeshEngine {

    val MESH_SERVICE_UUID: UUID = UUID.fromString("0000FE99-0000-1000-8000-00805F9B34FB")
    val MESH_CHARACTERISTIC_UUID: UUID = UUID.fromString("0000FE9A-0000-1000-8000-00805F9B34FB")
    val CCCD_UUID: UUID = UUID.fromString("00002902-0000-1000-8000-00805F9B34FB")

    private val json = Json { ignoreUnknownKeys = true }
    private val scope = CoroutineScope(Dispatchers.IO)

    private var appContext: Context? = null
    private var bluetoothManager: BluetoothManager? = null
    private var bluetoothAdapter: BluetoothAdapter? = null

    private var bleScanner: BluetoothLeScanner? = null
    private var bleAdvertiser: BluetoothLeAdvertiser? = null
    private var gattServer: BluetoothGattServer? = null

    private val connectedGattClients = ConcurrentHashMap<String, BluetoothGatt>()
    private val connectedGattServerDevices = ConcurrentHashMap<String, BluetoothDevice>()
    private val incomingReassemblyBuffers = ConcurrentHashMap<String, StringBuilder>()
    private val pendingConnectionMacs = ConcurrentHashMap<String, Long>()

    private var activeRsepPacket: RsepPacket? = null

    // StateFlow Monitoring Indicators
    private val _isMeshActive = MutableStateFlow(false)
    val isMeshActive: StateFlow<Boolean> = _isMeshActive.asStateFlow()

    private val _nearbyDevicesCount = MutableStateFlow(0)
    val nearbyDevicesCount: StateFlow<Int> = _nearbyDevicesCount.asStateFlow()

    private val _connectedDevicesCount = MutableStateFlow(0)
    val connectedDevicesCount: StateFlow<Int> = _connectedDevicesCount.asStateFlow()

    private val _lastSentMessageId = MutableStateFlow("")
    val lastSentMessageId: StateFlow<String> = _lastSentMessageId.asStateFlow()

    private val _lastReceivedMessageId = MutableStateFlow("")
    val lastReceivedMessageId: StateFlow<String> = _lastReceivedMessageId.asStateFlow()

    private val _relayStatus = MutableStateFlow("IDLE")
    val relayStatus: StateFlow<String> = _relayStatus.asStateFlow()

    private val _relayedMessagesCount = MutableStateFlow(0)
    val relayedMessagesCount: StateFlow<Int> = _relayedMessagesCount.asStateFlow()

    private val _logs = MutableStateFlow<List<String>>(emptyList())
    val logs: StateFlow<List<String>> = _logs.asStateFlow()

    private fun addLog(message: String) {
        val timestamp = java.text.SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val entry = "[$timestamp] $message"
        println("[NativeBleMeshEngine] $entry")
        _logs.value = (_logs.value + entry).takeLast(100)
    }

    fun init(context: Context) {
        appContext = context.applicationContext

        bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        bluetoothAdapter = bluetoothManager?.adapter

        if (bluetoothAdapter == null || !bluetoothAdapter!!.isEnabled) {
            _isMeshActive.value = false
            _relayStatus.value = "BLUETOOTH_DISABLED"
            addLog("⚠️ Bluetooth is disabled or turned off by Airplane Mode. Turn Bluetooth ON to activate offline BLE mesh.")
            return
        }

        _isMeshActive.value = true
        _relayStatus.value = "ACTIVE"
        addLog("🚀 Initializing Native BLE Emergency Mesh Engine...")
        setupGattServer(context)

        startBleAdvertising()
        startBleScanning(context)
    }

    private fun setupGattServer(context: Context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                androidx.core.content.ContextCompat.checkSelfPermission(context, android.Manifest.permission.BLUETOOTH_CONNECT) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                addLog("BLUETOOTH_CONNECT permission missing for GATT Server.")
                return
            }
            if (gattServer == null) {
                gattServer = bluetoothManager?.openGattServer(context, gattServerCallback)
                val service = BluetoothGattService(MESH_SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)

                val characteristic = BluetoothGattCharacteristic(
                    MESH_CHARACTERISTIC_UUID,
                    BluetoothGattCharacteristic.PROPERTY_READ or
                            BluetoothGattCharacteristic.PROPERTY_WRITE or
                            BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE or
                            BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                    BluetoothGattCharacteristic.PERMISSION_READ or BluetoothGattCharacteristic.PERMISSION_WRITE
                )

                val cccd = BluetoothGattDescriptor(
                    CCCD_UUID,
                    BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE
                )
                characteristic.addDescriptor(cccd)
                service.addCharacteristic(characteristic)

                gattServer?.addService(service)
                addLog("GATT Server opened on Service UUID: $MESH_SERVICE_UUID")
            }
        } catch (e: Exception) {
            addLog("GATT Server setup error: ${e.localizedMessage}")
        }
    }

    const val MESH_MANUFACTURER_ID = 0xFE99

    private fun startBleAdvertising() {
        try {
            val ctx = appContext ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                androidx.core.content.ContextCompat.checkSelfPermission(ctx, android.Manifest.permission.BLUETOOTH_ADVERTISE) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                addLog("BLUETOOTH_ADVERTISE permission missing.")
                return
            }

            bleAdvertiser = bluetoothAdapter?.bluetoothLeAdvertiser
            if (bleAdvertiser == null) {
                addLog("BLE Advertiser unavailable on this device.")
                return
            }

            try {
                bleAdvertiser?.stopAdvertising(advertiseCallback)
            } catch (_: Exception) {}

            val settings = AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setConnectable(true)
                .setTimeout(0)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .build()

            // Add 16-bit Service UUID to primary data payload for 100% universal hardware advertising
            val data = AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .setIncludeTxPowerLevel(false)
                .addServiceUuid(ParcelUuid(MESH_SERVICE_UUID))
                .build()

            val scanResponse = AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .setIncludeTxPowerLevel(false)
                .addServiceUuid(ParcelUuid(MESH_SERVICE_UUID))
                .build()

            bleAdvertiser?.startAdvertising(settings, data, scanResponse, advertiseCallback)
            addLog("BLE Advertising active for Mesh Service UUID: $MESH_SERVICE_UUID.")
        } catch (e: Exception) {
            addLog("BLE Advertising error: ${e.localizedMessage}")
        }
    }

    private fun startBleScanning(context: Context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                androidx.core.content.ContextCompat.checkSelfPermission(context, android.Manifest.permission.BLUETOOTH_SCAN) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                addLog("BLUETOOTH_SCAN permission missing.")
                return
            }

            bleScanner = bluetoothAdapter?.bluetoothLeScanner
            if (bleScanner == null) {
                addLog("BLE Scanner unavailable.")
                return
            }

            try {
                bleScanner?.stopScan(scanCallback)
            } catch (_: Exception) {}

            val settings = ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .setMatchMode(ScanSettings.MATCH_MODE_AGGRESSIVE)
                .build()

            bleScanner?.startScan(null, settings, scanCallback)
            addLog("BLE Hardware Scanner active for nearby ResQNet mesh nodes...")
        } catch (e: Exception) {
            addLog("BLE Scanning error: ${e.localizedMessage}")
        }
    }

    private fun hasMeshMarkerInRawBytes(bytes: ByteArray?): Boolean {
        if (bytes == null || bytes.size < 4) return false
        for (i in 0 until bytes.size - 1) {
            val b1 = bytes[i].toInt() and 0xFF
            val b2 = bytes[i + 1].toInt() and 0xFF
            if ((b1 == 0x99 && b2 == 0xFE) || (b1 == 0xFE && b2 == 0x99)) {
                return true
            }
        }
        return false
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            result?.device?.let { device ->
                val record = result.scanRecord
                val rawBytes = record?.bytes

                val uuids = record?.serviceUuids
                val hasServiceUuid = uuids?.any { it.uuid == MESH_SERVICE_UUID || it.toString().contains("FE99", ignoreCase = true) } == true
                val hasRawBytesMarker = hasMeshMarkerInRawBytes(rawBytes)

                val isResQNetPeer = hasRawBytesMarker || hasServiceUuid ||
                        record?.deviceName?.contains("ResQNet", ignoreCase = true) == true ||
                        device.name?.contains("ResQNet", ignoreCase = true) == true

                if (isResQNetPeer) {
                    val mac = device.address
                    addLog("ResQNet Mesh Peer discovered: ${device.name ?: "Peer"} ($mac), RSSI: ${result.rssi}dBm")
                    _nearbyDevicesCount.value = (_nearbyDevicesCount.value + 1).coerceAtMost(50)

                    val now = System.currentTimeMillis()
                    val lastAttempt = pendingConnectionMacs[mac] ?: 0L

                    if (!connectedGattClients.containsKey(mac) && (now - lastAttempt > 3000L)) {
                        pendingConnectionMacs[mac] = now
                        addLog("Auto-connecting GATT client to $mac...")
                        val gatt = device.connectGatt(appContext, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
                        if (gatt != null) {
                            connectedGattClients[mac] = gatt
                        } else {
                            pendingConnectionMacs.remove(mac)
                        }
                    }
                }
            }
        }
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            addLog("BLE Advertiser active on hardware.")
        }

        override fun onStartFailure(errorCode: Int) {
            addLog("BLE Advertiser failed with error code $errorCode.")
        }
    }

    private val gattCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt?, status: Int, newState: Int) {
            val mac = gatt?.device?.address ?: return
            pendingConnectionMacs.remove(mac)

            if (newState == BluetoothProfile.STATE_CONNECTED) {
                addLog("Device connected: $mac")
                _connectedDevicesCount.value = connectedGattClients.size + connectedGattServerDevices.size
                scope.launch {
                    delay(300)
                    gatt.discoverServices()
                }
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                addLog("Device disconnected: $mac (status=$status)")
                connectedGattClients.remove(mac)
                pendingConnectionMacs.remove(mac)
                _connectedDevicesCount.value = connectedGattClients.size + connectedGattServerDevices.size
                try {
                    gatt.disconnect()
                    gatt.close()
                } catch (e: Exception) {
                    addLog("GATT close error: ${e.localizedMessage}")
                }
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt?, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS && gatt != null) {
                addLog("Mesh GATT Service discovered on ${gatt.device?.address}")
                val service = gatt.getService(MESH_SERVICE_UUID)
                val characteristic = service?.getCharacteristic(MESH_CHARACTERISTIC_UUID)

                if (characteristic != null) {
                    gatt.setCharacteristicNotification(characteristic, true)
                    val cccd = characteristic.getDescriptor(CCCD_UUID)
                    if (cccd != null) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            gatt.writeDescriptor(cccd, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
                        } else {
                            @Suppress("DEPRECATION")
                            cccd.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                            @Suppress("DEPRECATION")
                            gatt.writeDescriptor(cccd)
                        }
                    }

                    // Direct GATT Write "REQ" trigger
                    scope.launch {
                        delay(400)
                        try {
                            val reqBytes = "REQ".toByteArray(Charsets.UTF_8)
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                gatt.writeCharacteristic(characteristic, reqBytes, BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE)
                            } else {
                                @Suppress("DEPRECATION")
                                characteristic.value = reqBytes
                                characteristic.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
                                @Suppress("DEPRECATION")
                                gatt.writeCharacteristic(characteristic)
                            }
                        } catch (_: Exception) {}
                    }
                }

                gatt.requestMtu(512)
            }
        }

        @Suppress("DEPRECATION")
        override fun onCharacteristicRead(gatt: BluetoothGatt?, characteristic: BluetoothGattCharacteristic?, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS && characteristic?.uuid == MESH_CHARACTERISTIC_UUID && characteristic.value != null) {
                val payloadStr = String(characteristic.value, Charsets.UTF_8)
                if (payloadStr.isNotBlank() && payloadStr != "EOF") {
                    try {
                        val packet = json.decodeFromString<RsepPacket>(payloadStr)
                        appContext?.let { ctx ->
                            ReceivedIncidentsVault(ctx).saveReceivedPacket(packet)
                            addLog("✅ Received RSEP via GATT Read from ${packet.user.name}")
                        }
                    } catch (e: Exception) {
                        addLog("GATT Read parse error: ${e.message}")
                    }
                }
            }
        }

        override fun onMtuChanged(gatt: BluetoothGatt?, mtu: Int, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                addLog("GATT MTU negotiated: $mtu bytes for ${gatt?.device?.address}")
            }
        }

        @Suppress("DEPRECATION")
        override fun onCharacteristicChanged(gatt: BluetoothGatt?, characteristic: BluetoothGattCharacteristic?) {
            if (characteristic?.uuid == MESH_CHARACTERISTIC_UUID && characteristic.value != null) {
                val mac = gatt?.device?.address ?: "UNKNOWN"
                val chunkText = String(characteristic.value, Charsets.UTF_8)
                scope.launch {
                    processIncomingGattChunk(mac, chunkText)
                }
            }
        }

        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray
        ) {
            if (characteristic.uuid == MESH_CHARACTERISTIC_UUID) {
                val mac = gatt.device?.address ?: "UNKNOWN"
                val chunkText = String(value, Charsets.UTF_8)
                scope.launch {
                    processIncomingGattChunk(mac, chunkText)
                }
            }
        }
    }

    private fun notifyPeerDevice(device: BluetoothDevice, characteristic: BluetoothGattCharacteristic, valueBytes: ByteArray) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                gattServer?.notifyCharacteristicChanged(device, characteristic, false, valueBytes)
            } else {
                @Suppress("DEPRECATION")
                characteristic.value = valueBytes
                @Suppress("DEPRECATION")
                gattServer?.notifyCharacteristicChanged(device, characteristic, false)
            }
        } catch (e: Exception) {
            addLog("GATT Notify error for ${device.address}: ${e.localizedMessage}")
        }
    }

    private val gattServerCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice?, status: Int, newState: Int) {
            val mac = device?.address ?: return
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                addLog("GATT Server client connected: $mac")
                connectedGattServerDevices[mac] = device
                _connectedDevicesCount.value = connectedGattClients.size + connectedGattServerDevices.size

                val active = activeRsepPacket
                if (active != null) {
                    scope.launch {
                        delay(600)
                        addLog("Auto-transmitting active SOS to newly connected peer $mac...")
                        broadcastRsep(active)
                    }
                }
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                addLog("GATT Server client disconnected: $mac")
                connectedGattServerDevices.remove(mac)
                incomingReassemblyBuffers.remove(mac)
                _connectedDevicesCount.value = connectedGattClients.size + connectedGattServerDevices.size
            }
        }

        override fun onDescriptorWriteRequest(
            device: BluetoothDevice?,
            requestId: Int,
            descriptor: BluetoothGattDescriptor?,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?
        ) {
            if (responseNeeded) {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
            }
            if (descriptor?.uuid == CCCD_UUID) {
                addLog("CCCD Notification Descriptor enabled for client ${device?.address}")
            }
        }

        override fun onDescriptorReadRequest(
            device: BluetoothDevice?,
            requestId: Int,
            offset: Int,
            descriptor: BluetoothGattDescriptor?
        ) {
            gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
        }

        override fun onCharacteristicReadRequest(
            device: BluetoothDevice?,
            requestId: Int,
            offset: Int,
            characteristic: BluetoothGattCharacteristic?
        ) {
            if (characteristic?.uuid == MESH_CHARACTERISTIC_UUID) {
                val active = activeRsepPacket
                if (active != null) {
                    val bytes = json.encodeToString(active).toByteArray(Charsets.UTF_8)
                    val responseBytes = if (offset < bytes.size) bytes.copyOfRange(offset, bytes.size) else byteArrayOf()
                    gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, responseBytes)
                } else {
                    gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, byteArrayOf())
                }
            } else {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_FAILURE, offset, null)
            }
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice?,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic?,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?
        ) {
            if (characteristic?.uuid == MESH_CHARACTERISTIC_UUID && value != null) {
                val mac = device?.address ?: "UNKNOWN"
                val chunkText = String(value, Charsets.UTF_8)

                if (responseNeeded) {
                    gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
                }

                scope.launch {
                    processIncomingGattChunk(mac, chunkText)
                }
            }
        }
    }

    fun stopBroadcast() {
        activeRsepPacket = null
        _relayStatus.value = "IDLE"
        addLog("🛑 Cleared active SOS broadcast packet.")
    }

    private fun processIncomingGattChunk(senderMac: String, chunkText: String) {
        if (chunkText.startsWith("ACK:")) {
            val ackPacketId = chunkText.removePrefix("ACK:")
            addLog("✅ ACK CONFIRMED from $senderMac for packet $ackPacketId!")
            appContext?.let { ctx ->
                SosMessageQueueManager(ctx).markAsAcked(ackPacketId)
            }
            return
        }

        val buffer = incomingReassemblyBuffers.getOrPut(senderMac) { StringBuilder() }

        if (chunkText == "EOF") {
            val fullPayload = buffer.toString()
            buffer.clear()

            try {
                val packet = json.decodeFromString<RsepPacket>(fullPayload)
                val packetId = packet.header.packetId

                // Filter out self-loopback packets
                val ctx = appContext
                val activeSosId = ctx?.let { RsepStorageManager(it).getActiveSosPacketId() }

                if (activeSosId != null && packet.header.packetId == activeSosId) {
                    addLog("🛑 Ignored local loopback packet from self (${packet.header.packetId})")
                    return
                }

                addLog("✅ Message received via BLE GATT: $packetId from $senderMac")
                _lastReceivedMessageId.value = packetId

                // 1. Save Packet to Received Vault FIRST so the receiving user always gets the alert
                appContext?.let { c ->
                    ReceivedIncidentsVault(c).saveReceivedPacket(packet)
                    addLog("💾 Saved received SOS packet $packetId to Local Vault!")
                }

                // 2. Emit ACK back to sender immediately
                val service = gattServer?.getService(MESH_SERVICE_UUID)
                val characteristic = service?.getCharacteristic(MESH_CHARACTERISTIC_UUID)
                if (characteristic != null) {
                    val ackDevice = connectedGattServerDevices[senderMac]
                    if (ackDevice != null) {
                        notifyPeerDevice(ackDevice, characteristic, "ACK:$packetId".toByteArray(Charsets.UTF_8))
                        addLog("📤 Emitted ACK for packet $packetId to $senderMac")
                    }
                }

                // 2. Check Duplicate Firewall for multi-hop relay forwarding
                if (DuplicateDetectionManager.isDuplicate(packetId, packet.header.hopCount)) {
                    addLog("Duplicate ignored: Packet $packetId already processed for relay.")
                    return
                }

                // 3. Multi-Hop Mesh Relay Logic
                if (TtlManager.canRelay(packet)) {
                    _relayStatus.value = "RELAYING"
                    val myNodeId = DeviceDiscoveryManager.getMyNodeId()
                    val updatedPacket = TtlManager.decrementTtl(packet, myNodeId)

                    addLog("Relaying packet $packetId to nearby connected BLE peers (TTL=${updatedPacket.header.ttl})...")
                    broadcastRsep(updatedPacket)
                    _relayStatus.value = "ACTIVE"
                } else {
                    addLog("TTL expired for packet $packetId. Relaying halted.")
                }
            } catch (e: Exception) {
                addLog("GATT Payload validation/parse error: ${e.localizedMessage}")
            }
        } else {
            buffer.append(chunkText)
        }
    }

    fun broadcastRsep(packet: RsepPacket) {
        scope.launch {
            try {
                appContext?.let { ctx ->
                    init(ctx)
                }
                activeRsepPacket = packet
                val jsonPayload = json.encodeToString(packet)
                val packetId = packet.header.packetId
                _lastSentMessageId.value = packetId

                addLog("Broadcasting RSEP ($packetId) over connected BLE GATT peers & server...")

                val bytes = jsonPayload.toByteArray(Charsets.UTF_8)
                val chunkSize = 180
                val totalBytes = bytes.size

                // 1. Notify connected GATT Server Devices (chunked notifications + EOF)
                val service = gattServer?.getService(MESH_SERVICE_UUID)
                val characteristic = service?.getCharacteristic(MESH_CHARACTERISTIC_UUID)
                if (characteristic != null) {
                    connectedGattServerDevices.values.forEach { device ->
                        try {
                            var offset = 0
                            while (offset < totalBytes) {
                                val length = (totalBytes - offset).coerceAtMost(chunkSize)
                                val chunk = bytes.copyOfRange(offset, offset + length)
                                notifyPeerDevice(device, characteristic, chunk)
                                offset += length
                                delay(40)
                            }

                            // Send EOF marker chunk
                            notifyPeerDevice(device, characteristic, "EOF".toByteArray(Charsets.UTF_8))
                            addLog("GATT notification MTU transfer complete for $packetId to ${device.address}")
                        } catch (e: Exception) {
                            addLog("GATT Notify error: ${e.localizedMessage}")
                        }
                    }
                }

                // 2. Write to connected GATT Clients (chunked writes + EOF)
                connectedGattClients.values.forEach { gatt ->
                    val clientService = gatt.getService(MESH_SERVICE_UUID)
                    val clientChar = clientService?.getCharacteristic(MESH_CHARACTERISTIC_UUID)

                    if (clientChar != null) {
                        var offset = 0
                        while (offset < totalBytes) {
                            val length = (totalBytes - offset).coerceAtMost(chunkSize)
                            val chunk = bytes.copyOfRange(offset, offset + length)

                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                gatt.writeCharacteristic(clientChar, chunk, BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE)
                            } else {
                                clientChar.value = chunk
                                clientChar.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
                                @Suppress("DEPRECATION")
                                gatt.writeCharacteristic(clientChar)
                            }
                            offset += length
                            delay(40)
                        }

                        // Send EOF marker
                        val eofChunk = "EOF".toByteArray(Charsets.UTF_8)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            gatt.writeCharacteristic(clientChar, eofChunk, BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE)
                        } else {
                            clientChar.value = eofChunk
                            clientChar.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
                            @Suppress("DEPRECATION")
                            gatt.writeCharacteristic(clientChar)
                        }
                        addLog("GATT MTU transfer complete for $packetId to ${gatt.device.address}")
                    }
                }
            } catch (e: Exception) {
                addLog("BLE GATT Broadcast notice: ${e.localizedMessage}")
            }
        }
    }
}
