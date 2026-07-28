import sqlite3
import os
import json

db_path = os.path.join("mobile", "src", "storage", "resqnet_local.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('''
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
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS medical_vault (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicalConditions TEXT,
    allergies TEXT,
    currentMedications TEXT,
    disabilities TEXT,
    pregnancyStatus TEXT,
    updatedAt TEXT
);
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    relationship TEXT,
    phoneNumber TEXT,
    priorityOrder INTEGER
);
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS location_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    timestamp TEXT NOT NULL
);
''')

skills_json = json.dumps(["CPR Certified", "First Aid", "Volunteer Responder"])
cursor.execute('''
INSERT OR REPLACE INTO person_details (
    id, fullName, age, gender, dateOfBirth, bloodGroup, height, weight,
    phoneNumber, email, languagesSpoken, responderSkills, consentToShareMedical,
    organDonor, syncHash, lastUpdated
) VALUES (
    'usr_active_001', 'Alex Mercer', '29', 'Other', '1997-04-12', 'O+',
    '178 cm', '74 kg', '+1 (555) 382-9102', 'alex.mercer@resqnet.org',
    'English, Spanish', ?, 1, 1, 'RQ-HASH-INIT-SQL', '2026-07-28T12:00:00.000Z'
);
''', (skills_json,))

cursor.execute('''
INSERT OR REPLACE INTO medical_vault (id, medicalConditions, allergies, currentMedications, disabilities, pregnancyStatus, updatedAt)
VALUES (1, 'Mild seasonal asthma', 'Penicillin, Peanuts (Severe)', 'Albuterol Inhaler (as needed), Antihistamine 10mg', 'None (Full Mobility)', 'Not Applicable', '2026-07-28T12:00:00.000Z');
''')

cursor.execute('''
INSERT OR REPLACE INTO emergency_contacts (id, name, relationship, phoneNumber, priorityOrder)
VALUES ('c1', 'Dr. Elena Mercer', 'Spouse (Physician)', '+1 (555) 440-8819', 1);
''')
cursor.execute('''
INSERT OR REPLACE INTO emergency_contacts (id, name, relationship, phoneNumber, priorityOrder)
VALUES ('c2', 'Marcus Vance', 'Brother / SAR Unit', '+1 (555) 712-4402', 2);
''')
cursor.execute('''
INSERT OR REPLACE INTO emergency_contacts (id, name, relationship, phoneNumber, priorityOrder)
VALUES ('c3', 'St. Jude Emergency Desk', 'Primary Healthcare Provider', '+1 (555) 911-0022', 3);
''')

cursor.execute('''
INSERT INTO location_history (latitude, longitude, accuracy, timestamp)
VALUES (12.9716, 77.5946, 5.0, '05:20:00 PM');
''')

conn.commit()
conn.close()
print(f"Successfully created Alex Mercer SQLite database at: {db_path}")
