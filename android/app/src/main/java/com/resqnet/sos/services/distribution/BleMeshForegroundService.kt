package com.resqnet.sos.services.distribution

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

class BleMeshForegroundService : Service() {

    private val radioStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                BluetoothAdapter.ACTION_STATE_CHANGED -> {
                    val state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)
                    if (state == BluetoothAdapter.STATE_ON) {
                        println("[BleMeshForegroundService] 📡 Bluetooth turned ON! Initializing BLE Mesh Engine...")
                        context?.let {
                            NativeBleMeshEngine.init(it)
                            AndroidMeshListener.startListening(it)
                        }
                    } else if (state == BluetoothAdapter.STATE_OFF) {
                        println("[BleMeshForegroundService] ⚠️ Bluetooth turned OFF!")
                    }
                }
                Intent.ACTION_AIRPLANE_MODE_CHANGED -> {
                    println("[BleMeshForegroundService] ✈️ Airplane Mode state changed! Re-evaluating mesh engine...")
                    context?.let {
                        NativeBleMeshEngine.init(it)
                        AndroidMeshListener.startListening(it)
                    }
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        println("[BleMeshForegroundService] 🚀 Starting Foreground BLE Mesh Service...")
        startForegroundNotification()

        try {
            val filter = IntentFilter().apply {
                addAction(BluetoothAdapter.ACTION_STATE_CHANGED)
                addAction(Intent.ACTION_AIRPLANE_MODE_CHANGED)
            }
            registerReceiver(radioStateReceiver, filter)
        } catch (e: Exception) {
            println("[BleMeshForegroundService] ⚠️ Receiver registration warning: ${e.localizedMessage}")
        }

        try {
            NativeBleMeshEngine.init(this)
            AndroidMeshListener.startListening(this)
        } catch (e: Exception) {
            println("[BleMeshForegroundService] ⚠️ Engine init warning: ${e.localizedMessage}")
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
        val channelId = "ble_mesh_foreground_channel"
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        val channel = NotificationChannel(
            channelId,
            "ResQNet BLE Emergency Mesh",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Active background Bluetooth LE emergency mesh node service"
        }
        notificationManager.createNotificationChannel(channel)

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.stat_sys_data_bluetooth)
            .setContentTitle("ResQNet Emergency BLE Mesh Active")
            .setContentText("Listening & advertising for nearby emergency distress signals...")
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
                    startForeground(1001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
                } else {
                    startForeground(1001, notification)
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(1001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
            } else {
                startForeground(1001, notification)
            }
        } catch (e: Exception) {
            println("[BleMeshForegroundService] ⚠️ startForeground warning: ${e.localizedMessage}")
            try {
                startForeground(1001, notification)
            } catch (e2: Exception) {
                println("[BleMeshForegroundService] ⚠️ Fallback startForeground error: ${e2.localizedMessage}")
            }
        }
    }

    companion object {
        fun startService(context: Context) {
            try {
                val intent = Intent(context, BleMeshForegroundService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                println("[BleMeshForegroundService] ⚠️ Could not start foreground service: ${e.localizedMessage}")
            }
        }
    }
}
