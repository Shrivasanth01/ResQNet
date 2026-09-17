package com.resqnet.rescuer.services

import android.app.*
import android.bluetooth.BluetoothAdapter
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class RescuerMeshService : Service() {

    private val radioStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                BluetoothAdapter.ACTION_STATE_CHANGED -> {
                    val state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)
                    if (state == BluetoothAdapter.STATE_ON) {
                        println("[RescuerMeshService] 📡 Bluetooth turned ON! Starting Rescuer BLE Scanner...")
                        context?.let {
                            RescuerBleScanner.init(it)
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

        val filter = IntentFilter().apply {
            addAction(BluetoothAdapter.ACTION_STATE_CHANGED)
        }
        registerReceiver(radioStateReceiver, filter)

        RescuerBleScanner.init(this)
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
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val channel = NotificationChannel(
            channelId,
            "ResQNet Rescuer Mesh Scanner",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Active background rescuer high-gain BLE mesh scanner"
        }
        notificationManager.createNotificationChannel(channel)

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setContentTitle("ResQNet Rescuer Mesh Active")
            .setContentText("Passively scanning for nearby victim emergency distress beacons...")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val serviceType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
            } else {
                0
            }
            if (serviceType != 0) {
                startForeground(2001, notification, serviceType)
            } else {
                startForeground(2001, notification)
            }
        } else {
            startForeground(2001, notification)
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
                e.printStackTrace()
            }
        }
    }
}
