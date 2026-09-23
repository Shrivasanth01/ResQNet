package com.resqnet.rescuer.services

import android.Manifest
import android.R
import android.app.*
import android.bluetooth.BluetoothAdapter
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.resqnet.rescuer.data.RescuerVault
import com.resqnet.sos.data.model.RsepPacket
import com.resqnet.sos.services.distribution.AndroidMeshListener
import kotlinx.serialization.json.Json

class RescuerMeshService : Service() {

    private val radioStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val ctx = context ?: return
            when (intent?.action) {
                BluetoothAdapter.ACTION_STATE_CHANGED -> {
                    val state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)
                    if (state == BluetoothAdapter.STATE_ON) {
                        println("[RescuerMeshService] 📡 Bluetooth turned ON! Starting Rescuer BLE Scanner...")
                        RescuerBleScanner.init(ctx)
                    }
                }
                "com.resqnet.rescuer.ACTION_INGEST_VICTIM_SOS" -> {
                    val rsepJson = intent.getStringExtra("rsep_json")
                    if (!rsepJson.isNullOrEmpty()) {
                        try {
                            val json = Json { ignoreUnknownKeys = true }
                            val packet = json.decodeFromString<RsepPacket>(rsepJson)
                            RescuerVault(ctx).saveVictimRecord(packet)
                            println("[RescuerMeshService] 📥 Inter-process Ingested victim SOS packet (${packet.header.packetId}) for ${packet.user.name}")
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        println("[RescuerMeshService] 🚀 Starting Rescuer Mesh Foreground Service...")
        startForegroundNotification()

        try {
            val filter = IntentFilter().apply {
                addAction(BluetoothAdapter.ACTION_STATE_CHANGED)
                addAction("com.resqnet.rescuer.ACTION_INGEST_VICTIM_SOS")
            }
            ContextCompat.registerReceiver(this, radioStateReceiver, filter, ContextCompat.RECEIVER_EXPORTED)
        } catch (e: Exception) {
            println("[RescuerMeshService] ⚠️ Receiver registration warning: ${e.localizedMessage}")
        }

        try {
            RescuerBleScanner.init(this)
            AndroidMeshListener.startListening(this)
            println("[RescuerMeshService] 📡 Dual Rescuer Mesh Ingestion Active (BLE GATT + UDP Socket).")
        } catch (e: Exception) {
            println("[RescuerMeshService] ⚠️ Scanner init warning: ${e.localizedMessage}")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(radioStateReceiver)
        } catch (_: Exception) {}
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startForegroundNotification() {
        val channelId = "rescuer_mesh_foreground_channel"
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        val channel = NotificationChannel(
            channelId,
            "ResQNet Rescuer Mesh Scanner",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Active background rescuer high-gain BLE mesh scanner"
        }
        notificationManager.createNotificationChannel(channel)

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.stat_sys_data_bluetooth)
            .setContentTitle("ResQNet Rescuer Mesh Active")
            .setContentText("Passively scanning for nearby victim emergency distress beacons...")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        val hasBtConnectPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                if (hasBtConnectPermission) {
                    startForeground(2001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
                } else {
                    startForeground(2001, notification)
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(2001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
            } else {
                startForeground(2001, notification)
            }
        } catch (e: Exception) {
            println("[RescuerMeshService] ⚠️ startForeground warning: ${e.localizedMessage}")
            try {
                startForeground(2001, notification)
            } catch (e2: Exception) {
                println("[RescuerMeshService] ⚠️ Fallback startForeground error: ${e2.localizedMessage}")
            }
        }
    }

    companion object {
        fun startService(context: Context) {
            try {
                val intent = Intent(context, RescuerMeshService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                println("[RescuerMeshService] ⚠️ Could not start foreground service: ${e.localizedMessage}")
            }
        }
    }
}
