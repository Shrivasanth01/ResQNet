import { Pressable, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";

type Props = {
  title: string;
  onPress: () => void;
};

export default function PrimaryButton({
  title,
  onPress,
}: Props) {
  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "600",
  },
});