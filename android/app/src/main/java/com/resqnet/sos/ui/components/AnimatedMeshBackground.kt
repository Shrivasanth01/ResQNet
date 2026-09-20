package com.resqnet.sos.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.resqnet.sos.theme.LocalThemeIsDark
import com.resqnet.sos.theme.ResQBackground
import com.resqnet.sos.theme.ResQCrimson
import com.resqnet.sos.theme.ResQCyan
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Reusable animated background for ResQNet screens.
 * Draws pulsing concentric radar waves emanating uniformly from the SOS button.
 */
@Composable
fun AnimatedMeshBackground(
    modifier: Modifier = Modifier,
    sosCenterYRatio: Float = 0.72f
) {
    val isDark = LocalThemeIsDark.current
    val bgColor = ResQBackground
    val cyanColor = ResQCyan
    val crimsonColor = ResQCrimson

    val infiniteTransition = rememberInfiniteTransition(label = "mesh_bg")

    val phase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2f * Math.PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(14000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "phase"
    )

    val radarRadiusFactor by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(4200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "radar"
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height

        // SOS Button Center Location on Screen
        val sosCenter = Offset(width / 2f, height * sosCenterYRatio)

        // Deep Base Radial Gradient Background
        drawRect(
            brush = Brush.radialGradient(
                colors = listOf(
                    if (isDark) Color(0xFF142236) else Color(0xFFE2E8F0),
                    bgColor,
                    bgColor
                ),
                center = sosCenter,
                radius = maxOf(width, height) * 0.90f
            )
        )

        // Concentric Radar Waves Radiating Uniformly from the SOS Button
        val maxRadarRadius = maxOf(width, height) * 0.85f
        val currentRadius = maxRadarRadius * radarRadiusFactor
        val radarAlpha = (1f - radarRadiusFactor).coerceIn(0f, 0.25f)

        drawCircle(
            color = cyanColor.copy(alpha = radarAlpha),
            radius = currentRadius,
            center = sosCenter,
            style = Stroke(width = 2.dp.toPx())
        )

        val secondFactor = (radarRadiusFactor + 0.5f) % 1.0f
        val secondRadius = maxRadarRadius * secondFactor
        val secondAlpha = (1f - secondFactor).coerceIn(0f, 0.20f)
        drawCircle(
            color = cyanColor.copy(alpha = secondAlpha),
            radius = secondRadius,
            center = sosCenter,
            style = Stroke(width = 1.5.dp.toPx())
        )

        val thirdFactor = (radarRadiusFactor + 0.25f) % 1.0f
        val thirdRadius = maxRadarRadius * thirdFactor
        val thirdAlpha = (1f - thirdFactor).coerceIn(0f, 0.15f)
        drawCircle(
            color = crimsonColor.copy(alpha = thirdAlpha),
            radius = thirdRadius,
            center = sosCenter,
            style = Stroke(width = 1.5.dp.toPx())
        )

        // Floating Mesh Nodes around the Radar Field
        val nodeCount = 7
        val nodes = ArrayList<Offset>(nodeCount)

        for (i in 0 until nodeCount) {
            val angle = phase + (i * Math.PI * 2 / nodeCount).toFloat()
            val offsetX = (width * 0.38f) * cos(angle + i)
            val offsetY = (height * 0.38f) * sin(angle * 0.8f + i)
            val nodePos = Offset(sosCenter.x + offsetX, sosCenter.y + offsetY)
            nodes.add(nodePos)

            // Draw Mesh Node Point
            drawCircle(
                color = cyanColor.copy(alpha = 0.32f),
                radius = 3.5.dp.toPx(),
                center = nodePos
            )
        }

        // Draw Inter-Node Mesh Connection Lines
        for (i in 0 until nodeCount) {
            for (j in i + 1 until nodeCount) {
                val p1 = nodes[i]
                val p2 = nodes[j]
                val dx = p1.x - p2.x
                val dy = p1.y - p2.y
                val dist = sqrt(dx * dx + dy * dy)
                if (dist < width * 0.48f) {
                    val lineAlpha = (1f - dist / (width * 0.48f)) * 0.12f
                    drawLine(
                        color = cyanColor.copy(alpha = lineAlpha),
                        start = p1,
                        end = p2,
                        strokeWidth = 1.dp.toPx()
                    )
                }
            }
        }
    }
}
