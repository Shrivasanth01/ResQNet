import { Platform } from 'react-native';
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

let db: any = null;

/**
 * Initialize SQLite Database tables for person_details and location_history.
 */
export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') {
    // Web platform uses fallback storage shim
    return;
  }

  try {
    const SQLite = require('expo-sqlite');
    db = await SQLite.openDatabaseAsync('resqnet.db');

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS person_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        bloodType TEXT,
        emergencyContact TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS location_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy REAL,
        timestamp TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.warn('[SQLite] Initialization fallback:', error);
  }
}

/**
 * Save or update person details in SQLite database.
 */
export async function savePersonDetails(person: PersonRecord): Promise<void> {
  const timestamp = person.createdAt || new Date().toISOString();

  if (Platform.OS === 'web' || !db) {
    await AsyncStorage.setItem(STORAGE_KEYS.PERSON, JSON.stringify({ ...person, createdAt: timestamp }));
    return;
  }

  await db.runAsync(
    `INSERT INTO person_details (name, email, phone, bloodType, emergencyContact, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       name=excluded.name,
       phone=excluded.phone,
       bloodType=excluded.bloodType,
       emergencyContact=excluded.emergencyContact;`,
    [
      person.name,
      person.email,
      person.phone || '',
      person.bloodType || '',
      person.emergencyContact || '',
      timestamp,
    ]
  );
}

/**
 * Retrieve person details from SQLite database.
 */
export async function getPersonDetails(): Promise<PersonRecord | null> {
  if (Platform.OS === 'web' || !db) {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PERSON);
    return raw ? JSON.parse(raw) : null;
  }

  const result = await db.getFirstAsync<PersonRecord>(
    'SELECT * FROM person_details ORDER BY id DESC LIMIT 1;'
  );
  return result || null;
}

/**
 * Save a new location telemetry entry into SQLite database.
 */
export async function saveLocationRecord(location: LocationRecord): Promise<void> {
  if (Platform.OS === 'web' || !db) {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCATIONS);
    const list: LocationRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(location);
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(list.slice(0, 50)));
    return;
  }

  await db.runAsync(
    `INSERT INTO location_history (latitude, longitude, accuracy, timestamp)
     VALUES (?, ?, ?, ?);`,
    [
      location.latitude,
      location.longitude,
      location.accuracy || null,
      location.timestamp,
    ]
  );
}

/**
 * Get recent location history records from SQLite database.
 */
export async function getLocationHistory(limit: number = 20): Promise<LocationRecord[]> {
  if (Platform.OS === 'web' || !db) {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCATIONS);
    const list: LocationRecord[] = raw ? JSON.parse(raw) : [];
    return list.slice(0, limit);
  }

  const results = await db.getAllAsync<LocationRecord>(
    'SELECT * FROM location_history ORDER BY id DESC LIMIT ?;',
    [limit]
  );
  return results || [];
}
