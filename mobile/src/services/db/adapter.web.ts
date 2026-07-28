import { UserProfile, MedicalInformation, EmergencyContact, CompleteEmergencyProfile } from "../../types/profile";
import { DataVaultCipher } from "./cipher";
import { DatabaseAdapterContract } from "./types";

function getInitialSeed(): CompleteEmergencyProfile {
  const now = new Date().toISOString();
  return {
    personal: {
      id: "usr_active_001",
      fullName: "Alex Mercer",
      age: "29",
      gender: "Other",
      dateOfBirth: "1997-04-12",
      bloodGroup: "O+",
      height: "178 cm",
      weight: "74 kg",
      photographUrl: "placeholder_avatar_blue.png",
      phoneNumber: "+1 (555) 382-9102",
      email: "alex.mercer@resqnet.org",
      languagesSpoken: "English, Spanish",
      responderSkills: ["CPR Certified", "First Aid", "Volunteer Responder"],
      consentToShareMedical: true,
      organDonor: true,
      syncHash: "RQ-HASH-INIT-WEB",
      lastUpdated: now,
    },
    medical: {
      medicalConditions: "Mild seasonal asthma",
      allergies: "Penicillin, Peanuts (Severe)",
      currentMedications: "Albuterol Inhaler (as needed), Antihistamine 10mg",
      disabilities: "None (Full Mobility)",
      pregnancyStatus: "Not Applicable",
      updatedAt: now,
    },
    contacts: [
      { id: "c1", name: "Dr. Elena Mercer", relationship: "Spouse (Physician)", phoneNumber: "+1 (555) 440-8819", priorityOrder: 1 },
      { id: "c2", name: "Marcus Vance", relationship: "Brother / SAR Unit", phoneNumber: "+1 (555) 712-4402", priorityOrder: 2 },
      { id: "c3", name: "St. Jude Emergency Desk", relationship: "Primary Healthcare Provider", phoneNumber: "+1 (555) 911-0022", priorityOrder: 3 },
    ],
    settings: {
      mesh_mode: "bluetooth_wifi_direct",
      auto_sos: "enabled",
    },
  };
}

let memoryVault: CompleteEmergencyProfile = getInitialSeed();

export const DatabaseAdapter: DatabaseAdapterContract = {
  getEmergencyProfile: async (): Promise<CompleteEmergencyProfile> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const item = window.localStorage.getItem("resqnet_vault");
        if (item) return JSON.parse(item);
        window.localStorage.setItem("resqnet_vault", JSON.stringify(memoryVault));
      }
    } catch (e) {}
    return memoryVault;
  },

  saveUserProfile: async (profile: UserProfile): Promise<boolean> => {
    memoryVault.personal = { ...memoryVault.personal, ...profile, syncHash: DataVaultCipher.computeSyncHash(profile), lastUpdated: new Date().toISOString() };
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("resqnet_vault", JSON.stringify(memoryVault));
      }
    } catch (e) {}
    return true;
  },

  saveMedicalInformation: async (med: MedicalInformation): Promise<boolean> => {
    memoryVault.medical = { ...med, updatedAt: new Date().toISOString() };
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("resqnet_vault", JSON.stringify(memoryVault));
      }
    } catch (e) {}
    return true;
  },

  saveEmergencyContacts: async (contacts: EmergencyContact[]): Promise<boolean> => {
    memoryVault.contacts = contacts;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("resqnet_vault", JSON.stringify(memoryVault));
      }
    } catch (e) {}
    return true;
  },

  saveAppSetting: async (key: string, value: string): Promise<boolean> => {
    memoryVault.settings[key] = value;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("resqnet_vault", JSON.stringify(memoryVault));
      }
    } catch (e) {}
    return true;
  },
};
