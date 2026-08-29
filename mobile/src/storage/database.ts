import * as webDb from './database.web';
import { UserProfile } from '../types/profile';

export type LocationRecord = webDb.LocationRecord;
export type PersonRecord = UserProfile;

let activeDb: any = webDb;
try {
  const isNative = typeof window === 'undefined' && typeof process !== 'undefined' && process.release?.name === 'node';
  if (!isNative) {
    const { Platform } = require('react-native');
    if (Platform.OS !== 'web') {
      activeDb = require('./database.native');
    }
  }
} catch {
  activeDb = webDb;
}

export const initDatabase = activeDb.initDatabase;
export const saveCompleteProfile = activeDb.saveCompleteProfile;
export const getCompleteProfile = activeDb.getCompleteProfile;
export const getPersonDetails = activeDb.getPersonDetails;
export const savePersonDetails = activeDb.savePersonDetails;
export const saveLocationRecord = activeDb.saveLocationRecord;
export const getLocationHistory = activeDb.getLocationHistory;
export const createNewUserProfile = activeDb.createNewUserProfile || webDb.createNewUserProfile;
export const DEFAULT_ALEX_MERCER_PROFILE = activeDb.DEFAULT_ALEX_MERCER_PROFILE || webDb.DEFAULT_ALEX_MERCER_PROFILE;

export const DatabaseService = {
  initDatabase: () => (activeDb.initDatabase ? activeDb.initDatabase() : Promise.resolve()),
  saveEmergencyProfile: (p: any) => (activeDb.saveCompleteProfile ? activeDb.saveCompleteProfile(p) : Promise.resolve()),
  getEmergencyProfile: () => (activeDb.getCompleteProfile ? activeDb.getCompleteProfile() : Promise.resolve(DEFAULT_ALEX_MERCER_PROFILE)),
  saveLocation: (loc: any) => (activeDb.saveLocationRecord ? activeDb.saveLocationRecord(loc) : Promise.resolve()),
  getLocationHistory: () => (activeDb.getLocationHistory ? activeDb.getLocationHistory() : Promise.resolve([])),
};

