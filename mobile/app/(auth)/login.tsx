import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";

import PrimaryButton from "../../src/components/PrimaryButton";
import TextInputField from "../../src/components/inputs/TextInputField";

import { Colors } from "../../src/theme/colors";

export default function LoginScreen() {
  return (
    <View style={styles.container}>

      <Text style={styles.logo}>🛡️</Text>

      <Text style={styles.title}>ResQNet</Text>

      <Text style={styles.subtitle}>
        Communication When Everything Else Fails
      </Text>

      <View style={{ height: 40 }} />

      <TextInputField
        label="Email"
        placeholder="Enter your email"
      />

      <TextInputField
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
      />

      <View style={{ marginTop: 15 }}>
        <PrimaryButton
          title="Sign In"
          onPress={() => router.replace("/(tabs)")}
        />
      </View>

      <Text
        onPress={() => router.push("/(auth)/register")}
        style={styles.register}
      >
        Create Account
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 25,
    justifyContent: "center",
  },

  logo: {
    fontSize: 70,
    textAlign: "center",
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
    marginTop: 15,
  },

  subtitle: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 25,
    fontSize: 16,
  },

  register: {
    marginTop: 30,
    textAlign: "center",
    color: Colors.primary,
    fontWeight: "600",
  },
});