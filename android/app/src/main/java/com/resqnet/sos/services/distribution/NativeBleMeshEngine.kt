package com.resqnet.sos.services.distribution

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.ParcelUuid
import com.resqnet.sos.data.local.ReceivedIncidentsVault
import com.resqnet.sos.data.model.RsepPacket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
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
    private val incomingReassemblyBuffers = ConcurrentHashMap<String, StringBuilder>()

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

    private val _logs = MutableStateFlow<List<String>>(emptyList())
    val logs: StateFlow<List<String>> = _logs.asStateFlow()

    private fun addLog(message: String) {
        val timestamp = java.text.SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val entry = "[$timestamp] $message"
        println("[NativeBleMeshEngine] $entry")
        _logs.value = (_logs.value + entry).takeLast(100)
    }

    fun init(context: Context) {
        if (_isMeshActive.value) return
        appContext = context.applicationContext

        bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        bluetoothAdapter = bluetoothManager?.adapter

        if (bluetoothAdapter == null || !bluetoothAdapter!!.isEnabled) {
            addLog("Bluetooth disabled or unavailable.")
            return
        }

        _isMeshActive.value = true
        _relayStatus.value = "ACTIVE"
        addLog("Initializing Native BLE Emergency Mesh Engine...")

        setupGattServer(context)
        startBleAdvertising()
        startBleScanning(context)
    }

    private fun setupGattServer(context: Context) {
        try {
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
        } catch (e: Exception) {
            addLog("GATT Server setup error: ${e.localizedMessage}")
        }
    }

    private fun startBleAdvertising() {
        try {
            bleAdvertiser = bluetoothAdapter?.bluetoothLeAdvertiser
            if (bleAdvertiser == null) {
                addLog("BLE Advertiser unavailable on this device.")
                return
            }

            val settings = AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setConnectable(true)
                .setTimeout(0)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .build()

            val data = AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .addServiceUuid(ParcelUuid(MESH_SERVICE_UUID))
                .build()

            bleAdvertiser?.startAdvertising(settings, data, advertiseCallback)
            addLog("BLE Advertising started for Mesh Service UUID.")
        } catch (e: Exception) {
            addLog("BLE Advertising error: ${e.localizedMessage}")
        }
    }

    private fun startBleScanning(context: Context) {
        try {
            bleScanner = bluetoothAdapter?.bluetoothLeScanner
            if (bleScanner == null) {
                addLog("BLE Scanner unavailable.")
                return
            }

            val filters = listOf(
                ScanFilter.Builder()
                    .setServiceUuid(ParcelUuid(MESH_SERVICE_UUID))
                    .build()
            )

            val settings = ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build()

            bleScanner?.startScan(filters, settings, scanCallback)
            addLog("BLE Scanning started for nearby ResQNet mesh nodes...")
        } catch (e: Exception) {
            addLog("BLE Scanning error: ${e.localizedMessage}")
        }
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            result?.device?.let { device ->
                val mac = device.address
                addLog("Device discovered: ${device.name ?: "Peer"} ($mac), RSSI: ${result.rssi}dBm")
                _nearbyDevicesCount.value = (_nearbyDevicesCount.value + 1).coerceAtMost(50)

                if (!connectedGattClients.containsKey(mac)) {
                    addLog("Auto-connecting GATT client to $mac...")
                    val gatt = device.connectGatt(appContext, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
                    if (gatt != null) {
                        connectedGattClients[mac] = gatt
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
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                addLog("Device connected: $mac")
                _connectedDevicesCount.value = connectedGattClients.size
                gatt.discoverServices()
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                addLog("Device disconnected: $mac")
                connectedGattClients.remove(mac)
                _connectedDevicesCount.value = connectedGattClients.size
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt?, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                addLog("Mesh GATT Service discovered on ${gatt?.device?.address}")
                gatt?.requestMtu(512)
            }
        }

        override fun onMtuChanged(gatt: BluetoothGatt?, mtu: Int, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                addLog("GATT MTU negotiated: $mtu bytes for ${gatt?.device?.address}")
            }
        }
    }

    private val gattServerCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice?, status: Int, newState: Int) {
            val mac = device?.address ?: return
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                addLog("GATT Server client connected: $mac")
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                addLog("GATT Server client disconnected: $mac")
                incomingReassemblyBuffers.remove(mac)
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

    private fun processIncomingGattChunk(senderMac: String, chunkText: String) {
        val buffer = incomingReassemblyBuffers.getOrPut(senderMac) { StringBuilder() }

        if (chunkText == "EOF") {
            val fullPayload = buffer.toString()
            buffer.clear()

            try {
                val packet = json.decodeFromString<RsepPacket>(fullPayload)
                val packetId = packet.header.packetId

                addLog("Message received via BLE GATT: $packetId from $senderMac")
                _lastReceivedMessageId.value = packetId

                // 1. Check Duplicate Firewall
                if (DuplicateDetectionManager.isDuplicate(packetId, packet.header.hopCount)) {
                    addLog("Duplicate ignored: Packet $packetId already processed.")
                    return
                }

                // 2. Save Packet to Received Vault
                appContext?.let { ctx ->
                    ReceivedIncidentsVault(ctx).saveReceivedPacket(packet)
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
                val jsonPayload = json.encodeToString(packet)
                val packetId = packet.header.packetId
                _lastSentMessageId.value = packetId

                addLog("Broadcasting RSEP ($packetId) over connected BLE GATT peers...")

                val bytes = jsonPayload.toByteArray(Charsets.UTF_8)
                val chunkSize = 180
                val totalBytes = bytes.size
                var offset = 0

                connectedGattClients.values.forEach { gatt ->
                    val service = gatt.getService(MESH_SERVICE_UUID)
                    val characteristic = service?.getCharacteristic(MESH_CHARACTERISTIC_UUID)

                    if (characteristic != null) {
                        while (offset < totalBytes) {
                            val length = (totalBytes - offset).coerceAtMost(chunkSize)
                            val chunk = bytes.copyOfRange(offset, offset + length)

                            characteristic.value = chunk
                            characteristic.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
                            gatt.writeCharacteristic(characteristic)
                            offset += length
                            kotlinx.coroutines.delay(40)
                        }

                        // Send EOF marker
                        characteristic.value = "EOF".toByteArray(Charsets.UTF_8)
                        gatt.writeCharacteristic(characteristic)
                        addLog("GATT MTU transfer complete for $packetId to ${gatt.device.address}")
                    }
                }
            } catch (e: Exception) {
                addLog("BLE GATT Broadcast notice: ${e.localizedMessage}")
            }
        }
    }
}
