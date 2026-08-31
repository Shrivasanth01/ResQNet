package com.resqnet.sos.services.distribution

import android.content.Context
import com.resqnet.sos.data.local.RsepStorageManager
import com.resqnet.sos.data.model.RsepPacket

/**
 * MODULE 1: EXISTING RSEP MANAGER
 * 
 * CORE REQUIREMENT:
 * - Loads the EXISTING RSEP file from storage.
 * - Zero user file-selection dialogs.
 * - Zero regeneration or modification of the emergency dossier.
 */
class ExistingRsepManager(private val context: Context) {

    private val storageManager = RsepStorageManager(context)

    fun getExistingRsep(): RsepPacket {
        val packet = storageManager.getExistingRsep()
        println("[ExistingRsepManager] ✅ Retrieved existing RSEP file (Packet ID: ${packet.header.packetId})")
        return packet
    }
}
