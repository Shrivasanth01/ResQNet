import { Platform } from 'react-native';
import * as nativeDb from './database.native';
import * as webDb from './database.web';

export type PersonRecord = nativeDb.PersonRecord;
export type LocationRecord = nativeDb.LocationRecord;

const activeDb = Platform.OS === 'web' ? webDb : nativeDb;

export const initDatabase = activeDb.initDatabase;
export const savePersonDetails = activeDb.savePersonDetails;
export const getPersonDetails = activeDb.getPersonDetails;
export const saveLocationRecord = activeDb.saveLocationRecord;
export const getLocationHistory = activeDb.getLocationHistory;
