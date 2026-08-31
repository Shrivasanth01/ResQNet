package com.resqnet.sos.ui.navigation

sealed class Screen(val route: String) {
    object Dashboard : Screen("dashboard")
    object ActiveSos : Screen("active_sos")
    object Map : Screen("map")
    object Reports : Screen("reports")
    object Settings : Screen("settings")
    object MedicalVault : Screen("medical_vault")
    object Login : Screen("login")
    object VerifyOtp : Screen("verify_otp")
    object CompleteProfile : Screen("complete_profile")
}
