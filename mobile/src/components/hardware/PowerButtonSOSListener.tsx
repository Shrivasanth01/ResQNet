import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { HardwareButtonDetector } from '../../services/hardware/HardwareButtonDetector';
import { Colors } from '../../theme/colors';

export default function PowerButtonSOSListener({ children }: { children: React.ReactNode }) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    HardwareButtonDetector.initialize();

    const unsubscribe = HardwareButtonDetector.subscribe(() => {
      setShowModal(true);
      // Automatically navigate to SOS broadcast screen
      router.push('/sos');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* Emergency Power Button Trigger Modal Alert */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="warning" size={48} color={Colors.white} />
            </View>
            <Text style={styles.alertTitle}>POWER BUTTON SOS TRIGGERED!</Text>
            <Text style={styles.alertSubtitle}>
              Rapid hardware power button taps detected! Emergency distress alert has been broadcasted to nearby devices and rescue command center.
            </Text>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                setShowModal(false);
                router.push('/sos');
              }}
            >
              <Text style={styles.actionText}>VIEW SOS BROADCAST SCREEN</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  alertSubtitle: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    color: Colors.white,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
});
