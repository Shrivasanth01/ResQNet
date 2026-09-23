package com.resqnet.sos.services.hardware

import android.content.Context
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.os.Build
import android.util.Base64
import java.io.File

/**
 * Emergency Voice Note Recorder & Player.
 * Captures low-bitrate AAC audio voice messages (up to 30 seconds, ~24KB payload)
 * and Base64 encodes them for offline mesh transmission in RSEP data capsules.
 */
class AudioVoiceNoteRecorder(private val context: Context) {

    private var mediaRecorder: MediaRecorder? = null
    private var mediaPlayer: MediaPlayer? = null
    private var isRecording = false
    private var isPlaying = false

    fun startRecording(outputFile: File): Boolean {
        return try {
            stopRecording()
            if (outputFile.exists()) outputFile.delete()

            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(8000)  // Ultra-compact 8 kbps speech compression
                setAudioSamplingRate(8000)      // Mono speech 8kHz
                setAudioChannels(1)
                setOutputFile(outputFile.absolutePath)
                prepare()
                start()
            }
            isRecording = true
            println("[AudioVoiceNoteRecorder] 🎙️ Audio Recording Started: ${outputFile.name}")
            true
        } catch (e: Exception) {
            e.printStackTrace()
            isRecording = false
            false
        }
    }

    fun stopRecording(): File? {
        if (!isRecording) return null
        return try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
            isRecording = false
            println("[AudioVoiceNoteRecorder] 🛑 Audio Recording Stopped.")
            null
        } catch (e: Exception) {
            e.printStackTrace()
            mediaRecorder = null
            isRecording = false
            null
        }
    }

    fun playVoiceNote(audioFile: File, onCompletion: () -> Unit = {}) {
        try {
            stopPlayback()
            if (!audioFile.exists()) return

            val player = MediaPlayer()
            mediaPlayer = player
            player.setDataSource(audioFile.absolutePath)
            player.prepare()
            player.setOnCompletionListener {
                isPlaying = false
                onCompletion()
            }
            player.start()
            isPlaying = true
            println("[AudioVoiceNoteRecorder] 🔊 Audio Playback Started: ${audioFile.name}")
        } catch (e: Exception) {
            e.printStackTrace()
            isPlaying = false
        }
    }

    fun stopPlayback() {
        try {
            mediaPlayer?.apply {
                if (isPlaying) stop()
                release()
            }
            mediaPlayer = null
            isPlaying = false
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    companion object {
        fun encodeFileToBase64(file: File): String? {
            return try {
                if (!file.exists()) return null
                val bytes = file.readBytes()
                Base64.encodeToString(bytes, Base64.NO_WRAP)
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }

        fun decodeBase64ToCacheFile(context: Context, base64Str: String, fileName: String = "victim_voice.aac"): File? {
            return try {
                val bytes = Base64.decode(base64Str, Base64.NO_WRAP)
                val file = File(context.cacheDir, fileName)
                file.writeBytes(bytes)
                file
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }

        fun playBase64Audio(context: Context, base64Str: String, onCompletion: () -> Unit = {}) {
            val file = decodeBase64ToCacheFile(context, base64Str)
            if (file != null && file.exists()) {
                val player = AudioVoiceNoteRecorder(context)
                player.playVoiceNote(file, onCompletion)
            }
        }
    }
}
