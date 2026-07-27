import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect } from "react";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  interpolate 
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "../../theme/colors";

export default function HeroSOSButton() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.2]) }],
      opacity: interpolate(pulse.value, [0, 1], [0.4, 0.1]),
    };
  });

  const animatedStyle2 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.4]) }],
      opacity: interpolate(pulse.value, [0, 1], [0.2, 0]),
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.pulseCircle, animatedStyle2]} />
      <Animated.View style={[styles.pulseCircle, animatedStyle1]} />
      
      <Pressable 
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => router.push("/sos")}
      >
        <MaterialIcons name="warning" size={48} color={Colors.white} />
        <Text style={styles.buttonText}>SOS</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
    height: 200,
  },
  pulseCircle: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.danger,
  },
  button: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: Colors.primaryDark,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
});
