export type UserRole = "Administrator" | "Dispatcher" | "Responder" | "Viewer";

export interface UserSession {
  token: string;
  userId: string;
  name: string;
  role: UserRole;
  callsign?: string;
  station: string;
}

export interface TimelineItem {
  timeline_id: string;
  timestamp: string;
  event_type: string;
  summary: string;
  ecs_snapshot?: number;
}

export interface EmergencyContact {
  name: string;
  phoneNumber: string;
  relationship: string;
  priorityOrder: number;
}

export interface UserMedicalVault {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  bloodGroup: string;
  age: string;
  medicalConditions: string;
  allergies: string;
  emergencyContacts: EmergencyContact[];
}

export interface IncidentReport {
  incident_id: string;
  packet_id: string;
  user_id?: string;
  emergency_type: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "INFO";
  emergency_confidence_score: number; // 0 to 100
  latitude: number;
  longitude: number;
  altitude?: number;
  status: "OPEN" | "DISPATCHED" | "RESOLVED" | "FALSE_ALARM";
  created_at: string;
  updated_at?: string;
  assigned_responder_id?: string;
  timeline?: TimelineItem[];
  medicalVault?: UserMedicalVault;
  meshRoute?: string[];
  gatewayId?: string;
  ackId?: string;
}

export interface ResponderUnit {
  unit_id: string;
  callsign: string;
  name: string;
  unit_type: "AMBULANCE" | "FIRE_TRUCK" | "HELICOPTER" | "COMMAND_POST" | "HAZMAT_SQUAD";
  specialization: string;
  current_latitude: number;
  current_longitude: number;
  status: "AVAILABLE" | "DISPATCHED" | "OUT_OF_SERVICE" | "EN_ROUTE";
  assigned_incident_id?: string;
  battery_level: number;
  last_updated: string;
}

export interface GatewayNode {
  gateway_id: string;
  node_name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  internet_available: boolean;
  packet_relay_count: number;
  latency_ms: number;
  battery_percentage: number;
  signal_quality_dbm: number;
  last_heartbeat: string;
}

export interface FacilityMarker {
  id: string;
  name: string;
  type: "HOSPITAL" | "SHELTER" | "SUPPLY_DEPOT";
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  status: "OPERATIONAL" | "NEAR_CAPACITY" | "FULL";
}

export interface AnalyticsSummary {
  dailyIncidents: Array<{ date: string; count: number; critical: number }>;
  categoryBreakdown: Array<{ category: string; count: number; percentage: number }>;
  communicationThroughput: Array<{ method: string; count: number; successRate: number }>;
  avgResponseTimeHistory: Array<{ time: string; minutes: number }>;
  totalPacketsProcessed: number;
  overallDeliverySuccessRate: number;
}
