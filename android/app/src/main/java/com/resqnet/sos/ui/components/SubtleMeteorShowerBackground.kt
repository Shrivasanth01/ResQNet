package com.resqnet.sos.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import com.resqnet.sos.theme.LocalThemeIsDark
import com.resqnet.sos.theme.ResQBackground
import com.resqnet.sos.theme.ResQCyan
import com.resqnet.sos.theme.ResQCyanDark
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

private data class MeteorSpec(
    val startXRatio: Float,
    val startYRatio: Float,
    val length: Float,
    val speed: Float,
    val maxAlpha: Float,
    val strokeWidth: Float
)

/**
 * Reusable subtle meteor shower animated background for ResQNet.
 * Renders faint diagonal shooting stars passing through space.
 */
@Composable
fun SubtleMeteorShowerBackground(
    modifier: Modifier = Modifier
) {
    val isDark = LocalThemeIsDark.current
    val bgColor = ResQBackground
    val cyanColor = ResQCyan
    val cyanDarkColor = ResQCyanDark
    val starColor = if (isDark) Color.White else Color(0xFF64748B)

    val infiniteTransition = rememberInfiniteTransition(label = "meteor_shower")

    val animProgress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "meteor_progress"
    )

    // Generate static initial meteor trails
    val meteors = remember {
        List(6) { i ->
            MeteorSpec(
                startXRatio = (i * 0.18f + Random.nextFloat() * 0.1f) % 1.0f,
                startYRatio = (i * 0.15f + Random.nextFloat() * 0.1f) % 0.6f,
                length = Random.nextFloat() * 110f + 70f,
                speed = Random.nextFloat() * 1.4f + 1.1f,
                maxAlpha = Random.nextFloat() * 0.25f + 0.12f,
                strokeWidth = Random.nextFloat() * 1.2f + 1.2f
            )
        }
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height

        // Background
        drawRect(color = bgColor)

        // Subtle static star field
        val starSeed = Random(2025)
        for (i in 0 until 28) {
            val starX = starSeed.nextFloat() * width
            val starY = starSeed.nextFloat() * height
            val starAlpha = starSeed.nextFloat() * 0.18f + 0.05f
            val starRadius = starSeed.nextFloat() * 1.2f + 0.8f
            drawCircle(
                color = starColor.copy(alpha = starAlpha),
                radius = starRadius,
                center = Offset(starX, starY)
            )
        }

        // Animated falling meteors
        val angleRad = (Math.PI / 4.0).toFloat() // 45 degree diagonal trajectory
        val cosAngle = cos(angleRad)
        val sinAngle = sin(angleRad)

        meteors.forEachIndexed { index, meteor ->
            val travelDistance = (animProgress * width * 1.8f * meteor.speed + index * 180f) % (width * 1.8f)
            val headX = (meteor.startXRatio * width + travelDistance * cosAngle) % (width * 1.3f) - width * 0.15f
            val headY = (meteor.startYRatio * height + travelDistance * sinAngle) % (height * 1.3f) - height * 0.15f

            val tailX = headX - meteor.length * cosAngle
            val tailY = headY - meteor.length * sinAngle

            val headOffset = Offset(headX, headY)
            val tailOffset = Offset(tailX, tailY)

            val streakBrush = Brush.linearGradient(
                colors = listOf(
                    cyanColor.copy(alpha = meteor.maxAlpha),
                    (if (isDark) Color.White else cyanDarkColor).copy(alpha = meteor.maxAlpha * 0.7f),
                    Color.Transparent
                ),
                start = headOffset,
                end = tailOffset
            )

            drawLine(
                brush = streakBrush,
                start = headOffset,
                end = tailOffset,
                strokeWidth = meteor.strokeWidth,
                cap = StrokeCap.Round
            )
        }
    }
}
