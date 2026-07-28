import { View, Text } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";

export default function Screen() {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
        Emergency Survival Guide
      </Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
        Offline First Aid & Rescue Procedures
      </Text>
    </View>
  );
}