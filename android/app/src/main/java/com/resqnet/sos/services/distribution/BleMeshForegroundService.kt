package com.resqnet.sos.services.distribution

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class BleMeshForegroundService : Service() {

    override fun onCreate() {
        super.onCreate()
        println("[BleMeshForegroundService] 🚀 Starting Foreground BLE Mesh Service...")
        startForegroundNotification()
        NativeBleMeshEngine.init(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startForegroundNotification() {
        val channelId = "ble_mesh_foreground_channel"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val channel = NotificationChannel(
            channelId,
            "ResQNet BLE Emergency Mesh",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Active background Bluetooth LE emergency mesh node service"
        }
        notificationManager.createNotificationChannel(channel)

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setContentTitle("ResQNet Emergency BLE Mesh Active")
            .setContentText("Listening & advertising for nearby emergency distress signals...")
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
                startForeground(1001, notification, serviceType)
            } else {
                startForeground(1001, notification)
            }
        } else {
            startForeground(1001, notification)
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
                e.printStackTrace()
            }
        }
    }
}
