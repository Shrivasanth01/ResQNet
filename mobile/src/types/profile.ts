export type BloodGroup = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "Unknown";

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  priorityOrder: number; // 1, 2, or 3
}

export interface MedicalInformation {
  medicalConditions: string; // e.g., "Insulin-dependent Diabetes, Asthma"
  allergies: string; // e.g., "Penicillin, Peanuts"
  currentMedications: string; // e.g., "Metformin 500mg, Albuterol Inhaler"
  disabilities: string; // e.g., "None"
  pregnancyStatus?: string; // e.g., "Not Applicable" or "2nd Trimester"
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  // Personal
  fullName: string;
  age: string;
  gender: string;
  dateOfBirth: string; // YYYY-MM-DD or readable
  bloodGroup: BloodGroup;
  height: string; // e.g., "175 cm"
  weight: string; // e.g., "70 kg"
  photographUrl: string; // Placeholder string
  phoneNumber: string;
  email: string;
  
  // Additional & Responder Intelligence
  languagesSpoken: string; // e.g., "English, Spanish"
  responderSkills: string[]; // e.g., ["CPR Certified", "First Aid", "Volunteer"]
  consentToShareMedical: boolean;
  organDonor: boolean;

  // Synchronization Metadata
  syncHash: string;
  lastUpdated: string;
}

export interface CompleteEmergencyProfile {
  personal: UserProfile;
  medical: MedicalInformation;
  contacts: EmergencyContact[];
  settings: Record<string, string>;
}
