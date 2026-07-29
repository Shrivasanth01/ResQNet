import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform } from "react-native";
import { useState, useMemo } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  visible: boolean;
  value?: string; // YYYY-MM-DD
  onClose: () => void;
  onSelectDate: (dateStr: string, calculatedAge: number) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DatePickerModal({ visible, value, onClose, onSelectDate }: Props) {
  const { colors, isDarkMode } = useTheme();

  // Initial date parsing
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split("-").map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(2000, 0, 1);
  }, [value]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(initialDate.getDate());

  // Generate Year options (1940 to Current Year)
  const yearOptions = useMemo(() => {
    const maxYear = new Date().getFullYear();
    const list: number[] = [];
    for (let y = maxYear; y >= 1945; y--) {
      list.push(y);
    }
    return list;
  }, []);

  // Compute Days in Month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [currentYear, currentMonth]);

  const handleConfirmDate = (day: number) => {
    const mStr = String(currentMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const dateStr = `${currentYear}-${mStr}-${dStr}`;

    // Calculate Age
    const today = new Date();
    const birthDate = new Date(currentYear, currentMonth, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const finalAge = age >= 0 ? age : 0;

    onSelectDate(dateStr, finalAge);
    onClose();
  };

  const formattedSelected = `${MONTH_NAMES[currentMonth]} ${selectedDay}, ${currentYear}`;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: isDarkMode ? `${Colors.secondary}40` : colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="calendar-month" size={24} color={Colors.primary} />
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Select Date of Birth</Text>
                <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{formattedSelected}</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Month & Year Selectors */}
          <View style={styles.selectorRow}>
            {/* Month Navigator */}
            <View style={[styles.navGroup, { backgroundColor: `${colors.textSecondary}10`, borderColor: colors.border }]}>
              <Pressable 
                onPress={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear((y) => y - 1);
                  } else {
                    setCurrentMonth((m) => m - 1);
                  }
                }}
              >
                <MaterialIcons name="chevron-left" size={24} color={colors.text} />
              </Pressable>

              <Text style={[styles.monthText, { color: colors.text }]}>{MONTH_NAMES[currentMonth]}</Text>

              <Pressable 
                onPress={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear((y) => y + 1);
                  } else {
                    setCurrentMonth((m) => m + 1);
                  }
                }}
              >
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Year Selector */}
            <View style={[styles.yearDropdown, { backgroundColor: `${colors.textSecondary}10`, borderColor: colors.border }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {yearOptions.map((y) => (
                  <Pressable
                    key={y}
                    style={[styles.yearChip, y === currentYear && styles.yearChipSelected]}
                    onPress={() => setCurrentYear(y)}
                  >
                    <Text style={[styles.yearChipText, { color: colors.textSecondary }, y === currentYear && styles.yearChipTextSelected]}>
                      {y}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Days of Week Row */}
          <View style={styles.weekRow}>
            {DAYS_OF_WEEK.map((w) => (
              <Text key={w} style={[styles.weekText, { color: colors.textSecondary }]}>{w}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }
              const isSelected = day === selectedDay;
              return (
                <Pressable
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => {
                    setSelectedDay(day);
                    handleConfirmDate(day);
                  }}
                >
                  <Text style={[styles.dayText, { color: colors.text }, isSelected && styles.dayTextSelected]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Web Native Date Input Fallback */}
          {Platform.OS === 'web' && (
            <View style={styles.webFallbackRow}>
              <Text style={[styles.webFallbackLabel, { color: colors.textSecondary }]}>Direct Date Input:</Text>
              <input
                type="date"
                value={value || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`}
                onChange={(e) => {
                  if (e.target.value) {
                    const parts = e.target.value.split("-").map(Number);
                    if (parts.length === 3) {
                      setCurrentYear(parts[0]);
                      setCurrentMonth(parts[1] - 1);
                      setSelectedDay(parts[2]);
                      handleConfirmDate(parts[2]);
                    }
                  }
                }}
                style={{
                  backgroundColor: isDarkMode ? "#1E293B" : "#F1F5F9",
                  color: isDarkMode ? "#F8FAFC" : "#0F172A",
                  border: "1px solid #3B82F6",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    boxShadow: "0px 10px 30px rgba(0,0,0,0.3)" as any,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  closeBtn: {
    padding: 4,
  },
  selectorRow: {
    gap: 10,
    marginBottom: 14,
  },
  navGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  monthText: {
    fontSize: 15,
    fontWeight: "800",
  },
  yearDropdown: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  yearChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 6,
  },
  yearChipSelected: {
    backgroundColor: Colors.primary,
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  yearChipTextSelected: {
    color: Colors.white,
    fontWeight: "900",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekText: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1.1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: "900",
  },
  webFallbackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  webFallbackLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
});
