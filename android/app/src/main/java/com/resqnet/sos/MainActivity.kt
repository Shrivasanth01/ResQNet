package com.resqnet.sos

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
import com.resqnet.sos.data.local.ProfilePreferences
import com.resqnet.sos.data.local.ThemePreferences
import com.resqnet.sos.services.distribution.NativeBleMeshEngine
import com.resqnet.sos.theme.ResQBackground
import com.resqnet.sos.theme.ResQNetTheme
import com.resqnet.sos.ui.navigation.Screen
import com.resqnet.sos.ui.screens.auth.CompleteProfileScreen
import com.resqnet.sos.ui.screens.auth.LoginScreen
import com.resqnet.sos.ui.screens.auth.VerifyOtpScreen
import com.resqnet.sos.services.distribution.BleMeshForegroundService
import com.resqnet.sos.ui.screens.dashboard.DashboardScreen
import com.resqnet.sos.ui.screens.firstaid.FirstAidScreen
import com.resqnet.sos.ui.screens.map.LiveMapScreen
import com.resqnet.sos.ui.screens.mesh.MeshStatusScreen
import com.resqnet.sos.ui.screens.reports.ReportsScreen
import com.resqnet.sos.ui.screens.settings.EmergencyContactsScreen
import com.resqnet.sos.ui.screens.settings.MedicalVaultScreen
import com.resqnet.sos.ui.screens.settings.SettingsScreen
import com.resqnet.sos.ui.screens.sos.ActiveSosScreen
import java.net.URLDecoder

class MainActivity : ComponentActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        println("[MainActivity] Hardware permissions evaluated: $permissions")
        NativeBleMeshEngine.init(this)
        BleMeshForegroundService.startService(this)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestAppPermissions()

        try {
            NativeBleMeshEngine.init(this)
            BleMeshForegroundService.startService(this)
        } catch (e: Exception) {
            println("[MainActivity] Mesh init warning: ${e.localizedMessage}")
        }

        val profilePrefs = ProfilePreferences(this)
        val themePrefs = ThemePreferences.getInstance(this)
        val startDest = if (profilePrefs.isLoggedIn()) Screen.Dashboard.route else Screen.Login.route

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
                        startDestination = startDest
                    ) {
                        composable(Screen.Login.route) {
                            LoginScreen(navController = navController)
                        }
                        composable("${Screen.VerifyOtp.route}/{email}/{requestId}") { backStackEntry ->
                            val rawEmail = backStackEntry.arguments?.getString("email") ?: ""
                            val rawReqId = backStackEntry.arguments?.getString("requestId") ?: ""
                            val email = URLDecoder.decode(rawEmail, "UTF-8")
                            val requestId = URLDecoder.decode(rawReqId, "UTF-8")
                            VerifyOtpScreen(
                                navController = navController,
                                email = email,
                                requestId = requestId
                            )
                        }
                        composable(Screen.Dashboard.route) {
                            DashboardScreen(navController = navController)
                        }
                        composable(Screen.ActiveSos.route) {
                            ActiveSosScreen(navController = navController)
                        }
                        composable(Screen.Map.route) {
                            LiveMapScreen(navController = navController)
                        }
                        composable(Screen.Reports.route) {
                            ReportsScreen(navController = navController)
                        }
                        composable(Screen.Settings.route) {
                            SettingsScreen(navController = navController)
                        }
                        composable(Screen.MedicalVault.route) {
                            MedicalVaultScreen(navController = navController)
                        }
                        composable(Screen.EmergencyContacts.route) {
                            EmergencyContactsScreen(navController = navController)
                        }
                        composable(Screen.CompleteProfile.route) {
                            CompleteProfileScreen(navController = navController)
                        }
                        composable(Screen.MeshStatus.route) {
                            MeshStatusScreen(navController = navController)
                        }
                        composable(Screen.FirstAid.route) {
                            FirstAidScreen(navController = navController)
                        }
                    }
                }
            }
        }
    }

    private fun requestAppPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.SEND_SMS
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_SCAN)
            permissions.add(Manifest.permission.BLUETOOTH_ADVERTISE)
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.NEARBY_WIFI_DEVICES)
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            permissions.add(Manifest.permission.ACTIVITY_RECOGNITION)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            permissionLauncher.launch(needed.toTypedArray())
        }
    }
}
