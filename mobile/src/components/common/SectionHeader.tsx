import { Text, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  title: string;
}

export default function SectionHeader({ title }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
});
