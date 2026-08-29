import { Text, StyleSheet, View } from "react-native";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  title: string;
}

export default function SectionHeader({ title }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.indicator} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  indicator: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    width: "100%",
  },
});
