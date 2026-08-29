import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme/colors';

type Props = {
  title: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  isLoading = false,
  disabled = false,
}: Props) {
  const isCurrentlyLoading = loading || isLoading;
  const isDisabled = disabled || isCurrentlyLoading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: isCurrentlyLoading }}
    >
      {isCurrentlyLoading ? (
        <ActivityIndicator color={Colors.white} size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
