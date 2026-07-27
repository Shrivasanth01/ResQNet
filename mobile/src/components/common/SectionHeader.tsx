import { Text, StyleSheet, View } from "react-native";
import { Colors } from "../../theme/colors";

interface Props {
  title: string;
}

export default function SectionHeader({ title }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
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
