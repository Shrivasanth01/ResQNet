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
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 22,
    paddingBottom: 12,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    width: "100%",
  },
});
