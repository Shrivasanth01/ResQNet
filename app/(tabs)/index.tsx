import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ResQNet</Text>
      <Text style={styles.subtitle}>
        Communication When Everything Else Fails
      </Text>

      <TouchableOpacity style={styles.card}>
        <MaterialIcons name="warning" size={30} color="#fff" />
        <Text style={styles.cardText}>Emergency SOS</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <MaterialIcons name="description" size={30} color="#fff" />
        <Text style={styles.cardText}>My Reports</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <MaterialIcons name="people" size={30} color="#fff" />
        <Text style={styles.cardText}>Nearby Devices</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <MaterialIcons name="menu-book" size={30} color="#fff" />
        <Text style={styles.cardText}>Emergency Guide</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <MaterialIcons name="settings" size={30} color="#fff" />
        <Text style={styles.cardText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FC",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  logo: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#D32F2F",
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 40,
    textAlign: "center",
  },

  card: {
    width: "100%",
    backgroundColor: "#D32F2F",
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  cardText: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 15,
    fontWeight: "600",
  },
});