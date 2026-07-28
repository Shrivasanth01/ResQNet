import sqlite3
import os

db_path = os.path.join("mobile", "src", "storage", "resqnet_local.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS person_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    bloodType TEXT,
    emergencyContact TEXT,
    createdAt TEXT NOT NULL
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

cursor.execute('''
INSERT OR REPLACE INTO person_details (id, name, email, phone, bloodType, emergencyContact, createdAt)
VALUES (1, 'GhostMesh User', 'user@ghostmesh.org', '+1-555-0192', 'O+', '+1-555-0199', '2026-07-28T11:50:00.000Z');
''')

cursor.execute('''
INSERT INTO location_history (latitude, longitude, accuracy, timestamp)
VALUES (12.9716, 77.5946, 5.0, '05:20:00 PM');
''')

conn.commit()
conn.close()
print(f"Successfully created SQLite database at: {db_path}")
