import { UserProfile, MedicalInformation, EmergencyContact, CompleteEmergencyProfile } from "../../types/profile";
import { DataVaultCipher } from "./cipher";
import { DatabaseAdapterContract } from "./types";
import { getCompleteProfile, saveCompleteProfile } from "../../storage/database";
import { authStorage } from "../../storage/authStorage";

async function getActiveUserEmail(): Promise<string | undefined> {
  try {
    const user = await authStorage.getUser();
    return user?.email;
  } catch {
    return undefined;
  }
}

export const DatabaseAdapter: DatabaseAdapterContract = {
  getEmergencyProfile: async (): Promise<CompleteEmergencyProfile> => {
    const email = await getActiveUserEmail();
    return await getCompleteProfile(email);
  },

  saveUserProfile: async (profile: UserProfile): Promise<boolean> => {
    const email = profile.email || (await getActiveUserEmail());
    const current = await getCompleteProfile(email);
    const updated: CompleteEmergencyProfile = {
      ...current,
      personal: {
        ...current.personal,
        ...profile,
        syncHash: DataVaultCipher.computeSyncHash(profile),
        lastUpdated: new Date().toISOString(),
      },
    };
    await saveCompleteProfile(updated, email);
    return true;
  },

  saveMedicalInformation: async (med: MedicalInformation): Promise<boolean> => {
    const email = await getActiveUserEmail();
    const current = await getCompleteProfile(email);
    const updated: CompleteEmergencyProfile = {
      ...current,
      medical: { ...med, updatedAt: new Date().toISOString() },
    };
    await saveCompleteProfile(updated, email);
    return true;
  },

  saveEmergencyContacts: async (contacts: EmergencyContact[]): Promise<boolean> => {
    const email = await getActiveUserEmail();
    const current = await getCompleteProfile(email);
    const updated: CompleteEmergencyProfile = {
      ...current,
      contacts,
    };
    await saveCompleteProfile(updated, email);
    return true;
  },

  saveAppSetting: async (key: string, value: string): Promise<boolean> => {
    const email = await getActiveUserEmail();
    const current = await getCompleteProfile(email);
    const updated: CompleteEmergencyProfile = {
      ...current,
      settings: { ...current.settings, [key]: value },
    };
    await saveCompleteProfile(updated, email);
    return true;
  },
};
