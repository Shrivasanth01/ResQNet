import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, TextInput } from "react-native";
import { useState, useMemo } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";

interface GuideItem {
  id: string;
  category: "Medical" | "Fire" | "Flood" | "Earthquake" | "Weather";
  title: string;
  subtitle: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  urgency: "Critical" | "High" | "Standard";
  warningText?: string;
  steps: string[];
}

const EMERGENCY_GUIDES: GuideItem[] = [
  {
    id: "g1",
    category: "Medical",
    title: "CPR & Cardiac Arrest Triage",
    subtitle: "Hands-only resuscitation for unresponsive victims",
    iconName: "favorite",
    urgency: "Critical",
    warningText: "Call emergency services or trigger ResQNet SOS immediately before commencing CPR.",
    steps: [
      "Check responsiveness: Tap victim's shoulders firmly and ask loudly 'Are you OK?'",
      "Check breathing: Watch chest movement for 5 to 10 seconds.",
      "Place hands: Position heels of stacked hands on center of victim's chest.",
      "Compress hard & fast: Push down at least 2 inches at a rate of 100-120 beats/min (to the rhythm of 'Stayin Alive').",
      "Repeat compressions continuously until emergency responders or AED arrives.",
    ],
  },
  {
    id: "g2",
    category: "Medical",
    title: "Severe Bleeding & Hemorrhage Control",
    subtitle: "Stop life-threatening blood loss using pressure & tourniquets",
    iconName: "invert-colors",
    urgency: "Critical",
    warningText: "Do NOT remove direct pressure once applied. Layer additional sterile cloth on top.",
    steps: [
      "Expose the wound: Cut or open clothing to identify exact source of bleeding.",
      "Direct pressure: Press firmly on the wound using sterile gauze, clean cloth, or gloved hands.",
      "Maintain continuous pressure for at least 10 minutes without lifting.",
      "If bleeding continues through cloth on limb, apply a commercial tourniquet 2-3 inches above wound.",
      "Tighten tourniquet until bleeding stops and record application time on victim's forehead.",
    ],
  },
  {
    id: "g3",
    category: "Medical",
    title: "Choking (Heimlich Maneuver)",
    subtitle: "Clearing severe airway obstructions in adults & children",
    iconName: "air",
    urgency: "High",
    warningText: "If victim becomes unconscious, lower to ground and begin chest compressions.",
    steps: [
      "Ask 'Are you choking?': If victim cannot speak or cough, act immediately.",
      "Stand behind victim and wrap arms around their waist.",
      "Make a fist with one hand, thumb side facing inward against victim's abdomen just above navel.",
      "Grasp fist with other hand and deliver quick, upward abdominal thrusts.",
      "Repeat thrusts until object is expelled or victim loses consciousness.",
    ],
  },
  {
    id: "g4",
    category: "Fire",
    title: "Building Fire & Smoke Escape",
    subtitle: "Evacuation protocols in dense smoke and active fires",
    iconName: "local-fire-department",
    urgency: "Critical",
    warningText: "Do NOT open doors that feel hot to the touch. Do NOT use elevators.",
    steps: [
      "Stay low: Crawl beneath smoke layer where air is cleaner and cooler.",
      "Feel doors before opening: Use back of hand to check door handle for heat.",
      "Cover nose & mouth: Use wet cloth or clothing to filter toxic smoke particles.",
      "If clothing catches fire: Stop, Drop to ground, Cover face with hands, and Roll.",
      "Once outside, stay out and signal rescue responders via ResQNet P2P mesh.",
    ],
  },
  {
    id: "g5",
    category: "Flood",
    title: "Flash Flood & Water Evacuation",
    subtitle: "Surviving rapid water rise, currents & submerged vehicles",
    iconName: "water",
    urgency: "High",
    warningText: "6 inches of moving water can knock an adult down. 2 feet of water can float vehicles.",
    steps: [
      "Move to higher ground immediately: Do not wait for official instructions if water rises.",
      "Avoid walking or driving through moving floodwater or submerged bridges.",
      "If vehicle stalls in rising water: Abandon vehicle immediately if safe and climb to elevated ground.",
      "If trapped in a building: Move to roof level. Signal with flashlight, whistle, or bright cloth.",
      "Disconnect main electrical breaker if water reaches indoor electrical outlets.",
    ],
  },
  {
    id: "g6",
    category: "Earthquake",
    title: "Earthquake Drop, Cover & Hold On",
    subtitle: "Protection during seismic tremors & structural collapsing",
    iconName: "terrain",
    urgency: "High",
    warningText: "Do NOT run outside during active shaking. Most injuries occur from falling debris.",
    steps: [
      "DROP down onto hands and knees to prevent being knocked over.",
      "COVER head and neck under a sturdy desk or table. If no shelter, cover head against inner wall.",
      "HOLD ON to your shelter until shaking completely stops.",
      "If indoors: Stay inside. Keep clear of glass, windows, and exterior walls.",
      "If trapped under debris: Tap on pipes or walls so rescuers can hear you. Avoid shouting to save oxygen.",
    ],
  },
  {
    id: "g7",
    category: "Weather",
    title: "Severe Lightning & Power Outage Safety",
    subtitle: "Surviving electrical storms & prolonged grid failures",
    iconName: "bolt",
    urgency: "Standard",
    warningText: "Do NOT use corded phones or touch plumbing fixtures during active lightning storms.",
    steps: [
      "Seek shelter inside a substantial building or hardtop enclosed vehicle.",
      "If outdoors without shelter: Crouch low on balls of feet with heels touching. Do NOT lie flat on ground.",
      "Keep away from tall isolated trees, metal fences, and open bodies of water.",
      "Unplug sensitive electronics to protect from high-voltage surge spikes.",
      "Keep refrigerator closed during outages to preserve food safety for 4-6 hours.",
    ],
  },
];

const CATEGORIES = ["All", "Medical", "Fire", "Flood", "Earthquake", "Weather"] as const;

export default function EmergencyGuideScreen() {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>("g1");

  const filteredGuides = useMemo(() => {
    return EMERGENCY_GUIDES.filter((item) => {
      const matchCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getUrgencyColor = (urgency: GuideItem["urgency"]) => {
    switch (urgency) {
      case "Critical": return Colors.danger;
      case "High": return Colors.warning;
      default: return Colors.secondary;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleGroup}>
          <MaterialIcons name="menu-book" size={26} color={Colors.primary} />
          <View>
            <Text style={[styles.mainTitle, { color: colors.text }]}>Emergency Survival Guide</Text>
            <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Offline First Aid & Tactical Rescue Manual</Text>
          </View>
        </View>
        <View style={styles.offlineBadge}>
          <MaterialIcons name="offline-pin" size={16} color={Colors.success} />
          <Text style={styles.offlineBadgeText}>OFFLINE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={22} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search procedures (e.g. CPR, Bleeding, Fire)..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {CATEGORIES.map((cat) => {
              const selected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selected && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, selected && styles.chipTextSelected]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* SOS Shortcut Card */}
        <Pressable
          style={({ pressed }) => [styles.sosBanner, pressed && { opacity: 0.95 }]}
          onPress={() => router.push("/sos")}
        >
          <View style={styles.sosLeft}>
            <View style={styles.sosIconCircle}>
              <MaterialIcons name="sos" size={30} color={Colors.white} />
            </View>
            <View style={styles.sosTextGroup}>
              <Text style={styles.sosTitle}>Active Life-Threatening Emergency?</Text>
              <Text style={styles.sosSub}>Tap to trigger instant distress beacon & P2P mesh relay</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={26} color={Colors.white} />
        </Pressable>

        {/* Guides Accordion List */}
        <View style={styles.guideList}>
          {filteredGuides.map((guide) => {
            const isExpanded = expandedId === guide.id;
            const urgencyColor = getUrgencyColor(guide.urgency);

            return (
              <View
                key={guide.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isExpanded && { borderColor: Colors.primary },
                ]}
              >
                <Pressable style={styles.cardHeader} onPress={() => toggleExpand(guide.id)}>
                  <View style={[styles.iconBox, { backgroundColor: `${urgencyColor}15` }]}>
                    <MaterialIcons name={guide.iconName} size={24} color={urgencyColor} />
                  </View>
                  <View style={styles.headerTextGroup}>
                    <View style={styles.badgeRow}>
                      <Text style={[styles.categoryTag, { color: urgencyColor }]}>
                        {guide.category.toUpperCase()}
                      </Text>
                      <View style={[styles.urgencyBadge, { backgroundColor: `${urgencyColor}15` }]}>
                        <Text style={[styles.urgencyText, { color: urgencyColor }]}>{guide.urgency}</Text>
                      </View>
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{guide.title}</Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={isExpanded ? undefined : 1}>
                      {guide.subtitle}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                    size={24}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {isExpanded && (
                  <View style={[styles.cardBody, { borderTopColor: colors.border }]}>
                    {guide.warningText && (
                      <View style={styles.warningBox}>
                        <MaterialIcons name="warning" size={20} color={Colors.danger} />
                        <Text style={styles.warningText}>{guide.warningText}</Text>
                      </View>
                    )}

                    <Text style={[styles.stepsTitle, { color: colors.text }]}>Step-by-Step Action Protocol:</Text>
                    {guide.steps.map((step, idx) => (
                      <View key={idx} style={styles.stepRow}>
                        <View style={[styles.stepNumberCircle, { backgroundColor: `${Colors.primary}15` }]}>
                          <Text style={styles.stepNumberText}>{idx + 1}</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                      </View>
                    ))}

                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => router.push("/sos")}
                    >
                      <MaterialIcons name="sensors" size={18} color={Colors.white} />
                      <Text style={styles.actionBtnText}>Broadcast Distress Signal for {guide.title}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}

          {filteredGuides.length === 0 && (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="search-off" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Survival Guides Found</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Try adjusting your search query or selecting another emergency category.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mainTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: Colors.text,
  },
  subTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.success}15`,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.success,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 80,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  sosBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 18,
    marginBottom: 18,
    boxShadow: "0px 4px 12px rgba(211, 47, 47, 0.25)" as any,
  },
  sosLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  sosIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sosTextGroup: {
    flex: 1,
  },
  sosTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.white,
  },
  sosSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  guideList: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextGroup: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  urgencyBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: "800",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.danger}12`,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.danger}30`,
    gap: 10,
    marginBottom: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.danger,
    lineHeight: 16,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  actionBtnText: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: 13,
  },
  emptyBox: {
    padding: 30,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});