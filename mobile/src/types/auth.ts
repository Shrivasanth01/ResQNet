export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  age?: string;
  gender?: string;
  height?: string;
  weight?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  allergies?: string;
  currentMedications?: string;
  disabilities?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
