import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";
import { Colors } from "../../src/theme/colors";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🛡️</Text>

      <Text style={styles.title}>ResQNet</Text>

      <Text style={styles.subtitle}>
        Communication When{"\n"}Everything Else Fails
      </Text>

      <Text style={styles.loading}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  logo: {
    fontSize: 70,
    marginBottom: 20,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.primary,
  },

  subtitle: {
    marginTop: 12,
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 18,
    lineHeight: 26,
  },

  loading: {
    position: "absolute",
    bottom: 60,
    color: Colors.textSecondary,
  },
});