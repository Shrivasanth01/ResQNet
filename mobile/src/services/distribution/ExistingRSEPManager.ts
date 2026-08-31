import { EmergencyPacket } from "../../types/packet";
import { PacketStorage } from "../packet/PacketStorage";
import { PacketBuilder } from "../packet/PacketBuilder";
import { PacketValidator } from "../packet/PacketValidator";
import { LocationService } from "../hardware/LocationService";
import { getCompleteProfile } from "../../storage/database";

/**
 * MODULE 1: EXISTING RSEP SYSTEM
 * 
 * CORE REQUIREMENT ENFORCEMENT:
 * - The RSEP file is ALREADY CREATED by the system.
 * - DO NOT create a new RSEP file on each relay.
 * - DO NOT redesign or change the existing RSEP file generation.
 * - DO NOT add a manual file-selection step.
 * - Automatically loads the existing source emergency packet from the local secure storage.
 */
export class ExistingRSEPManager {
  private static cachedRSEP: EmergencyPacket | null = null;

  /**
   * Retrieves the existing RSEP file / emergency packet without any user interaction or file dialogs.
   * If a stored RSEP already exists in the outbox vault, it is returned directly.
   * If not yet saved to disk, it retrieves the initial emergency packet from the profile & GPS snapshot.
   */
  public static async getExistingRSEP(): Promise<EmergencyPacket> {
    // 1. Check in-memory cache if already primed
    if (this.cachedRSEP) {
      return this.cachedRSEP;
    }

    // 2. Fetch from existing offline packet outbox repository
    try {
      const storedPackets = await PacketStorage.getAllPackets();
      if (storedPackets && storedPackets.length > 0) {
        // Find most recent critical emergency packet
        const active = storedPackets.find((p) => p.incident?.severity === "CRITICAL") || storedPackets[storedPackets.length - 1];
        if (active) {
          const val = PacketValidator.validate(active);
          if (val.isValid) {
            console.log(`[ExistingRSEPManager] ✅ Found existing RSEP in vault: ${active.header.packetId}`);
            this.cachedRSEP = active;
            return active;
          }
        }
      }
    } catch (err) {
      console.warn("[ExistingRSEPManager] Vault check warning:", err);
    }

    // 3. If storage has not yet initialized the initial RSEP, construct the initial master RSEP
    console.log("[ExistingRSEPManager] Initializing existing master RSEP from profile & GPS snapshot...");
    const loc = await LocationService.getLatestLocation();
    const profile = await getCompleteProfile();

    const masterRSEP = await PacketBuilder.buildEmergencyPacket({
      emergencyType: "Manual 3-Second SOS Distress",
      severity: "CRITICAL",
      ecs: 100,
      isAutomatic: false,
      triggerSource: "MANUAL_SOS_BUTTON",
      latitude: loc?.latitude,
      longitude: loc?.longitude,
      altitude: loc?.altitude,
      accuracy: loc?.accuracy,
      locationSource: loc ? "LIVE" : "CACHED",
      additionalDescription: profile?.contacts?.[0]
        ? `Primary Contact: ${profile.contacts[0].name} (${profile.contacts[0].phoneNumber})`
        : "Direct SOS Distress broadcast via ResQNet Mesh",
    });

    // Save as the persistent baseline RSEP
    await PacketStorage.savePacket(masterRSEP);
    this.cachedRSEP = masterRSEP;
    return masterRSEP;
  }

  /**
   * Sets or updates the active RSEP reference without modifying underlying emergency dossier.
   */
  public static setExistingRSEP(packet: EmergencyPacket): void {
    this.cachedRSEP = packet;
    PacketStorage.savePacket(packet).catch(() => {});
  }

  /**
   * Clears in-memory cache when emergency is resolved.
   */
  public static clearCache(): void {
    this.cachedRSEP = null;
  }
}
