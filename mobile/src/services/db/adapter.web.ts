import { UserProfile, MedicalInformation, EmergencyContact, CompleteEmergencyProfile } from "../../types/profile";
import { DataVaultCipher } from "./cipher";
import { DatabaseAdapterContract } from "./types";
import { getCompleteProfile, saveCompleteProfile } from "../../storage/database";

export const DatabaseAdapter: DatabaseAdapterContract = {
  getEmergencyProfile: async (): Promise<CompleteEmergencyProfile> => {
    return await getCompleteProfile();
  },

  saveUserProfile: async (profile: UserProfile): Promise<boolean> => {
    const current = await getCompleteProfile();
    const updated: CompleteEmergencyProfile = {
      ...current,
      personal: {
        ...current.personal,
        ...profile,
        syncHash: DataVaultCipher.computeSyncHash(profile),
        lastUpdated: new Date().toISOString(),
      },
    };
    await saveCompleteProfile(updated);
    return true;
  },

  saveMedicalInformation: async (med: MedicalInformation): Promise<boolean> => {
    const current = await getCompleteProfile();
    const updated: CompleteEmergencyProfile = {
      ...current,
      medical: { ...med, updatedAt: new Date().toISOString() },
    };
    await saveCompleteProfile(updated);
    return true;
  },

  saveEmergencyContacts: async (contacts: EmergencyContact[]): Promise<boolean> => {
    const current = await getCompleteProfile();
    const updated: CompleteEmergencyProfile = {
      ...current,
      contacts,
    };
    await saveCompleteProfile(updated);
    return true;
  },

  saveAppSetting: async (key: string, value: string): Promise<boolean> => {
    const current = await getCompleteProfile();
    const updated: CompleteEmergencyProfile = {
      ...current,
      settings: { ...current.settings, [key]: value },
    };
    await saveCompleteProfile(updated);
    return true;
  },
};
