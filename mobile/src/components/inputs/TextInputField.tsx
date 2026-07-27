import { Text, TextInput, View, StyleSheet, type TextInputProps } from 'react-native';
import { Colors } from '../../theme/colors';

type Props = Pick<
  TextInputProps,
  'keyboardType' | 'autoCapitalize' | 'secureTextEntry' | 'autoCorrect' | 'multiline' | 'numberOfLines'
> & {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
};

export default function TextInputField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[styles.input, multiline && { height: 110, textAlignVertical: 'top' }]}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    marginBottom: 8,
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    fontSize: 16,
    color: Colors.text,
  },
});