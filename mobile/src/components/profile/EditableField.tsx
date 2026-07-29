import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

interface Props extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export default function EditableField({ label, error, required, helperText, style, ...props }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {required && <Text style={styles.requiredStar}>*</Text>}
      </View>

      <TextInput
        style={[
          styles.input, 
          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          error ? styles.inputError : null, 
          style
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && helperText ? <Text style={[styles.helperText, { color: colors.textSecondary }]}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  requiredStar: {
    color: Colors.danger,
    marginLeft: 4,
    fontWeight: "700",
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 1.5,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  helperText: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
});
