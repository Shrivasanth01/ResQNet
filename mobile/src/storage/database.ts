import { Platform } from 'react-native';
import * as nativeDb from './database.native';
import * as webDb from './database.web';

export type LocationRecord = nativeDb.LocationRecord;

const activeDb = Platform.OS === 'web' ? webDb : nativeDb;

export const initDatabase = activeDb.initDatabase;
export const saveCompleteProfile = activeDb.saveCompleteProfile;
export const getCompleteProfile = activeDb.getCompleteProfile;
export const getPersonDetails = activeDb.getPersonDetails;
export const savePersonDetails = activeDb.savePersonDetails;
export const saveLocationRecord = activeDb.saveLocationRecord;
export const getLocationHistory = activeDb.getLocationHistory;
export const DEFAULT_ALEX_MERCER_PROFILE = activeDb.DEFAULT_ALEX_MERCER_PROFILE;
