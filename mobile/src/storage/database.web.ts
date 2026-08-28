import { CompleteEmergencyProfile, UserProfile, MedicalInformation, EmergencyContact } from '../types/profile';
import { RegisterData } from '../types/auth';

let AsyncStorage: any = null;
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    AsyncStorage = {
      getItem: async (key: string) => window.localStorage.getItem(key),
      setItem: async (key: string, val: string) => window.localStorage.setItem(key, val),
      removeItem: async (key: string) => window.localStorage.removeItem(key),
    };
  } else {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  }
} catch {
  const memoryStore: Record<string, string> = {};
  AsyncStorage = {
    getItem: async (key: string) => memoryStore[key] || null,
    setItem: async (key: string, val: string) => { memoryStore[key] = val; },
    removeItem: async (key: string) => { delete memoryStore[key]; },
  };
}

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

function getStorageKeyForUser(email?: string): string {
  if (email && email.trim()) {
    const clean = email.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
    return `${STORAGE_KEYS.PROFILE}_${clean}`;
  }
  return STORAGE_KEYS.PROFILE;
}

export function createNewUserProfile(name?: string, email?: string, extraData?: Partial<RegisterData>): CompleteEmergencyProfile {
  const cleanName = name || extraData?.name || (email ? email.split('@')[0] : "New User");
  const cleanEmail = email || extraData?.email || "user@resqnet.org";

  return {
    personal: {
      id: `usr_${Date.now()}`,
      fullName: cleanName,
      age: extraData?.age || "25",
      gender: extraData?.gender || "Male",
      dateOfBirth: "2000-01-01",
      bloodGroup: (extraData?.bloodGroup as any) || "O+",
      height: extraData?.height ? (extraData.height.toLowerCase().includes('cm') ? extraData.height : `${extraData.height} cm`) : "175 cm",
      weight: extraData?.weight ? (extraData.weight.toLowerCase().includes('kg') ? extraData.weight : `${extraData.weight} kg`) : "70 kg",
      photographUrl: "",
      phoneNumber: extraData?.phoneNumber || "+91 9876543210",
      email: cleanEmail,
      languagesSpoken: "English",
      responderSkills: ["First Aid"],
      consentToShareMedical: true,
      organDonor: false,
      syncHash: `RQ-HASH-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    },
    medical: {
      medicalConditions: extraData?.medicalConditions || "None reported",
      allergies: extraData?.allergies || "None reported",
      currentMedications: extraData?.currentMedications || "None",
      disabilities: extraData?.disabilities || "None",
      pregnancyStatus: "Not Applicable",
      updatedAt: new Date().toISOString(),
    },
    contacts: [
      {
        id: "c1",
        name: extraData?.emergencyContactName || "Primary Emergency Contact",
        relationship: extraData?.emergencyContactRelation || "Family",
        phoneNumber: extraData?.emergencyContactPhone || "+91 9900011122",
        priorityOrder: 1
      }
    ],
    settings: {
      mesh_mode: "bluetooth_wifi_direct",
      auto_sos: "enabled",
    },
  };
}

export async function initDatabase(email?: string): Promise<void> {
  const key = getStorageKeyForUser(email);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    const defaultProf = createNewUserProfile(undefined, email);
    await AsyncStorage.setItem(key, JSON.stringify(defaultProf));
  }
}

export async function saveCompleteProfile(profile: CompleteEmergencyProfile, email?: string): Promise<void> {
  const targetEmail = email || profile.personal.email;
  const key = getStorageKeyForUser(targetEmail);
  await AsyncStorage.setItem(key, JSON.stringify(profile));
  // Also keep default key synced for fallback
  await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export async function getCompleteProfile(email?: string): Promise<CompleteEmergencyProfile> {
  const key = getStorageKeyForUser(email);
  let raw = await AsyncStorage.getItem(key);
  
  if (!raw && email) {
    // Try fallback to general profile
    raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
  }

  if (!raw) {
    const fresh = createNewUserProfile(undefined, email);
    await saveCompleteProfile(fresh, email);
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw);
    if (email && parsed.personal && !parsed.personal.email) {
      parsed.personal.email = email;
    }
    return parsed;
  } catch {
    return email ? createNewUserProfile(undefined, email) : DEFAULT_ALEX_MERCER_PROFILE;
  }
}

export async function getPersonDetails(email?: string): Promise<UserProfile> {
  const profile = await getCompleteProfile(email);
  return profile.personal;
}

export async function savePersonDetails(person: Partial<UserProfile>, email?: string): Promise<void> {
  const targetEmail = email || person.email;
  const current = await getCompleteProfile(targetEmail);
  const updated: CompleteEmergencyProfile = {
    ...current,
    personal: {
      ...current.personal,
      ...person,
      lastUpdated: new Date().toISOString(),
    },
  };
  await saveCompleteProfile(updated, targetEmail);
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
