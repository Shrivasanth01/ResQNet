package com.resqnet.sos.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.resqnet.sos.theme.ResQCyan
import com.resqnet.sos.theme.ResQTextSecondary

/**
 * Animated bottom navigation tab item with spring press scaling,
 * smooth color transition, and expanding pill badge indicator.
 */
@Composable
fun AnimatedNavTabItem(
    label: String,
    icon: ImageVector,
    selected: Boolean,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    // Spring press scale animation on click/hover
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.88f else if (selected) 1.06f else 1.0f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "tab_scale"
    )

    // Animated color transition
    val activeColor by animateColorAsState(
        targetValue = if (selected) ResQCyan else ResQTextSecondary,
        animationSpec = tween(250),
        label = "tab_color"
    )

    val containerAlpha by animateFloatAsState(
        targetValue = if (selected) 0.18f else if (isPressed) 0.10f else 0f,
        animationSpec = tween(250),
        label = "container_alpha"
    )

    Box(
        modifier = Modifier
            .scale(scale)
            .clip(RoundedCornerShape(20.dp))
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) { onClick() }
            .background(
                ResQCyan.copy(alpha = containerAlpha),
                RoundedCornerShape(20.dp)
            )
            .padding(horizontal = 16.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = activeColor,
                modifier = Modifier.size(22.dp)
            )
            AnimatedVisibility(
                visible = selected,
                enter = fadeIn(animationSpec = tween(200)) + expandHorizontally(animationSpec = tween(200)),
                exit = fadeOut(animationSpec = tween(150)) + shrinkHorizontally(animationSpec = tween(150))
            ) {
                Text(
                    text = label,
                    color = ResQCyan,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
