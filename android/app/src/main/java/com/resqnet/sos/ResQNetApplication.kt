package com.resqnet.sos

import android.app.Application

class ResQNetApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        println("[ResQNetApplication] 🚀 Initialized Native Android Emergency SOS System.")
    }
}
