import * as webDb from './database.web';

export type LocationRecord = webDb.LocationRecord;

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
export const DEFAULT_ALEX_MERCER_PROFILE = activeDb.DEFAULT_ALEX_MERCER_PROFILE;
