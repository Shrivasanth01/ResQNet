package com.resqnet.rescuer.services

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.Build
import android.os.ParcelUuid
import com.resqnet.rescuer.data.RescuerVault
import com.resqnet.sos.data.model.RsepPacket
import com.resqnet.sos.services.distribution.NativeBleMeshEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import java.util.*
import java.util.concurrent.ConcurrentHashMap

@SuppressLint("MissingPermission")
object RescuerBleScanner {

    private val json = Json { ignoreUnknownKeys = true }
    private val scope = CoroutineScope(Dispatchers.IO)

    private var appContext: Context? = null
    private var bluetoothManager: BluetoothManager? = null
    private var bluetoothAdapter: BluetoothAdapter? = null
    private var bleScanner: BluetoothLeScanner? = null

    private val connectedGattClients = ConcurrentHashMap<String, BluetoothGatt>()
    private val incomingReassemblyBuffers = ConcurrentHashMap<String, StringBuilder>()
    private val pendingConnectionMacs = ConcurrentHashMap<String, Long>()

    private val _isScanning = MutableStateFlow(false)
    val isScanning: StateFlow<Boolean> = _isScanning.asStateFlow()

    private val _discoveredVictimsCount = MutableStateFlow(0)
    val discoveredVictimsCount: StateFlow<Int> = _discoveredVictimsCount.asStateFlow()

    private val _logs = MutableStateFlow<List<String>>(emptyList())
    val logs: StateFlow<List<String>> = _logs.asStateFlow()

    private fun addLog(message: String) {
        val timestamp = java.text.SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val entry = "[$timestamp] [RESCUER] $message"
        println(entry)
        _logs.value = (_logs.value + entry).takeLast(100)
    }

    fun init(context: Context) {
        appContext = context.applicationContext

        bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        bluetoothAdapter = bluetoothManager?.adapter

        if (bluetoothAdapter == null || !bluetoothAdapter!!.isEnabled) {
            addLog("Bluetooth disabled. Rescuer mesh scanner idle.")
            _isScanning.value = false
            return
        }

        _isScanning.value = true
        addLog("🚀 Rescuer High-Gain BLE Mesh Scanner initialized.")
        startBleScanning(context)
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
            addLog("BLE Hardware Scanner actively listening for victim SOS beacons...")
        } catch (e: Exception) {
            addLog("BLE Scan error: ${e.localizedMessage}")
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
                val hasServiceUuid = uuids?.any { it.uuid == NativeBleMeshEngine.MESH_SERVICE_UUID || it.toString().contains("FE99", ignoreCase = true) } == true
                val hasRawBytesMarker = hasMeshMarkerInRawBytes(rawBytes)

                val isVictimPeer = hasRawBytesMarker || hasServiceUuid ||
                        record?.deviceName?.contains("ResQNet", ignoreCase = true) == true ||
                        device.name?.contains("ResQNet", ignoreCase = true) == true

                if (isVictimPeer) {
                    val mac = device.address
                    addLog("Victim SOS Beacon discovered: ${device.name ?: "Peer"} ($mac), RSSI: ${result.rssi}dBm")
                    _discoveredVictimsCount.value = (_discoveredVictimsCount.value + 1).coerceAtMost(100)

                    val now = System.currentTimeMillis()
                    val lastAttempt = pendingConnectionMacs[mac] ?: 0L

                    if (!connectedGattClients.containsKey(mac) && (now - lastAttempt > 3000L)) {
                        pendingConnectionMacs[mac] = now
                        addLog("Auto-connecting Rescuer GATT client to $mac...")
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

    private val gattCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt?, status: Int, newState: Int) {
            val mac = gatt?.device?.address ?: return
            pendingConnectionMacs.remove(mac)

            if (newState == BluetoothProfile.STATE_CONNECTED) {
                addLog("Rescuer GATT connected to victim device: $mac")
                scope.launch {
                    kotlinx.coroutines.delay(300)
                    gatt.discoverServices()
                }
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                addLog("Rescuer GATT disconnected from: $mac")
                connectedGattClients.remove(mac)
                try {
                    gatt.disconnect()
                    gatt.close()
                } catch (_: Exception) {}
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt?, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS && gatt != null) {
                addLog("Mesh Services discovered on victim device: ${gatt.device?.address}")
                val service = gatt.getService(NativeBleMeshEngine.MESH_SERVICE_UUID)
                val characteristic = service?.getCharacteristic(NativeBleMeshEngine.MESH_CHARACTERISTIC_UUID)

                if (characteristic != null) {
                    gatt.setCharacteristicNotification(characteristic, true)
                    val cccd = characteristic.getDescriptor(NativeBleMeshEngine.CCCD_UUID)
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

                    val victimMac = gatt.device?.address ?: "UNKNOWN"
                    // Direct GATT Write "REQ" trigger after CCCD handshake
                    scope.launch {
                        delay(800)
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
                            addLog("📤 Transmitted REQ trigger to victim $victimMac")
                        } catch (_: Exception) {}
                    }
                }

                gatt.requestMtu(512)
            }
        }

        override fun onDescriptorWrite(gatt: BluetoothGatt?, descriptor: BluetoothGattDescriptor?, status: Int) {
            val mac = gatt?.device?.address ?: return
            addLog("CCCD Notification Handshake completed for victim $mac")
            scope.launch {
                try {
                    val service = gatt?.getService(NativeBleMeshEngine.MESH_SERVICE_UUID)
                    val char = service?.getCharacteristic(NativeBleMeshEngine.MESH_CHARACTERISTIC_UUID)
                    if (char != null) {
                        val reqBytes = "REQ".toByteArray(Charsets.UTF_8)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            gatt.writeCharacteristic(char, reqBytes, BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE)
                        } else {
                            @Suppress("DEPRECATION")
                            char.value = reqBytes
                            char.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
                            @Suppress("DEPRECATION")
                            gatt.writeCharacteristic(char)
                        }
                    }
                } catch (_: Exception) {}
            }
        }

        @Suppress("DEPRECATION")
        override fun onCharacteristicChanged(gatt: BluetoothGatt?, characteristic: BluetoothGattCharacteristic?) {
            if (characteristic?.uuid == NativeBleMeshEngine.MESH_CHARACTERISTIC_UUID && characteristic.value != null) {
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
            if (characteristic.uuid == NativeBleMeshEngine.MESH_CHARACTERISTIC_UUID) {
                val mac = gatt.device?.address ?: "UNKNOWN"
                val chunkText = String(value, Charsets.UTF_8)
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

                addLog("✅ Victim SOS Dossier Ingested: $packetId for ${packet.user.name}")

                appContext?.let { ctx ->
                    RescuerVault(ctx).saveVictimRecord(packet)
                }
            } catch (e: Exception) {
                addLog("GATT Chunk Parse Error: ${e.localizedMessage}")
            }
        } else {
            buffer.append(chunkText)
        }
    }
}
