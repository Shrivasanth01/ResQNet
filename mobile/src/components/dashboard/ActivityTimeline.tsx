import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export interface ActivityEvent {
  id: string;
  title: string;
  timestamp: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  isRecent?: boolean;
}

interface Props {
  events: ActivityEvent[];
}

export default function ActivityTimeline({ events }: Props) {
  const { colors } = useTheme();

  if (!events || events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent activity</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        
        return (
          <View key={event.id} style={styles.eventRow}>
            {/* Timeline Graphic */}
            <View style={styles.timelineColumn}>
              <View style={[
                styles.dot, 
                { backgroundColor: colors.background, borderColor: colors.border },
                event.isRecent && styles.dotRecent
              ]}>
                <MaterialIcons 
                  name={event.iconName} 
                  size={14} 
                  color={event.isRecent ? Colors.black : colors.textSecondary} 
                />
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
            </View>
            
            {/* Content */}
            <View style={[styles.contentColumn, !isLast && styles.contentColumnBottomPadding]}>
              <Text style={[styles.title, { color: colors.text }, event.isRecent && { color: Colors.primary, fontWeight: "700" }]}>
                {event.title}
              </Text>
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{event.timestamp}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  eventRow: {
    flexDirection: "row",
  },
  timelineColumn: {
    width: 40,
    alignItems: "center",
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  dotRecent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.accentCyan,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: -4,
    zIndex: 1,
  },
  contentColumn: {
    flex: 1,
    paddingTop: 4,
    paddingLeft: 8,
  },
  contentColumnBottomPadding: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
    marginBottom: 4,
  },
  titleRecent: {
    fontWeight: "700",
  },
  timestamp: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
