import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompleteEmergencyProfile, UserProfile, MedicalInformation, EmergencyContact } from '../types/profile';

export interface LocationRecord {
  id?: number;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: string;
}

const STORAGE_KEYS = {
  PROFILE: '@resqnet_sql_profile',
  LOCATIONS: '@resqnet_sql_locations',
};

export const DEFAULT_ALEX_MERCER_PROFILE: CompleteEmergencyProfile = {
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
    lastUpdated: new Date().toISOString(),
  },
  medical: {
    medicalConditions: "Mild seasonal asthma",
    allergies: "Penicillin, Peanuts (Severe)",
    currentMedications: "Albuterol Inhaler (as needed), Antihistamine 10mg",
    disabilities: "None (Full Mobility)",
    pregnancyStatus: "Not Applicable",
    updatedAt: new Date().toISOString(),
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

export async function initDatabase(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!raw) {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_ALEX_MERCER_PROFILE));
  }
}

export async function saveCompleteProfile(profile: CompleteEmergencyProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export async function getCompleteProfile(): Promise<CompleteEmergencyProfile> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!raw) return DEFAULT_ALEX_MERCER_PROFILE;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ALEX_MERCER_PROFILE;
  }
}

export async function getPersonDetails(): Promise<UserProfile> {
  const profile = await getCompleteProfile();
  return profile.personal;
}

export async function savePersonDetails(person: Partial<UserProfile>): Promise<void> {
  const current = await getCompleteProfile();
  const updated: CompleteEmergencyProfile = {
    ...current,
    personal: {
      ...current.personal,
      ...person,
      lastUpdated: new Date().toISOString(),
    },
  };
  await saveCompleteProfile(updated);
}

export async function saveLocationRecord(location: LocationRecord): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCATIONS);
  const list: LocationRecord[] = raw ? JSON.parse(raw) : [];
  list.unshift(location);
  await AsyncStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(list.slice(0, 50)));
}

export async function getLocationHistory(limit: number = 20): Promise<LocationRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCATIONS);
  const list: LocationRecord[] = raw ? JSON.parse(raw) : [];
  return list.slice(0, limit);
}
