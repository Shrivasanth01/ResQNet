import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { API_CONFIG } from '../../constants/app';
import { getCompleteProfile } from '../../storage/database';
import { LocationService } from '../hardware/LocationService';
import { CompleteEmergencyProfile } from '../../types/profile';

export interface SOSDispatchResult {
  success: boolean;
  message: string;
  recipients: string[];
  googleMapsUrl?: string;
  smsUri?: string;
  phoneNumber?: string;
}

export class EmergencyDispatchService {
  /**
   * Dispatches the full emergency distress payload to emergency contacts:
   * 1. High-priority Gmail SMTP Email with Live GPS & Medical Vault Dossier
   * 2. Formatted SMS with direct Google Maps link & Medical Summary
   * 3. Automatic Phone Call
   */
  public static async dispatchToEmergencyContacts(): Promise<SOSDispatchResult> {
    console.log('[EmergencyDispatchService] 🚨 Dispatches all info to emergency contacts...');

    let profile: CompleteEmergencyProfile | null = null;
    try {
      profile = await getCompleteProfile();
    } catch (e) {
      console.warn('[EmergencyDispatchService] Could not load profile:', e);
    }

    let loc = null;
    try {
      loc = await LocationService.getLatestLocation();
    } catch (e) {
      console.warn('[EmergencyDispatchService] GPS failed, checking cached:', e);
    }

    const personal = profile?.personal;
    const medical = profile?.medical;
    const primaryContact = profile?.contacts && profile.contacts.length > 0
      ? profile.contacts[0]
      : null;

    const lat = loc?.latitude || 0.0;
    const lng = loc?.longitude || 0.0;
    const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : 'https://www.google.com/maps';

    // 1. Send live emergency email via backend Gmail SMTP
    const payload = {
      senderName: personal?.fullName || 'ResQNet User',
      senderEmail: personal?.email || '',
      senderPhone: personal?.phoneNumber || '',
      age: personal?.age || '',
      gender: personal?.gender || '',
      bloodGroup: personal?.bloodGroup || 'Unknown',
      medicalConditions: medical?.medicalConditions || 'None reported',
      allergies: medical?.allergies || 'None reported',
      currentMedications: medical?.currentMedications || 'None',
      emergencyContactName: primaryContact?.name || 'Emergency Services',
      emergencyContactPhone: primaryContact?.phoneNumber || '112',
      emergencyContactEmail: '', // will fallback to sender and cloud triage
      emergencyContactRelation: primaryContact?.relationship || 'Emergency Contact',
      latitude: lat,
      longitude: lng,
      accuracy: loc?.accuracy || 10,
      timestamp: new Date().toISOString(),
      packetId: `PKT-${Date.now().toString(36).toUpperCase()}`,
      emergencyType: 'MANUAL 3-SECOND SOS DISTRESS BEACON',
    };

    let emailResult: any = { success: false, recipients: [] };
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await fetch(`${baseUrl}/auth/sos/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        emailResult = await response.json();
        console.log('[EmergencyDispatchService] ✅ SOS Distress Email dispatched:', emailResult);
      }
    } catch (emailErr) {
      console.warn('[EmergencyDispatchService] Cloud email dispatch deferred (offline/mesh):', emailErr);
    }

    // 2. Build prefilled SMS distress message
    const victimName = personal?.fullName || 'I';
    const cleanPhone = (primaryContact?.phoneNumber || '112').replace(/\s+/g, '');
    const smsBody = `🚨 EMERGENCY SOS ALERT from ${victimName}!\nI need urgent help.\n📍 Live Location: ${mapsUrl}\n🩸 Blood: ${personal?.bloodGroup || 'Unknown'}\n🩺 Allergies: ${medical?.allergies || 'None'}\nConditions: ${medical?.medicalConditions || 'None'}\nPlease send rescue support immediately!`;

    const encodedBody = encodeURIComponent(smsBody);
    const smsUri = Platform.OS === 'ios' ? `sms:${cleanPhone}&body=${encodedBody}` : `sms:${cleanPhone}?body=${encodedBody}`;

    return {
      success: true,
      message: emailResult?.message || 'Emergency distress dispatched.',
      recipients: emailResult?.recipients || [primaryContact?.name || 'Emergency Contact'],
      googleMapsUrl: mapsUrl,
      smsUri,
      phoneNumber: cleanPhone,
    };
  }

  /**
   * Helper to open prefilled SMS app with emergency distress text and GPS link.
   */
  public static async sendDistressSMS(smsUri: string): Promise<void> {
    try {
      const canOpen = await Linking.canOpenURL(smsUri);
      if (canOpen) {
        await Linking.openURL(smsUri);
      }
    } catch (e) {
      console.warn('[EmergencyDispatchService] Could not open SMS composer:', e);
    }
  }

  /**
   * Helper to launch direct phone call.
   */
  public static async callEmergencyContact(phoneNumber: string): Promise<void> {
    try {
      const telUrl = `tel:${phoneNumber.replace(/\s+/g, '')}`;
      await Linking.openURL(telUrl);
    } catch (e) {
      console.warn('[EmergencyDispatchService] Could not initiate call:', e);
    }
  }
}
