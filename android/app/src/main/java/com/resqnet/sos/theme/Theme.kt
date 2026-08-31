package com.resqnet.sos.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = ResQCyan,
    secondary = ResQBlue,
    tertiary = ResQCrimson,
    background = ResQBackground,
    surface = ResQSurface,
    onPrimary = ResQBackground,
    onSecondary = ResQTextPrimary,
    onTertiary = ResQTextPrimary,
    onBackground = ResQTextPrimary,
    onSurface = ResQTextPrimary,
    surfaceVariant = ResQSurfaceVariant,
    onSurfaceVariant = ResQTextSecondary,
    outline = ResQCardBorder
)

@Composable
fun ResQNetTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
