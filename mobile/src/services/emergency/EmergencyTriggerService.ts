import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import * as IntentLauncher from "expo-intent-launcher";
import { getCompleteProfile } from "../../storage/database";
import { LocationService } from "../hardware/LocationService";
import { PacketBuilder } from "../packet/PacketBuilder";
import { PacketQueue } from "../packet/PacketQueue";
import { CommunicationEngine } from "../communication/CommunicationEngine";
import { EmergencyPacket } from "../../types/packet";
import { CommunicationMethod, DeliveryReceipt } from "../communication/CommunicationTypes";
import { EmergencyDispatchService, SOSDispatchResult } from "./EmergencyDispatchService";
import { AutomaticSOSController, SOSDistributionResult } from "../distribution";

export interface EmergencyTriggerResult {
  packet: EmergencyPacket;
  result: { success: boolean; method: CommunicationMethod; receiptId: string };
  receipt?: DeliveryReceipt | null;
  callInitiated: boolean;
  contactCalled?: { name: string; phoneNumber: string };
  dispatchResult?: SOSDispatchResult;
  distributionResult?: SOSDistributionResult;
}

export class EmergencyTriggerService {
  /**
   * Triggers the full emergency distress pipeline:
   * 1. Automatic direct phone call to saved emergency contact
   * 2. Voice speech emergency beacon
   * 3. Immediate decentralized BLE & Wi-Fi Direct mesh broadcast with GPS coordinates and medical vault data
   */
  public static async triggerSOS(): Promise<EmergencyTriggerResult> {
    console.log("[EmergencyTriggerService] 🚨 EMERGENCY SOS TRIGGERED (3-second hold)!");
    
    // Provide strong tactile confirmation
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}

    // Step 1: Fetch Saved Emergency Profile & Contacts
    let profile = null;
    try {
      profile = await getCompleteProfile();
    } catch (e) {
      console.warn("[EmergencyTriggerService] Error loading emergency profile:", e);
    }

    const primaryContact = profile?.contacts && profile.contacts.length > 0
      ? profile.contacts[0]
      : null;

    const phoneNumberToCall = primaryContact?.phoneNumber || "112";
    const cleanPhone = phoneNumberToCall.replace(/\s+/g, "");
    let callInitiated = false;

    // Step 2: Voice Announcement Beacon
    try {
      const contactLabel = primaryContact ? primaryContact.name : "Emergency Services";
      Speech.speak(`Emergency SOS activated. Calling ${contactLabel} and broadcasting live GPS coordinates.`, {
        rate: 1.05,
        pitch: 1.0,
      });
    } catch (e) {
      console.warn("[EmergencyTriggerService] Speech synthesis deferred:", e);
    }

    // Step 3: Initiate Direct Automatic Cellular Call
    try {
      const telUrl = `tel:${cleanPhone}`;
      console.log(`[EmergencyTriggerService] Executing direct emergency phone call to: ${telUrl}`);
      
      if (Platform.OS === "android") {
        try {
          // Automatic direct calling intent on Android (bypasses manual dial pad)
          await IntentLauncher.startActivityAsync("android.intent.action.CALL", {
            data: telUrl,
          });
          callInitiated = true;
        } catch (androidErr) {
          console.warn("[EmergencyTriggerService] ACTION_CALL intent fallback to standard dialer:", androidErr);
          await Linking.openURL(telUrl);
          callInitiated = true;
        }
      } else {
        const canOpen = await Linking.canOpenURL(telUrl);
        if (canOpen) {
          await Linking.openURL(telUrl);
          callInitiated = true;
        }
      }
    } catch (err) {
      console.warn("[EmergencyTriggerService] Direct cellular call failed or unsupported on this platform:", err);
    }

    // Step 3: Fetch Live GPS Coordinates (or cached fallback)
    let loc = null;
    try {
      loc = await LocationService.getLatestLocation();
    } catch (locErr) {
      console.warn("[EmergencyTriggerService] GPS lock failed, using cached location:", locErr);
    }

    // Step 4: Build Cryptographically Signed Emergency Packet
    const packet = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Manual 3-Second SOS Distress",
      severity: "CRITICAL",
      ecs: 100,
      isAutomatic: false,
      triggerSource: "MANUAL_SOS_BUTTON",
      latitude: loc?.latitude,
      longitude: loc?.longitude,
      altitude: loc?.altitude,
      accuracy: loc?.accuracy,
      speed: loc?.speed,
      heading: loc?.heading,
      locationSource: loc ? "LIVE" : "CACHED",
      additionalDescription: primaryContact
        ? `Primary Contact: ${primaryContact.name} (${primaryContact.phoneNumber})`
        : "Direct SOS Distress broadcast via ResQNet Mesh",
    });

    // Step 5: Enqueue into local SQLite / IndexedDB Store-and-Forward Queue
    await PacketQueue.enqueue(packet);

    // Step 6: Dispatch live emergency distress email & SMS payload to emergency contacts
    let dispatchResult: SOSDispatchResult | undefined;
    try {
      dispatchResult = await EmergencyDispatchService.dispatchToEmergencyContacts();
    } catch (dispatchErr) {
      console.warn("[EmergencyTriggerService] Emergency contact dispatch deferred:", dispatchErr);
    }

    // Step 7: Launch the Automated SOS Distribution Mesh Pipeline
    let distributionResult: SOSDistributionResult | undefined;
    try {
      distributionResult = await AutomaticSOSController.triggerAutomaticSOS();
    } catch (distErr) {
      console.warn("[EmergencyTriggerService] Automatic distribution pipeline error:", distErr);
    }

    // Step 8: Dispatch across all mesh carriers (Internet -> BLE Mesh -> Wi-Fi Direct Mesh)
    const result = await CommunicationEngine.deliverPacket(packet);
    const receipt = CommunicationEngine.getReceipt(packet.header.packetId);
    console.log(`[EmergencyTriggerService] SOS Packet dispatched via ${result.method} (Success: ${result.success})`);

    return {
      packet,
      result,
      receipt,
      callInitiated,
      contactCalled: primaryContact ? { name: primaryContact.name, phoneNumber: primaryContact.phoneNumber } : undefined,
      dispatchResult,
      distributionResult,
    };
  }
}
