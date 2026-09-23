package com.resqnet.sos.data.model

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.Assert.*
import org.junit.Test

class RsepPacketTest {

    private val json = Json { ignoreUnknownKeys = true; prettyPrint = true }

    @Test
    fun testRsepPacket_VoiceNoteSerialization() {
        val dummyBase64 = "SGVsbG8gUmVzUVBvc2l0aW9uIFZvaWNlIE5vdGU=" // "Hello ResQPosition Voice Note"
        val packet = RsepPacket(
            header = PacketHeader(packetId = "RQ-PKT-VOICE01", timestamp = "2026-09-22T12:00:00Z"),
            user = PacketUser(userId = "USR-01", name = "Test Victim"),
            location = PacketLocation(latitude = 13.0827, longitude = 80.2707, timestamp = "2026-09-22T12:00:00Z"),
            incident = PacketIncident(
                emergencyType = "Trapped Under Debris",
                hasVoiceNote = true,
                voiceNoteBase64 = dummyBase64,
                voiceNoteDurationSec = 30
            ),
            device = PacketDevice(),
            mesh = PacketMesh()
        )

        val serializedJson = json.encodeToString(packet)
        assertTrue(serializedJson.contains("voiceNoteBase64"))
        assertTrue(serializedJson.contains(dummyBase64))
        assertTrue(serializedJson.contains("\"hasVoiceNote\": true"))

        val deserialized = json.decodeFromString<RsepPacket>(serializedJson)
        assertTrue(deserialized.incident.hasVoiceNote)
        assertEquals(dummyBase64, deserialized.incident.voiceNoteBase64)
        assertEquals(30, deserialized.incident.voiceNoteDurationSec)
    }
}
