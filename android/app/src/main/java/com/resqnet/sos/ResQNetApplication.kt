package com.resqnet.sos

import android.app.Application

import com.resqnet.sos.services.distribution.AndroidMeshListener
import com.resqnet.sos.services.distribution.BleMeshForegroundService

class ResQNetApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        println("[ResQNetApplication] 🚀 Initialized Native Android Emergency SOS System.")
        AndroidMeshListener.startListening(this)
        BleMeshForegroundService.startService(this)
    }
}
