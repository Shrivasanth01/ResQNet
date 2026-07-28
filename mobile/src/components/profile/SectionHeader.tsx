import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  actionText?: string;
  onActionPress?: () => void;
}

export default function SectionHeader({ title, subtitle, icon, actionText, onActionPress }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {icon && (
          <View style={styles.iconBox}>
            <MaterialIcons name={icon} size={22} color={Colors.primary} />
          </View>
        )}
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {actionText && onActionPress && (
        <Text style={styles.actionText} onPress={onActionPress}>
          {actionText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}12`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
});
