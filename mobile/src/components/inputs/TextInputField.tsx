import { Text, TextInput, View, StyleSheet } from "react-native";
import { Colors } from "../../theme/colors";

type Props = {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
};

export default function TextInputField({
  label,
  placeholder,
  secureTextEntry = false,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        placeholderTextColor="#999"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,
    color: Colors.text,
    fontWeight: "600",
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    fontSize: 16,
  },
});