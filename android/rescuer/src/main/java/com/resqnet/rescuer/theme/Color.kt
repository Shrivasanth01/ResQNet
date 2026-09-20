package com.resqnet.rescuer.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// =========================================================================
// DARK THEME PALETTE (Deep Charcoal & Slate)
// =========================================================================
val ResQBackgroundDark = Color(0xFF090D16)       // Rich Deep Charcoal
val ResQSurfaceDark = Color(0xFF131C2E)          // Premium Slate Surface Card
val ResQSurfaceVariantDark = Color(0xFF1E293B)   // Dark Slate Container
val ResQCardBorderDark = Color(0xFF26354A)       // Crisp Subtle Slate Border

val ResQTextPrimaryDark = Color(0xFFF8FAFC)     // Crisp White
val ResQTextSecondaryDark = Color(0xFF94A3B8)   // Slate Secondary
val ResQTextMutedDark = Color(0xFF64748B)       // Steel Muted

// =========================================================================
// LIGHT THEME PALETTE (Clean High-Contrast Off-White & Crisp Slate)
// =========================================================================
val ResQBackgroundLight = Color(0xFFF1F5F9)      // Crisp Off-White Slate
val ResQSurfaceLight = Color(0xFFFFFFFF)         // Pure White Card Surface
val ResQSurfaceVariantLight = Color(0xFFE2E8F0)  // Light Slate Container
val ResQCardBorderLight = Color(0xFFCBD5E1)      // Crisp Light Border

val ResQTextPrimaryLight = Color(0xFF0F172A)    // Deep Charcoal Text
val ResQTextSecondaryLight = Color(0xFF475569)  // Slate Muted Text
val ResQTextMutedLight = Color(0xFF64748B)      // Muted Slate Text

// Matte High-Contrast Accent System
val ResQCyan = Color(0xFF0EA5E9)             // Deep Steel Sky Blue
val ResQCyanDark = Color(0xFF0284C7)         // Matte Cyan Accent
val ResQCrimson = Color(0xFFE11D48)          // Emergency Rose Crimson
val ResQCrimsonDark = Color(0xFFBE123C)      // Deep Rose Red
val ResQGreen = Color(0xFF10B981)            // Emerald Green
val ResQYellow = Color(0xFFD97706)           // Matte Amber
val ResQBlue = Color(0xFF2563EB)             // Royal Steel Blue
val ResQPurple = Color(0xFF7C3AED)           // Deep Violet

// Dynamic Color Properties (Adapts instantly to Light / Dark Mode)
val ResQBackground: Color
    @Composable get() = if (LocalThemeIsDark.current) ResQBackgroundDark else ResQBackgroundLight

val ResQSurface: Color
    @Composable get() = if (LocalThemeIsDark.current) ResQSurfaceDark else ResQSurfaceLight

val ResQSurfaceVariant: Color
    @Composable get() = if (LocalThemeIsDark.current) ResQSurfaceVariantDark else ResQSurfaceVariantLight

val ResQCardBorder: Color
    @Composable get() = if (LocalThemeIsDark.current) ResQCardBorderDark else ResQCardBorderLight

val ResQTextPrimary: Color
    @Composable get() = if (LocalThemeIsDark.current) ResQTextPrimaryDark else ResQTextPrimaryLight

val ResQTextSecondary: Color
    @Composable get() = if (LocalThemeIsDark.current) ResQTextSecondaryDark else ResQTextSecondaryLight

val ResQTextMuted: Color
    @Composable get() = if (LocalThemeIsDark.current) ResQTextMutedDark else ResQTextMutedLight
