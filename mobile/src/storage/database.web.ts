import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersonRecord {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  bloodType?: string;
  emergencyContact?: string;
  createdAt?: string;
}

export interface LocationRecord {
  id?: number;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: string;
}

const STORAGE_KEYS = {
  PERSON: '@resqnet_sql_person',
  LOCATIONS: '@resqnet_sql_locations',
};

export async function initDatabase(): Promise<void> {
  // Web storage auto-initializes
}

export async function savePersonDetails(person: PersonRecord): Promise<void> {
  const timestamp = person.createdAt || new Date().toISOString();
  await AsyncStorage.setItem(STORAGE_KEYS.PERSON, JSON.stringify({ ...person, createdAt: timestamp }));
}

export async function getPersonDetails(): Promise<PersonRecord | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PERSON);
  return raw ? JSON.parse(raw) : null;
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
