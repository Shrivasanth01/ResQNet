package com.resqnet.rescuer

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.resqnet.rescuer.data.ThemePreferences
import com.resqnet.rescuer.services.RescuerBleScanner
import com.resqnet.rescuer.services.RescuerMeshService
import com.resqnet.rescuer.theme.ResQBackground
import com.resqnet.rescuer.theme.ResQNetTheme
import com.resqnet.rescuer.ui.RescuerDashboardScreen
import com.resqnet.rescuer.ui.RescuerMapScreen
import com.resqnet.rescuer.ui.VictimDetailScreen
import java.net.URLDecoder

class RescuerMainActivity : ComponentActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        println("[RescuerMainActivity] Hardware permissions evaluated: $permissions")
        RescuerBleScanner.init(this)
        RescuerMeshService.startService(this)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestRescuerPermissions()

        try {
            RescuerBleScanner.init(this)
            RescuerMeshService.startService(this)
        } catch (e: Exception) {
            println("[RescuerMainActivity] Mesh init warning: ${e.localizedMessage}")
        }

        val themePrefs = ThemePreferences.getInstance(this)

        setContent {
            val isDarkMode by themePrefs.isDarkMode.collectAsState()

            ResQNetTheme(darkTheme = isDarkMode) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = ResQBackground
                ) {
                    val navController = rememberNavController()

                    NavHost(
                        navController = navController,
                        startDestination = "rescuer_dashboard"
                    ) {
                        composable("rescuer_dashboard") {
                            RescuerDashboardScreen(navController = navController)
                        }
                        composable("victim_detail/{packetId}") { backStackEntry ->
                            val rawPacketId = backStackEntry.arguments?.getString("packetId") ?: ""
                            val packetId = URLDecoder.decode(rawPacketId, "UTF-8")
                            VictimDetailScreen(
                                navController = navController,
                                packetId = packetId
                            )
                        }
                        composable("rescuer_map") {
                            RescuerMapScreen(navController = navController)
                        }
                    }
                }
            }
        }
    }

    private fun requestRescuerPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.CALL_PHONE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_SCAN)
            permissions.add(Manifest.permission.BLUETOOTH_ADVERTISE)
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            permissionLauncher.launch(needed.toTypedArray())
        }
    }
}
