import * as SQLite from 'expo-sqlite';
import { UserProfile, MedicalInformation, EmergencyContact, CompleteEmergencyProfile } from '../types/profile';

export interface LocationRecord {
  id?: number;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: string;
}

let db: SQLite.SQLiteDatabase | null = null;

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
    syncHash: "RQ-HASH-INIT-SQL",
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
  try {
    db = await SQLite.openDatabaseAsync('resqnet.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS person_details (
        id TEXT PRIMARY KEY,
        fullName TEXT NOT NULL,
        age TEXT,
        gender TEXT,
        dateOfBirth TEXT,
        bloodGroup TEXT,
        height TEXT,
        weight TEXT,
        phoneNumber TEXT,
        email TEXT UNIQUE NOT NULL,
        languagesSpoken TEXT,
        responderSkills TEXT,
        consentToShareMedical INTEGER,
        organDonor INTEGER,
        syncHash TEXT,
        lastUpdated TEXT
      );

      CREATE TABLE IF NOT EXISTS medical_vault (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicalConditions TEXT,
        allergies TEXT,
        currentMedications TEXT,
        disabilities TEXT,
        pregnancyStatus TEXT,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        relationship TEXT,
        phoneNumber TEXT,
        priorityOrder INTEGER
      );

      CREATE TABLE IF NOT EXISTS location_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy REAL,
        timestamp TEXT NOT NULL
      );
    `);

    // Seed default Alex Mercer profile if empty
    const existing = await db.getFirstAsync('SELECT * FROM person_details LIMIT 1;');
    if (!existing) {
      await saveCompleteProfile(DEFAULT_ALEX_MERCER_PROFILE);
    }
  } catch (error) {
    console.warn('[SQLite Native] Init error:', error);
  }
}

export async function saveCompleteProfile(profile: CompleteEmergencyProfile): Promise<void> {
  if (!db) await initDatabase();
  if (!db) return;

  const p = profile.personal;
  await db.runAsync(
    `INSERT INTO person_details (
      id, fullName, age, gender, dateOfBirth, bloodGroup, height, weight, 
      phoneNumber, email, languagesSpoken, responderSkills, consentToShareMedical, 
      organDonor, syncHash, lastUpdated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      fullName=excluded.fullName, age=excluded.age, gender=excluded.gender,
      dateOfBirth=excluded.dateOfBirth, bloodGroup=excluded.bloodGroup,
      height=excluded.height, weight=excluded.weight, phoneNumber=excluded.phoneNumber,
      email=excluded.email, languagesSpoken=excluded.languagesSpoken,
      responderSkills=excluded.responderSkills, consentToShareMedical=excluded.consentToShareMedical,
      organDonor=excluded.organDonor, syncHash=excluded.syncHash, lastUpdated=excluded.lastUpdated;`,
    [
      p.id, p.fullName, p.age, p.gender, p.dateOfBirth, p.bloodGroup,
      p.height, p.weight, p.phoneNumber, p.email, p.languagesSpoken,
      JSON.stringify(p.responderSkills || []), p.consentToShareMedical ? 1 : 0,
      p.organDonor ? 1 : 0, p.syncHash, p.lastUpdated
    ]
  );

  const m = profile.medical;
  await db.runAsync(
    `INSERT INTO medical_vault (id, medicalConditions, allergies, currentMedications, disabilities, pregnancyStatus, updatedAt)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       medicalConditions=excluded.medicalConditions, allergies=excluded.allergies,
       currentMedications=excluded.currentMedications, disabilities=excluded.disabilities,
       pregnancyStatus=excluded.pregnancyStatus, updatedAt=excluded.updatedAt;`,
    [m.medicalConditions, m.allergies, m.currentMedications, m.disabilities, m.pregnancyStatus || '', m.updatedAt]
  );

  await db.runAsync('DELETE FROM emergency_contacts;');
  for (const c of profile.contacts) {
    await db.runAsync(
      `INSERT INTO emergency_contacts (id, name, relationship, phoneNumber, priorityOrder)
       VALUES (?, ?, ?, ?, ?);`,
      [c.id, c.name, c.relationship, c.phoneNumber, c.priorityOrder]
    );
  }
}

export async function getCompleteProfile(): Promise<CompleteEmergencyProfile> {
  if (!db) await initDatabase();
  if (!db) return DEFAULT_ALEX_MERCER_PROFILE;

  const pRow = await db.getFirstAsync<any>('SELECT * FROM person_details LIMIT 1;');
  const mRow = await db.getFirstAsync<any>('SELECT * FROM medical_vault LIMIT 1;');
  const cRows = await db.getAllAsync<any>('SELECT * FROM emergency_contacts ORDER BY priorityOrder ASC;');

  if (!pRow) return DEFAULT_ALEX_MERCER_PROFILE;

  return {
    personal: {
      ...pRow,
      responderSkills: typeof pRow.responderSkills === 'string' ? JSON.parse(pRow.responderSkills) : (pRow.responderSkills || []),
      consentToShareMedical: Boolean(pRow.consentToShareMedical),
      organDonor: Boolean(pRow.organDonor),
    },
    medical: mRow || DEFAULT_ALEX_MERCER_PROFILE.medical,
    contacts: cRows.length > 0 ? cRows : DEFAULT_ALEX_MERCER_PROFILE.contacts,
    settings: DEFAULT_ALEX_MERCER_PROFILE.settings,
  };
}

export async function saveLocationRecord(location: LocationRecord): Promise<void> {
  if (!db) await initDatabase();
  if (db) {
    await db.runAsync(
      `INSERT INTO location_history (latitude, longitude, accuracy, timestamp)
       VALUES (?, ?, ?, ?);`,
      [location.latitude, location.longitude, location.accuracy || null, location.timestamp]
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
