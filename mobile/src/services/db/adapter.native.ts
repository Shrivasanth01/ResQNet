import * as SQLite from "expo-sqlite";
import { UserProfile, MedicalInformation, EmergencyContact, CompleteEmergencyProfile } from "../../types/profile";
import { DataVaultCipher } from "./cipher";
import { DatabaseAdapterContract } from "./types";
import { DatabaseAdapter as FallbackAdapter } from "./adapter.web";

const DB_NAME = "resqnet_vault.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isFailed = false;

function getDb(): SQLite.SQLiteDatabase | null {
  if (isFailed) return null;
  if (!dbInstance) {
    try {
      dbInstance = SQLite.openDatabaseSync(DB_NAME);
      initTables(dbInstance);
    } catch (err) {
      console.warn("SQLite hardware vault initialization failed or permission denied. Falling back to in-memory vault.", err);
      isFailed = true;
      dbInstance = null;
      return null;
    }
  }
  return dbInstance;
}

function initTables(db: SQLite.SQLiteDatabase) {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        age TEXT,
        gender TEXT,
        date_of_birth TEXT,
        blood_group TEXT,
        height TEXT,
        weight TEXT,
        photograph_url TEXT,
        phone_number TEXT,
        email TEXT,
        languages_spoken TEXT,
        responder_skills TEXT,
        consent_to_share INTEGER DEFAULT 1,
        organ_donor INTEGER DEFAULT 0,
        sync_hash TEXT,
        last_updated TEXT
      );

      CREATE TABLE IF NOT EXISTS medical_information (
        id TEXT PRIMARY KEY,
        medical_conditions TEXT,
        allergies TEXT,
        current_medications TEXT,
        disabilities TEXT,
        pregnancy_status TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        priority_order INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS application_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        description TEXT
      );
    `);

    const res = db.getAllSync<{ count: number }>("SELECT count(*) as count FROM user_profile");
    if (res && res[0].count === 0) {
      seedDefaultData(db);
    }
  } catch (err) {
    console.warn("Table initialization error, falling back:", err);
    throw err;
  }
}

function seedDefaultData(db: SQLite.SQLiteDatabase) {
  const now = new Date().toISOString();
  const defaultUser: UserProfile = {
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
    syncHash: "RQ-HASH-INIT-001",
    lastUpdated: now,
  };

  const defaultMed: MedicalInformation = {
    medicalConditions: "Mild seasonal asthma",
    allergies: "Penicillin, Peanuts (Severe)",
    currentMedications: "Albuterol Inhaler (as needed), Antihistamine 10mg",
    disabilities: "None (Full Mobility)",
    pregnancyStatus: "Not Applicable",
    updatedAt: now,
  };

  const defaultContacts: EmergencyContact[] = [
    { id: "c1", name: "Dr. Elena Mercer", relationship: "Spouse (Physician)", phoneNumber: "+1 (555) 440-8819", priorityOrder: 1 },
    { id: "c2", name: "Marcus Vance", relationship: "Brother / SAR Unit", phoneNumber: "+1 (555) 712-4402", priorityOrder: 2 },
    { id: "c3", name: "St. Jude Emergency Desk", relationship: "Primary Healthcare Provider", phoneNumber: "+1 (555) 911-0022", priorityOrder: 3 },
  ];

  db.runSync(
    `INSERT INTO user_profile VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      defaultUser.id,
      DataVaultCipher.encryptPayload(defaultUser.fullName),
      defaultUser.age,
      defaultUser.gender,
      defaultUser.dateOfBirth,
      defaultUser.bloodGroup,
      defaultUser.height,
      defaultUser.weight,
      defaultUser.photographUrl,
      DataVaultCipher.encryptPayload(defaultUser.phoneNumber),
      defaultUser.email,
      defaultUser.languagesSpoken,
      JSON.stringify(defaultUser.responderSkills),
      defaultUser.consentToShareMedical ? 1 : 0,
      defaultUser.organDonor ? 1 : 0,
      defaultUser.syncHash,
      defaultUser.lastUpdated,
    ]
  );

  db.runSync(
    `INSERT INTO medical_information VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      "med_active_001",
      DataVaultCipher.encryptPayload(defaultMed.medicalConditions),
      DataVaultCipher.encryptPayload(defaultMed.allergies),
      DataVaultCipher.encryptPayload(defaultMed.currentMedications),
      DataVaultCipher.encryptPayload(defaultMed.disabilities),
      defaultMed.pregnancyStatus || "Not Applicable",
      defaultMed.updatedAt,
    ]
  );

  for (const c of defaultContacts) {
    db.runSync(
      `INSERT INTO emergency_contacts VALUES (?, ?, ?, ?, ?);`,
      [c.id, DataVaultCipher.encryptPayload(c.name), c.relationship, DataVaultCipher.encryptPayload(c.phoneNumber), c.priorityOrder]
    );
  }

  db.runSync(`INSERT INTO application_settings VALUES ('mesh_mode', 'bluetooth_wifi_direct', 'Decentralized wireless relaying');`);
  db.runSync(`INSERT INTO application_settings VALUES ('auto_sos', 'enabled', 'Trigger broadcast when ECS >= 85');`);
}

export const DatabaseAdapter: DatabaseAdapterContract = {
  getEmergencyProfile: async (): Promise<CompleteEmergencyProfile> => {
    try {
      const db = getDb();
      if (!db) return await FallbackAdapter.getEmergencyProfile();

      const userRows = db.getAllSync<any>("SELECT * FROM user_profile LIMIT 1");
      const medRows = db.getAllSync<any>("SELECT * FROM medical_information LIMIT 1");
      const contactRows = db.getAllSync<any>("SELECT * FROM emergency_contacts ORDER BY priority_order ASC");
      const settingRows = db.getAllSync<any>("SELECT * FROM application_settings");

      const u = userRows[0] || {};
      const m = medRows[0] || {};

      const personal: UserProfile = {
        id: u.id || "usr_active_001",
        fullName: DataVaultCipher.decryptPayload(u.full_name || "Anonymous User"),
        age: u.age || "25",
        gender: u.gender || "Not specified",
        dateOfBirth: u.date_of_birth || "1999-01-01",
        bloodGroup: (u.blood_group || "Unknown") as any,
        height: u.height || "170 cm",
        weight: u.weight || "70 kg",
        photographUrl: u.photograph_url || "placeholder_avatar_blue.png",
        phoneNumber: DataVaultCipher.decryptPayload(u.phone_number || "+10000000000"),
        email: u.email || "user@resqnet.org",
        languagesSpoken: u.languages_spoken || "English",
        responderSkills: u.responder_skills ? JSON.parse(u.responder_skills) : ["First Aid"],
        consentToShareMedical: u.consent_to_share === 1,
        organDonor: u.organ_donor === 1,
        syncHash: u.sync_hash || "RQ-HASH-INIT",
        lastUpdated: u.last_updated || new Date().toISOString(),
      };

      const medical: MedicalInformation = {
        medicalConditions: DataVaultCipher.decryptPayload(m.medical_conditions || "None recorded"),
        allergies: DataVaultCipher.decryptPayload(m.allergies || "None known"),
        currentMedications: DataVaultCipher.decryptPayload(m.current_medications || "None"),
        disabilities: DataVaultCipher.decryptPayload(m.disabilities || "None"),
        pregnancyStatus: m.pregnancy_status || "Not Applicable",
        updatedAt: m.updated_at || new Date().toISOString(),
      };

      const contacts: EmergencyContact[] = contactRows.map((c: any) => ({
        id: c.id,
        name: DataVaultCipher.decryptPayload(c.name),
        relationship: c.relationship,
        phoneNumber: DataVaultCipher.decryptPayload(c.phone_number),
        priorityOrder: c.priority_order,
      }));

      const settings: Record<string, string> = {};
      settingRows.forEach((s: any) => {
        settings[s.key] = s.value;
      });

      return { personal, medical, contacts, settings };
    } catch (err) {
      console.warn("Database reading error, returning graceful fallback data:", err);
      return await FallbackAdapter.getEmergencyProfile();
    }
  },

  saveUserProfile: async (profile: UserProfile): Promise<boolean> => {
    try {
      const db = getDb();
      if (!db) return await FallbackAdapter.saveUserProfile(profile);

      const now = new Date().toISOString();
      const syncHash = DataVaultCipher.computeSyncHash(profile);
      
      db.runSync(
        `UPDATE user_profile SET full_name=?, age=?, gender=?, date_of_birth=?, blood_group=?, height=?, weight=?, photograph_url=?, phone_number=?, email=?, languages_spoken=?, responder_skills=?, consent_to_share=?, organ_donor=?, sync_hash=?, last_updated=? WHERE id=?`,
        [
          DataVaultCipher.encryptPayload(profile.fullName),
          profile.age,
          profile.gender,
          profile.dateOfBirth,
          profile.bloodGroup,
          profile.height,
          profile.weight,
          profile.photographUrl,
          DataVaultCipher.encryptPayload(profile.phoneNumber),
          profile.email,
          profile.languagesSpoken,
          JSON.stringify(profile.responderSkills || []),
          profile.consentToShareMedical ? 1 : 0,
          profile.organDonor ? 1 : 0,
          syncHash,
          now,
          profile.id || "usr_active_001",
        ]
      );
      return true;
    } catch (err) {
      return await FallbackAdapter.saveUserProfile(profile);
    }
  },

  saveMedicalInformation: async (med: MedicalInformation): Promise<boolean> => {
    try {
      const db = getDb();
      if (!db) return await FallbackAdapter.saveMedicalInformation(med);

      const now = new Date().toISOString();
      db.runSync(
        `UPDATE medical_information SET medical_conditions=?, allergies=?, current_medications=?, disabilities=?, pregnancy_status=?, updated_at=? WHERE id=?`,
        [
          DataVaultCipher.encryptPayload(med.medicalConditions),
          DataVaultCipher.encryptPayload(med.allergies),
          DataVaultCipher.encryptPayload(med.currentMedications),
          DataVaultCipher.encryptPayload(med.disabilities),
          med.pregnancyStatus || "Not Applicable",
          now,
          "med_active_001",
        ]
      );
      return true;
    } catch (err) {
      return await FallbackAdapter.saveMedicalInformation(med);
    }
  },

  saveEmergencyContacts: async (contacts: EmergencyContact[]): Promise<boolean> => {
    try {
      const db = getDb();
      if (!db) return await FallbackAdapter.saveEmergencyContacts(contacts);

      db.execSync("DELETE FROM emergency_contacts;");
      for (let i = 0; i < contacts.length; i++) {
        const c = contacts[i];
        db.runSync(
          `INSERT INTO emergency_contacts VALUES (?, ?, ?, ?, ?);`,
          [
            c.id || `c_${i + 1}`,
            DataVaultCipher.encryptPayload(c.name),
            c.relationship,
            DataVaultCipher.encryptPayload(c.phoneNumber),
            i + 1,
          ]
        );
      }
      return true;
    } catch (err) {
      return await FallbackAdapter.saveEmergencyContacts(contacts);
    }
  },

  saveAppSetting: async (key: string, value: string): Promise<boolean> => {
    try {
      const db = getDb();
      if (!db) return await FallbackAdapter.saveAppSetting(key, value);
      db.runSync(`INSERT OR REPLACE INTO application_settings (key, value) VALUES (?, ?);`, [key, value]);
      return true;
    } catch (err) {
      return await FallbackAdapter.saveAppSetting(key, value);
    }
  },
};
