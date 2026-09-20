package com.resqnet.sos.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.theme.ResQCardBorder
import com.resqnet.sos.theme.ResQCyan
import com.resqnet.sos.theme.ResQSurface
import com.resqnet.sos.theme.ResQTextSecondary
import com.resqnet.sos.ui.navigation.Screen

data class NavTabSpec(
    val route: String,
    val label: String,
    val icon: ImageVector
)

/**
 * Universal sliding bottom navigation bar for ResQNet.
 * Features an ultra-smooth cubic-bezier animated sliding pill capsule that glides effortlessly over tab names and icons.
 */
@Composable
fun SlidingBottomNavBar(
    selectedRoute: String,
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val tabs = remember {
        listOf(
            NavTabSpec(Screen.Dashboard.route, "Home", Icons.Default.Home),
            NavTabSpec(Screen.Reports.route, "Reports", Icons.Default.Assessment),
            NavTabSpec(Screen.Settings.route, "Settings", Icons.Default.Settings)
        )
    }

    val targetIndex = remember(selectedRoute) {
        tabs.indexOfFirst { it.route == selectedRoute }.coerceAtLeast(0)
    }

    var activeIndex by remember { mutableFloatStateOf(targetIndex.toFloat()) }

    LaunchedEffect(targetIndex) {
        activeIndex = targetIndex.toFloat()
    }

    // Ultra-smooth material motion cubic bezier easing curve
    val animatedIndex by animateFloatAsState(
        targetValue = activeIndex,
        animationSpec = tween(
            durationMillis = 360,
            easing = CubicBezierEasing(0.25f, 0.1f, 0.25f, 1.0f)
        ),
        label = "sliding_tab_index"
    )

    Surface(
        color = ResQSurface,
        shadowElevation = 12.dp,
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, ResQCardBorder, RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
    ) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp)
        ) {
            val totalWidth = maxWidth
            val tabWidth = totalWidth / tabs.size
            val indicatorOffset = tabWidth * animatedIndex

            // Active Sliding Pill Capsule that glides smoothly directly over "Home", "Reports", "Settings"
            Box(
                modifier = Modifier
                    .offset(x = indicatorOffset)
                    .width(tabWidth)
                    .height(44.dp)
                    .padding(horizontal = 4.dp)
                    .background(ResQCyan.copy(alpha = 0.22f), RoundedCornerShape(22.dp))
                    .border(1.5.dp, ResQCyan.copy(alpha = 0.65f), RoundedCornerShape(22.dp))
            )

            // Interactive Tab Icon & Text Label Layer
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                tabs.forEachIndexed { index, tab ->
                    val isSelected = index == targetIndex
                    val interactionSource = remember { MutableInteractionSource() }
                    val isPressed by interactionSource.collectIsPressedAsState()

                    val scale by animateFloatAsState(
                        targetValue = if (isPressed) 0.90f else 1.0f,
                        animationSpec = tween(200),
                        label = "tab_press_scale"
                    )

                    val activeColor by animateColorAsState(
                        targetValue = if (isSelected) Color.White else ResQTextSecondary,
                        animationSpec = tween(280),
                        label = "tab_icon_color"
                    )

                    Box(
                        modifier = Modifier
                            .width(tabWidth)
                            .fillMaxHeight()
                            .scale(scale)
                            .clip(RoundedCornerShape(22.dp))
                            .clickable(
                                interactionSource = interactionSource,
                                indication = null
                            ) {
                                if (!isSelected) {
                                    activeIndex = index.toFloat()
                                    navController.navigate(tab.route) {
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = tab.icon,
                                contentDescription = tab.label,
                                tint = if (isSelected) ResQCyan else activeColor,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = tab.label,
                                color = activeColor,
                                fontSize = 12.5.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }
    }
}
