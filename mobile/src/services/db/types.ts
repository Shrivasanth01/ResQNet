import { UserProfile, MedicalInformation, EmergencyContact, CompleteEmergencyProfile } from "../../types/profile";

export interface DatabaseAdapterContract {
  getEmergencyProfile(): Promise<CompleteEmergencyProfile>;
  saveUserProfile(profile: UserProfile): Promise<boolean>;
  saveMedicalInformation(med: MedicalInformation): Promise<boolean>;
  saveEmergencyContacts(contacts: EmergencyContact[]): Promise<boolean>;
  saveAppSetting(key: string, value: string): Promise<boolean>;
}
