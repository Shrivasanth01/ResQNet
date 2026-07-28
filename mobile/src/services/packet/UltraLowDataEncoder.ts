import { CompleteEmergencyProfile } from "../../types/profile";

export interface CompactMeshPacket {
  v: number;           // Protocol Version (1)
  id: string;          // User ID
  n: string;           // Name
  bg: string;          // Blood Group
  a?: string;          // Age
  g?: string;          // Gender
  p: string;           // Phone
  em: string;          // Email
  h?: string;          // Height
  w?: string;          // Weight
  med?: string;        // Medical Conditions & Allergies
  ec?: Array<{ n: string; p: string; r: string }>; // Emergency Contacts
  loc?: [number, number]; // [Latitude, Longitude]
  ts: string;          // Timestamp ISO
  hash: string;        // Sync Hash
}

export const UltraLowDataEncoder = {
  /**
   * Encodes a full emergency profile into a minimal ~260-byte JSON structure
   */
  encode: (profile: CompleteEmergencyProfile, location?: { latitude: number; longitude: number }): CompactMeshPacket => {
    const p = profile.personal;
    const m = profile.medical;
    const c = profile.contacts || [];

    return {
      v: 1,
      id: p.id || "usr_001",
      n: p.fullName,
      bg: p.bloodGroup || "O+",
      a: p.age,
      g: p.gender,
      p: p.phoneNumber,
      em: p.email,
      h: p.height,
      w: p.weight,
      med: [m.medicalConditions, m.allergies].filter(Boolean).join(" | "),
      ec: c.map((ct) => ({ n: ct.name, p: ct.phoneNumber, r: ct.relationship })),
      loc: location ? [Number(location.latitude.toFixed(4)), Number(location.longitude.toFixed(4))] : undefined,
      ts: new Date().toISOString().substring(0, 19),
      hash: p.syncHash || "RQ-MIN-001",
    };
  },

  /**
   * Returns formatted JSON string and exact size in bytes
   */
  toMinifiedJson: (profile: CompleteEmergencyProfile, location?: { latitude: number; longitude: number }): { json: string; bytes: number } => {
    const compact = UltraLowDataEncoder.encode(profile, location);
    const json = JSON.stringify(compact);
    const bytes = new Blob([json]).size || json.length;
    return { json, bytes };
  },

  /**
   * Converts compact payload into URL-safe Base64 string for BLE/NFC/SMS
   */
  toBase64: (profile: CompleteEmergencyProfile, location?: { latitude: number; longitude: number }): string => {
    const { json } = UltraLowDataEncoder.toMinifiedJson(profile, location);
    if (typeof btoa === "function") {
      return btoa(encodeURIComponent(json));
    }
    return Buffer.from(json, "utf8").toString("base64");
  }
};
