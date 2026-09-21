package com.resqnet.sos.ui.screens.firstaid

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.resqnet.sos.theme.*
import com.resqnet.sos.ui.components.SubtleMeteorShowerBackground

data class FirstAidTopic(
    val id: String,
    val title: String,
    val subtitle: String,
    val category: String,
    val icon: ImageVector,
    val iconColor: Color,
    val steps: List<String>,
    val dos: List<String>,
    val donts: List<String>,
    val warning: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FirstAidScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("All") }

    val categories = listOf("All", "CPR", "Bleeding", "Choking", "Burns", "Bites & Poison", "Breathing & Shock")

    val topics = remember {
        listOf(
            FirstAidTopic(
                id = "cpr",
                title = "CPR & Cardiac Arrest",
                subtitle = "Adult Resuscitation & Chest Compressions",
                category = "CPR",
                icon = Icons.Default.Favorite,
                iconColor = ResQCrimson,
                steps = listOf(
                    "Check responsiveness: Tap victim's shoulders and ask loudly, 'Are you okay?'",
                    "Call 108 / Emergency Services immediately or assign someone to call.",
                    "Position hands: Place heels of both hands in center of victim's chest (lower half of sternum).",
                    "Push hard & fast: Perform 100-120 compressions/min at 2 inches (5cm) depth to the beat of 'Stayin' Alive'.",
                    "Allow full chest recoil after each compression. Continue until medical help or automated defibrillator arrives."
                ),
                dos = listOf(
                    "DO push in the center of the chest with locked elbows.",
                    "DO minimize interruptions in chest compressions.",
                    "DO use an AED (Defibrillator) as soon as it is available."
                ),
                donts = listOf(
                    "DON'T press over ribs, lower end of sternum, or abdomen.",
                    "DON'T delay starting CPR if the victim is unresponsive and not breathing normally."
                ),
                warning = "Immediate CPR doubles or triples survival chances during sudden cardiac arrest."
            ),
            FirstAidTopic(
                id = "choking",
                title = "Choking (Heimlich Maneuver)",
                subtitle = "Airway Obstruction in Conscious Adult",
                category = "Choking",
                icon = Icons.Default.Air,
                iconColor = ResQCrimson,
                steps = listOf(
                    "Encourage coughing if victim can speak or cough loudly.",
                    "Give 5 back blows: Stand behind victim, lean them forward, and strike firm blows between shoulder blades with heel of hand.",
                    "Give 5 abdominal thrusts: Wrap arms around waist, make a fist above navel, grab fist with other hand and pull sharply inward and upward.",
                    "Alternate 5 back blows and 5 abdominal thrusts until object is expelled.",
                    "If victim becomes unconscious, lower to ground and begin CPR immediately."
                ),
                dos = listOf(
                    "DO lean the person forward when performing back blows.",
                    "DO place your fist slightly above the navel."
                ),
                donts = listOf(
                    "DON'T perform blind finger sweeps in the mouth unless the object is clearly visible.",
                    "DON'T slap on the back if the person is coughing effectively."
                ),
                warning = "For pregnant women or obese individuals, give chest thrusts instead of abdominal thrusts."
            ),
            FirstAidTopic(
                id = "bleeding",
                title = "Severe Bleeding Control",
                subtitle = "Direct Pressure, Elevate & Tourniquet",
                category = "Bleeding",
                icon = Icons.Default.Bloodtype,
                iconColor = ResQYellow,
                steps = listOf(
                    "Ensure safety: Wear gloves or use a clean barrier if available.",
                    "Apply firm, direct pressure over wound using a sterile pad or clean cloth.",
                    "Maintain continuous pressure for at least 10–15 minutes without lifting the cloth.",
                    "Elevate injured limb above heart level if no broken bones are suspected.",
                    "If severe arterial bleeding persists on limbs, apply a commercial tourniquet 2-3 inches above wound."
                ),
                dos = listOf(
                    "DO keep pressure applied constantly until emergency medical personnel arrive.",
                    "DO wrap additional bandages over soaked dressings without removing the bottom layer."
                ),
                donts = listOf(
                    "DON'T remove embedded objects in wound — stabilize object in place with padding.",
                    "DON'T apply a tourniquet over joints like knee or elbow."
                ),
                warning = "Tourniquets are life-saving for life-threatening limb hemorrhage. Record application time."
            ),
            FirstAidTopic(
                id = "burns",
                title = "Burns & Scalds Treatment",
                subtitle = "Cool Water Cooling & Dressing",
                category = "Burns",
                icon = Icons.Default.LocalFireDepartment,
                iconColor = ResQYellow,
                steps = listOf(
                    "Stop burning process: Remove victim from heat source, smother flames with blanket.",
                    "Cool burn immediately under cool (not ice-cold) running tap water for 10–20 minutes.",
                    "Remove restrictive items like rings or watches near burn before swelling occurs.",
                    "Cover burn loosely with clean sterile non-stick bandage or plastic wrap.",
                    "Seek medical care if burn is larger than victim's palm, on face, hands, groin, or major joints."
                ),
                dos = listOf(
                    "DO cool the burn with cool running water promptly.",
                    "DO elevate burned limbs to reduce swelling."
                ),
                donts = listOf(
                    "DON'T apply ice, ice water, butter, oil, or toothpaste to burn wounds.",
                    "DON'T pop blisters or peel away stuck clothing from burned skin."
                ),
                warning = "Chemical or electrical burns require immediate emergency care in hospital."
            ),
            FirstAidTopic(
                id = "fractures",
                title = "Bone Fractures & Sprains",
                subtitle = "Immobilization & PRICE Method",
                category = "Bleeding",
                icon = Icons.Default.Healing,
                iconColor = ResQCyan,
                steps = listOf(
                    "Immobilize: Keep injured limb completely still in position found.",
                    "Support limb with padded splint, folded blanket, or sling.",
                    "Apply ice pack wrapped in towel to reduce swelling (15-20 minutes at a time).",
                    "Check circulation: Ensure fingers or toes beyond injury remain warm and pink.",
                    "Seek orthopedic medical evaluation promptly."
                ),
                dos = listOf(
                    "DO support joint above and below fracture site.",
                    "DO apply cold compresses wrapped in cloth."
                ),
                donts = listOf(
                    "DON'T attempt to straighten or realign misshapen bones.",
                    "DON'T allow victim to test or walk on injured leg."
                )
            ),
            FirstAidTopic(
                id = "heatstroke",
                title = "Heat Stroke & Hyperthermia",
                subtitle = "Rapid Cooling & Hydration",
                category = "Breathing & Shock",
                icon = Icons.Default.WbSunny,
                iconColor = ResQYellow,
                steps = listOf(
                    "Move victim to cool, shaded or air-conditioned area immediately.",
                    "Loosen or remove excess heavy clothing.",
                    "Cool rapidly: Spray with water, fan, apply cold ice packs to neck, armpits, and groin.",
                    "Sip cool water or electrolyte drink if victim is conscious and able to swallow.",
                    "Call 108 if victim exhibits confusion, hot dry skin, vomiting, or loss of consciousness."
                ),
                dos = listOf(
                    "DO aggressively cool victim using cold water or wet towels.",
                    "DO monitor airway and breathing continuously."
                ),
                donts = listOf(
                    "DON'T force fluids if victim is drowsy or unconscious.",
                    "DON'T give fever-reducing medications like aspirin or paracetamol."
                )
            ),
            FirstAidTopic(
                id = "seizure",
                title = "Seizures & Epilepsy First Aid",
                subtitle = "Protect Airway & Head Cushioning",
                category = "Breathing & Shock",
                icon = Icons.Default.FlashOn,
                iconColor = ResQPurple,
                steps = listOf(
                    "Stay calm and time the duration of the seizure.",
                    "Protect head: Place soft jacket, pillow, or folded cloth under victim's head.",
                    "Clear surroundings: Move away hard, sharp, or dangerous objects.",
                    "Gently roll victim onto their side into recovery position once jerking stops.",
                    "Call 108 if seizure lasts longer than 5 minutes or if victim suffers multiple seizures."
                ),
                dos = listOf(
                    "DO cushion the victim's head carefully.",
                    "DO turn victim onto their side to keep airway clear of saliva or vomit."
                ),
                donts = listOf(
                    "DON'T hold the person down or try to restrain their movements.",
                    "DON'T place any object, spoon, or finger inside victim's mouth."
                )
            ),
            FirstAidTopic(
                id = "snakebite",
                title = "Snakebite & Venomous Animal Bites",
                subtitle = "Immobilization & Rapid Hospital Transport",
                category = "Bites & Poison",
                icon = Icons.Default.BugReport,
                iconColor = ResQGreen,
                steps = listOf(
                    "Keep victim calm and still — movement spreads venom faster through bloodstream.",
                    "Immobilize bitten limb below heart level using a loose splint or sling.",
                    "Remove rings, tight clothing, or footwear near bite before swelling occurs.",
                    "Clean bite gently with water and cover loosely with clean sterile dressing.",
                    "Transport victim immediately to nearest hospital providing anti-snake venom (ASV)."
                ),
                dos = listOf(
                    "DO keep the victim calm and strictly still.",
                    "DO note snake appearance/color if safely possible from distance."
                ),
                donts = listOf(
                    "DON'T cut the wound or try to suck out venom.",
                    "DON'T apply tight tourniquets, ice packs, or herbal pastes."
                ),
                warning = "In India, anti-snake venom (ASV) is essential for venomous bites. Seek hospital care immediately."
            ),
            FirstAidTopic(
                id = "poisoning",
                title = "Poisoning & Chemical Exposure",
                subtitle = "Ingestion, Inhalation & Eye Flush",
                category = "Bites & Poison",
                icon = Icons.Default.Warning,
                iconColor = ResQCrimson,
                steps = listOf(
                    "Identify poison container, label, or chemical substance if safe to handle.",
                    "Swallowed poison: Do NOT induce vomiting unless instructed by medical poison control.",
                    "Eye exposure: Flush open eye with gentle running tap water for at least 15-20 minutes.",
                    "Inhaled toxic gas: Move victim immediately to fresh outdoor air.",
                    "Call 108 / Poison Control Center and transport to hospital with chemical container."
                ),
                dos = listOf(
                    "DO bring the chemical container or label to the hospital.",
                    "DO flush exposed eyes or skin immediately with abundant water."
                ),
                donts = listOf(
                    "DON'T give milk, salt water, or induce vomiting.",
                    "DON'T attempt to neutralize chemicals with vinegar or baking soda."
                )
            ),
            FirstAidTopic(
                id = "electrocution",
                title = "Electric Shock & Electrocution",
                subtitle = "Power Disconnection & Cardiac Check",
                category = "Breathing & Shock",
                icon = Icons.Default.Power,
                iconColor = ResQYellow,
                steps = listOf(
                    "Ensure safety: Do NOT touch victim while still in contact with electrical current.",
                    "Disconnect power source immediately or switch off main circuit breaker.",
                    "If high voltage outdoor line, keep 20ft away and call emergency power utility.",
                    "Check breathing & pulse once current is disconnected. If unconscious, begin CPR.",
                    "Treat thermal burn entry/exit wounds with cool sterile water and clean dressing."
                ),
                dos = listOf(
                    "DO turn off power at main switch or unplug appliance.",
                    "DO check pulse and airway immediately after power disconnection."
                ),
                donts = listOf(
                    "DON'T touch victim with bare hands if current is active.",
                    "DON'T use conductive metallic or damp objects to push live wires."
                )
            ),
            FirstAidTopic(
                id = "drowning",
                title = "Drowning & Near-Drowning",
                subtitle = "Rescue, Airway & Ventilation CPR",
                category = "Breathing & Shock",
                icon = Icons.Default.Pool,
                iconColor = ResQBlue,
                steps = listOf(
                    "Safety rescue: Throw lifebuoy, rope, or flotation device. Reach without entering water if possible.",
                    "Once ashore, place victim on back on flat surface.",
                    "Give 5 initial rescue breaths: Tilt head back, pinch nose, and seal mouth to deliver breaths.",
                    "Perform CPR: Alternate 30 chest compressions with 2 rescue breaths continuously.",
                    "Turn victim onto side if vomiting occurs, clear mouth, and resume CPR."
                ),
                dos = listOf(
                    "DO start rescue breaths immediately for drowning victims.",
                    "DO keep victim warm with dry blankets to prevent hypothermia."
                ),
                donts = listOf(
                    "DON'T waste time trying to drain water from lungs with abdominal thrusts.",
                    "DON'T delay calling 108 emergency ambulance."
                )
            ),
            FirstAidTopic(
                id = "asthma",
                title = "Asthma Attack & Breathing Distress",
                subtitle = "Inhaler Administration & Position",
                category = "Breathing & Shock",
                icon = Icons.Default.Air,
                iconColor = ResQCyan,
                steps = listOf(
                    "Sit victim upright comfortably and help them remain calm.",
                    "Locate reliever inhaler (usually blue) and spacer if available.",
                    "Shake inhaler and give 1 puff every 30-60 seconds (up to 4-10 puffs).",
                    "Guide victim to take slow, steady deep breaths through inhaler spacer.",
                    "Call 108 if breathing worsens, victim cannot speak in full sentences, or lips turn blue."
                ),
                dos = listOf(
                    "DO encourage victim to sit upright leaning slightly forward.",
                    "DO help victim administer their prescribed reliever inhaler."
                ),
                donts = listOf(
                    "DON'T force victim to lie down flat.",
                    "DON'T leave victim alone during severe breathing distress."
                )
            )
        )
    }

    val filteredTopics = topics.filter { topic ->
        val matchesCategory = selectedCategory == "All" || topic.category.equals(selectedCategory, ignoreCase = true)
        val matchesQuery = searchQuery.isBlank() ||
                topic.title.contains(searchQuery, ignoreCase = true) ||
                topic.subtitle.contains(searchQuery, ignoreCase = true) ||
                topic.steps.any { it.contains(searchQuery, ignoreCase = true) }
        matchesCategory && matchesQuery
    }

    Scaffold(
        containerColor = ResQBackground,
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ResQSurface),
                title = {
                    Column {
                        Text("Quick First Aid Guides", color = ResQTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        Text("Offline emergency instructions & step-by-step procedures", color = ResQTextSecondary, fontSize = 11.sp)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ResQTextPrimary)
                    }
                }
            )
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize()) {
            SubtleMeteorShowerBackground()

            Column(
                modifier = modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                // Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search CPR, bleeding, snakebite...", color = ResQTextSecondary, fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = ResQCyan) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear", tint = ResQTextSecondary)
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = ResQSurface,
                        unfocusedContainerColor = ResQSurface,
                        focusedBorderColor = ResQCyan,
                        unfocusedBorderColor = ResQCardBorder,
                        focusedTextColor = ResQTextPrimary,
                        unfocusedTextColor = ResQTextPrimary
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Scrollable Category Filter Chips Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.forEach { cat ->
                        val isSelected = cat == selectedCategory
                        FilterChip(
                            selected = isSelected,
                            onClick = { selectedCategory = cat },
                            label = { Text(cat, fontSize = 12.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = ResQCyan,
                                selectedLabelColor = Color.White,
                                containerColor = ResQSurface,
                                labelColor = ResQTextSecondary
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isSelected,
                                borderColor = ResQCardBorder,
                                selectedBorderColor = ResQCyan
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                if (filteredTopics.isEmpty()) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ResQSurface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.5.dp, ResQCardBorder, RoundedCornerShape(16.dp))
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.SearchOff, contentDescription = null, tint = ResQTextSecondary, modifier = Modifier.size(36.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No First Aid Guides Found", color = ResQTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text("Try searching for CPR, choking, snakebite, or asthma.", color = ResQTextSecondary, fontSize = 12.sp)
                        }
                    }
                } else {
                    filteredTopics.forEach { topic ->
                        FirstAidTopicCard(topic = topic)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun FirstAidTopicCard(topic: FirstAidTopic) {
    var isExpanded by remember { mutableStateOf(false) }
    val rotationAngle by animateFloatAsState(
        targetValue = if (isExpanded) 180f else 0f,
        animationSpec = spring(stiffness = Spring.StiffnessLow),
        label = "chevron_rotate"
    )

    Card(
        colors = CardDefaults.cardColors(containerColor = ResQSurface),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(
                1.5.dp,
                if (isExpanded) topic.iconColor.copy(alpha = 0.8f) else ResQCardBorder,
                RoundedCornerShape(16.dp)
            )
            .clickable { isExpanded = !isExpanded }
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Header Row with Icon, Title/Subtitle & Expand Chevron
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                // Topic Icon Box
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .background(topic.iconColor.copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = topic.icon,
                        contentDescription = topic.title,
                        tint = topic.iconColor,
                        modifier = Modifier.size(22.dp)
                    )
                }

                // Title & Subtitle Column
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = topic.title,
                        color = ResQTextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        lineHeight = 19.sp
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = topic.subtitle,
                        color = ResQTextSecondary,
                        fontSize = 11.5.sp,
                        lineHeight = 15.sp
                    )
                }

                Icon(
                    imageVector = Icons.Default.ExpandMore,
                    contentDescription = if (isExpanded) "Collapse" else "Expand",
                    tint = ResQCyan,
                    modifier = Modifier
                        .size(22.dp)
                        .rotate(rotationAngle)
                )
            }

            // Expandable Step-by-Step Details Dropdown Content
            AnimatedVisibility(
                visible = isExpanded,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Column {
                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider(color = ResQCardBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(12.dp))

                    // Warning Box if present
                    if (!topic.warning.isNullOrBlank()) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ResQCrimson.copy(alpha = 0.12f)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, ResQCrimson.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = ResQCrimson, modifier = Modifier.size(18.dp))
                                Text(
                                    text = topic.warning,
                                    color = ResQTextPrimary,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    lineHeight = 15.sp
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    // Step by Step Instructions
                    Text("STEP-BY-STEP EMERGENCY ACTION:", color = ResQCyan, fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 0.5.sp)
                    Spacer(modifier = Modifier.height(8.dp))

                    topic.steps.forEachIndexed { idx, step ->
                        Row(
                            modifier = Modifier.padding(bottom = 8.dp),
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(22.dp)
                                    .background(ResQCyan.copy(alpha = 0.2f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("${idx + 1}", color = ResQCyan, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                            }
                            Text(
                                text = step,
                                color = ResQTextPrimary,
                                fontSize = 12.5.sp,
                                lineHeight = 17.sp,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // DO's and DON'Ts Side by Side
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // DO'S CARD
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ResQGreen.copy(alpha = 0.08f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, ResQGreen.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ResQGreen, modifier = Modifier.size(16.dp))
                                    Text("DO's", color = ResQGreen, fontSize = 11.5.sp, fontWeight = FontWeight.ExtraBold)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                topic.dos.forEach { item ->
                                    Text("• $item", color = ResQTextPrimary, fontSize = 11.sp, lineHeight = 15.sp)
                                    Spacer(modifier = Modifier.height(4.dp))
                                }
                            }
                        }

                        // DON'TS CARD
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ResQCrimson.copy(alpha = 0.08f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, ResQCrimson.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(Icons.Default.Cancel, contentDescription = null, tint = ResQCrimson, modifier = Modifier.size(16.dp))
                                    Text("DON'Ts", color = ResQCrimson, fontSize = 11.5.sp, fontWeight = FontWeight.ExtraBold)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                topic.donts.forEach { item ->
                                    Text("• $item", color = ResQTextPrimary, fontSize = 11.sp, lineHeight = 15.sp)
                                    Spacer(modifier = Modifier.height(4.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
