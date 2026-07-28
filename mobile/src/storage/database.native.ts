import * as SQLite from 'expo-sqlite';

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

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  try {
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
    console.warn('[SQLite Native] Init error:', error);
  }
}

export async function savePersonDetails(person: PersonRecord): Promise<void> {
  if (!db) await initDatabase();
  const timestamp = person.createdAt || new Date().toISOString();

  if (db) {
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
}

export async function getPersonDetails(): Promise<PersonRecord | null> {
  if (!db) await initDatabase();
  if (!db) return null;

  const result = await db.getFirstAsync<PersonRecord>(
    'SELECT * FROM person_details ORDER BY id DESC LIMIT 1;'
  );
  return result || null;
}

export async function saveLocationRecord(location: LocationRecord): Promise<void> {
  if (!db) await initDatabase();
  if (db) {
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
}

export async function getLocationHistory(limit: number = 20): Promise<LocationRecord[]> {
  if (!db) await initDatabase();
  if (!db) return [];

  const results = await db.getAllAsync<LocationRecord>(
    'SELECT * FROM location_history ORDER BY id DESC LIMIT ?;',
    [limit]
  );
  return results || [];
}
