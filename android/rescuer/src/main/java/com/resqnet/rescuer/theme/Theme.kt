package com.resqnet.rescuer.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf

val LocalThemeIsDark = staticCompositionLocalOf { true }

private val DarkColorScheme = darkColorScheme(
    primary = ResQCyan,
    secondary = ResQBlue,
    tertiary = ResQCrimson,
    background = ResQBackgroundDark,
    surface = ResQSurfaceDark,
    onPrimary = ResQBackgroundDark,
    onSecondary = ResQTextPrimaryDark,
    onTertiary = ResQTextPrimaryDark,
    onBackground = ResQTextPrimaryDark,
    onSurface = ResQTextPrimaryDark,
    surfaceVariant = ResQSurfaceVariantDark,
    onSurfaceVariant = ResQTextSecondaryDark,
    outline = ResQCardBorderDark
)

private val LightColorScheme = lightColorScheme(
    primary = ResQCyanDark,
    secondary = ResQBlue,
    tertiary = ResQCrimson,
    background = ResQBackgroundLight,
    surface = ResQSurfaceLight,
    onPrimary = ResQSurfaceLight,
    onSecondary = ResQTextPrimaryLight,
    onTertiary = ResQTextPrimaryLight,
    onBackground = ResQTextPrimaryLight,
    onSurface = ResQTextPrimaryLight,
    surfaceVariant = ResQSurfaceVariantLight,
    onSurfaceVariant = ResQTextSecondaryLight,
    outline = ResQCardBorderLight
)

@Composable
fun ResQNetTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColorScheme else LightColorScheme

    CompositionLocalProvider(LocalThemeIsDark provides darkTheme) {
        MaterialTheme(
            colorScheme = colors,
            typography = Typography,
            content = content
        )
    }
}
