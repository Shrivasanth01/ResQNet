import { BloodGroup, EmergencyContact, UserProfile } from "../types/profile";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: "Phone number is required." };
  }
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.length < 7 || !/^\+?[0-9]+$/.test(cleaned)) {
    return { isValid: false, error: "Enter a valid phone number (at least 7 digits)." };
  }
  return { isValid: true };
}

export function validateBloodGroup(group: string): ValidationResult {
  const validGroups: BloodGroup[] = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Unknown"];
  if (!validGroups.includes(group as BloodGroup)) {
    return { isValid: false, error: "Select a valid blood group (e.g. O+, A-, AB+)." };
  }
  return { isValid: true };
}

export function validateAge(age: string | number): ValidationResult {
  const num = typeof age === "string" ? parseInt(age, 10) : age;
  if (isNaN(num) || num < 1 || num > 120) {
    return { isValid: false, error: "Enter a valid age between 1 and 120." };
  }
  return { isValid: true };
}

export function validateEmergencyContacts(contacts: EmergencyContact[]): ValidationResult {
  if (!contacts || contacts.length === 0) {
    return { isValid: false, error: "At least one emergency contact is required." };
  }
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    if (!c.name.trim()) {
      return { isValid: false, error: `Contact #${i + 1}: Name is required.` };
    }
    if (!c.relationship.trim()) {
      return { isValid: false, error: `Contact #${i + 1}: Relationship is required.` };
    }
    const phoneRes = validatePhone(c.phoneNumber);
    if (!phoneRes.isValid) {
      return { isValid: false, error: `Contact #${i + 1}: ${phoneRes.error}` };
    }
  }
  return { isValid: true };
}

export function validateRequiredFields(profile: Partial<UserProfile>): ValidationResult {
  if (!profile.fullName || !profile.fullName.trim()) {
    return { isValid: false, error: "Full Name is required." };
  }
  if (!profile.phoneNumber) {
    return { isValid: false, error: "Phone number is required." };
  }
  const phoneVal = validatePhone(profile.phoneNumber);
  if (!phoneVal.isValid) {
    return phoneVal;
  }
  if (profile.age) {
    const ageVal = validateAge(profile.age);
    if (!ageVal.isValid) return ageVal;
  }
  if (profile.bloodGroup && profile.bloodGroup !== "Unknown") {
    const bgVal = validateBloodGroup(profile.bloodGroup);
    if (!bgVal.isValid) return bgVal;
  }
  return { isValid: true };
}
