import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { APP_CONFIG } from '../../src/constants/app';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

const BOOT_STATUSES = [
  "INITIALIZING LOCAL SQLITE DATA VAULT...",
  "ACTIVATING BLUETOOTH & WI-FI MESH DISCOVERY...",
  "CALIBRATING MULTI-SENSOR FALL DETECTORS...",
  "VERIFYING Ed25519 CRYPTOGRAPHIC IDENTITY...",
  "STATUS: EMERGENCY MESH READY • CONNECTED"
];

export default function SplashScreen() {
  const { isAuthenticated, isLoading, profileCompleted } = useAuth();
  const [statusIdx, setStatusIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timerDone, setTimerDone] = useState(false);
  const hasNavigated = useRef(false);

  // Animation Refs
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseRing1 = useRef(new Animated.Value(0)).current;
  const pulseRing2 = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const crossPulse = useRef(new Animated.Value(1)).current;

  // Startup animations
  useEffect(() => {
    const isNative = Platform.OS !== 'web';

    // 1. Entrance animation (scale + fade)
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: isNative,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: isNative,
      }),
    ]).start();

    // 2. Continuous rotating radar/mesh scan
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: isNative,
      })
    ).start();

    // 3. Heartbeat pulsing on inner cross
    Animated.loop(
      Animated.sequence([
        Animated.timing(crossPulse, {
          toValue: 1.22,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: isNative,
        }),
        Animated.timing(crossPulse, {
          toValue: 1,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: isNative,
        }),
        Animated.delay(1200),
      ])
    ).start();

    // 4. Expanding pulse wave rings
    const createRingLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createRingLoop(pulseRing1, 0).start();
    createRingLoop(pulseRing2, 1100).start();

    // 5. Progress ticker
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        const next = Math.min(prev + Math.floor(Math.random() * 9) + 4, 100);
        const idx = Math.min(Math.floor((next / 100) * BOOT_STATUSES.length), BOOT_STATUSES.length - 1);
        setStatusIdx(idx);
        return next;
      });
    }, 85);

    // Startup timer — on web, transition quickly in 1.2s
    const displayDuration = Platform.OS === 'web' ? 1200 : Math.max(APP_CONFIG.SPLASH_DURATION_MS, 2000);
    const navTimer = setTimeout(() => {
      setTimerDone(true);
    }, displayDuration);

    // Hard fallback: always navigate after 2.5s even if state is slow
    const fallbackTimer = setTimeout(() => {
      navigateNext();
    }, 2500);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(navTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Navigate when timer and auth resolution finish
  useEffect(() => {
    if (timerDone && !isLoading && !hasNavigated.current) {
      navigateNext();
    }
  }, [timerDone, isLoading, isAuthenticated, profileCompleted]);

  const navigateNext = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    const doRedirect = () => {
      if (isAuthenticated && profileCompleted) {
        // Returning user with completed profile → Dashboard
        router.replace('/(tabs)');
      } else if (isAuthenticated && !profileCompleted) {
        // Authenticated but profile incomplete → Complete Profile
        router.replace('/(auth)/complete-profile' as any);
      } else {
        // Not authenticated → Phone / Email Login
        router.replace('/(auth)/phone-login' as any);
      }
    };

    if (Platform.OS === 'web') {
      doRedirect();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => doRedirect());
      setTimeout(doRedirect, 500);
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ring1Scale = pulseRing1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 2.2],
  });

  const ring1Opacity = pulseRing1.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.7, 0.35, 0],
  });

  const ring2Scale = pulseRing2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 2.2],
  });

  const ring2Opacity = pulseRing2.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.7, 0.35, 0],
  });

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={navigateNext} style={styles.container}>
      {/* Background Cyber Mesh Glow Orbs */}
      <View style={styles.bgOrb} />
      <View style={styles.bgOrbSecondary} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated Shield Container */}
        <View style={styles.shieldContainer}>
          {/* Outer Expanding Sonar Wave 1 */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: ring1Scale }],
                opacity: ring1Opacity,
              },
            ]}
          />

          {/* Outer Expanding Sonar Wave 2 */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: ring2Scale }],
                opacity: ring2Opacity,
                borderColor: Colors.accentEmerald,
              },
            ]}
          />

          {/* Rotating Orbital Beacon Ring */}
          <Animated.View
            style={[
              styles.orbitalRing,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={styles.orbitalBeacon} />
            <View style={styles.orbitalBeaconOpposite} />
          </Animated.View>

          {/* Core Tactical Shield Card */}
          <View style={styles.shieldCard}>
            <View style={styles.shieldInnerGradient}>
              {/* Emergency Shield Icon with Glow */}
              <Ionicons name="shield" size={88} color={Colors.primary} style={styles.shieldSvg} />

              {/* Heartbeat Cross Pulse inside Shield */}
              <Animated.View
                style={[
                  styles.shieldCrossOverlay,
                  {
                    transform: [{ scale: crossPulse }],
                  },
                ]}
              >
                <MaterialCommunityIcons name="plus" size={38} color="#FFFFFF" />
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Brand Title */}
        <View style={styles.brandRow}>
          <Text style={styles.title}>Res</Text>
          <Text style={styles.titleHighlight}>Q</Text>
          <Text style={styles.title}>Net</Text>
        </View>

        {/* Tactical Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>OFF-GRID EMERGENCY MESH PROTOCOL</Text>
        </View>

        <Text style={styles.subtitle}>
          Decentralized Lifeline When{'\n'}Everything Else Fails
        </Text>

        {/* Telemetry Progress Bar & Diagnostics */}
        <View style={styles.bootCard}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText} numberOfLines={1}>
              {BOOT_STATUSES[statusIdx]}
            </Text>
            <Text style={styles.percentText}>{progress}%</Text>
          </View>
        </View>

        {/* Skip action hint */}
        <Text style={styles.skipHint}>Tap anywhere to continue</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    overflow: 'hidden',
  },
  bgOrb: {
    position: 'absolute',
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: (width * 1.1) / 2,
    backgroundColor: 'rgba(39, 212, 199, 0.08)',
    top: -width * 0.2,
    alignSelf: 'center',
  },
  bgOrbSecondary: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(82, 225, 176, 0.06)',
    bottom: -width * 0.25,
    alignSelf: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  shieldContainer: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  orbitalRing: {
    position: 'absolute',
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 1,
    borderColor: 'rgba(39, 212, 199, 0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitalBeacon: {
    position: 'absolute',
    top: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accentCyan,
    shadowColor: Colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  orbitalBeaconOpposite: {
    position: 'absolute',
    bottom: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentEmerald,
    shadowColor: Colors.accentEmerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  shieldCard: {
    width: 116,
    height: 126,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderBright,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  shieldInnerGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shieldSvg: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  shieldCrossOverlay: {
    position: 'absolute',
    top: 22,
    alignSelf: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 0.8,
  },
  titleHighlight: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primary,
    textShadowColor: 'rgba(39, 212, 199, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 212, 199, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(39, 212, 199, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentEmerald,
    marginRight: 8,
  },
  badgeText: {
    color: Colors.accentCyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  bootCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 5,
    backgroundColor: Colors.secondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentCyan,
    marginRight: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.primary,
    marginLeft: 8,
  },
  skipHint: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
});
