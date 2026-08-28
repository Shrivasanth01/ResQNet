import { IncidentReport, ResponderUnit, GatewayNode, FacilityMarker, AnalyticsSummary } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

// ============================================================================
// REALTIME & UNCONNECTED DEMO DATA STRUCTURES
// ============================================================================
export const DEMO_RESPONDERS: ResponderUnit[] = [
  { unit_id: "RESP-MED-01", callsign: "AMBULANCE ALPHA", name: "Paramedic Squad #1", unit_type: "AMBULANCE", specialization: "Advanced Trauma & Critical Triage", current_latitude: 37.7760, current_longitude: -122.4180, status: "DISPATCHED", assigned_incident_id: "INC-99A8B201", battery_level: 94, last_updated: new Date().toISOString() },
  { unit_id: "RESP-FIRE-02", callsign: "FIRE TRUCK BETA", name: "Heavy Rescue Squad #4", unit_type: "FIRE_TRUCK", specialization: "Extrication & Urban Search", current_latitude: 37.7810, current_longitude: -122.4140, status: "DISPATCHED", assigned_incident_id: "INC-44C1E309", battery_level: 88, last_updated: new Date().toISOString() },
  { unit_id: "RESP-AIR-03", callsign: "HELO GAMMA", name: "Medevac Air Unit #2", unit_type: "HELICOPTER", specialization: "Aerial Evac & Infrared Recon", current_latitude: 37.7900, current_longitude: -122.4050, status: "AVAILABLE", battery_level: 100, last_updated: new Date().toISOString() },
  { unit_id: "RESP-HAZ-04", callsign: "HAZMAT DELTA", name: "Chemical & Decontamination Unit", unit_type: "HAZMAT_SQUAD", specialization: "Hazardous Materials Containment", current_latitude: 37.7590, current_longitude: -122.4320, status: "AVAILABLE", battery_level: 85, last_updated: new Date().toISOString() }
];

export const DEMO_GATEWAYS: GatewayNode[] = [
  { gateway_id: "GW-MOBILE-V3", node_name: "Mobile Mesh Relay Alpha #104", location_name: "Downtown Mission District Sector", latitude: 37.7755, longitude: -122.4185, status: "ONLINE", internet_available: true, packet_relay_count: 1420, latency_ms: 24, battery_percentage: 92, signal_quality_dbm: -48, last_heartbeat: new Date().toISOString() },
  { gateway_id: "GW-STAT-TOWER1", node_name: "Fixed Command Relay Node #01", location_name: "City Hall Rooftop Tower", latitude: 37.7793, longitude: -122.4192, status: "ONLINE", internet_available: true, packet_relay_count: 8540, latency_ms: 12, battery_percentage: 100, signal_quality_dbm: -38, last_heartbeat: new Date().toISOString() }
];

export const DEMO_FACILITIES: FacilityMarker[] = [
  { id: "FAC-HOSP-01", name: "San Francisco General Emergency Hospital", type: "HOSPITAL", latitude: 37.7558, longitude: -122.4065, capacity: 250, current_occupancy: 184, status: "OPERATIONAL" },
  { id: "FAC-SHELTER-01", name: "Civic Center Civilian Emergency Shelter", type: "SHELTER", latitude: 37.7785, longitude: -122.4160, capacity: 800, current_occupancy: 410, status: "OPERATIONAL" }
];

export const DEMO_ANALYTICS: AnalyticsSummary = {
  dailyIncidents: [
    { date: "Yesterday", count: 45, critical: 16 },
    { date: "Today (Live)", count: 68, critical: 22 },
  ],
  categoryBreakdown: [
    { category: "Medical Fall & Trauma", count: 28, percentage: 41 },
    { category: "Vehicular Collisions", count: 19, percentage: 28 },
    { category: "Structural Collapse", count: 14, percentage: 21 },
  ],
  communicationThroughput: [
    { method: "Internet REST (FastAPI)", count: 4210, successRate: 99.4 },
    { method: "Bluetooth Mesh Relays", count: 3180, successRate: 96.8 },
  ],
  avgResponseTimeHistory: [
    { time: "16:00 (Now)", minutes: 3.9 }
  ],
  totalPacketsProcessed: 9350,
  overallDeliverySuccessRate: 98.2
};

// ============================================================================
// PRODUCTION REST API CLIENT
// ============================================================================
export const ApiService = {
  /**
   * Fetches real incidents directly from FastAPI backend database.
   * Throws error if backend is unreachable so UI displays "Backend Offline".
   */
  getIncidents: async (): Promise<IncidentReport[]> => {
    const res = await fetch(`${API_BASE_URL}/incidents/`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      throw new Error(`HTTP_${res.status}`);
    }
    return await res.json();
  },

  /**
   * Fetches full telemetry details for a specific incident from persistent database.
   */
  getIncidentDetail: async (id: string): Promise<IncidentReport | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/incidents/${id}`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn(`[ApiService] Error fetching incident detail for ${id}:`, e);
    }
    return null;
  },

  getResponders: async (): Promise<ResponderUnit[]> => {
    return [...DEMO_RESPONDERS];
  },

  getGateways: async (): Promise<GatewayNode[]> => {
    return [...DEMO_GATEWAYS];
  },

  getFacilities: async (): Promise<FacilityMarker[]> => {
    return [...DEMO_FACILITIES];
  },

  getAnalytics: async (): Promise<AnalyticsSummary> => {
    return { ...DEMO_ANALYTICS };
  },

  /**
   * Persists status updates and responder assignments directly to FastAPI database.
   */
  updateIncidentStatus: async (id: string, status: IncidentReport["status"], responderId?: string): Promise<boolean> => {
    try {
      const params = new URLSearchParams({ status });
      if (responderId) params.append("responder_id", responderId);

      const res = await fetch(`${API_BASE_URL}/incidents/${id}/status?${params.toString()}`, {
        method: "PATCH",
        signal: AbortSignal.timeout(4000),
      });

      return res.ok;
    } catch (e) {
      console.error(`[ApiService] Failed to update status for ${id}:`, e);
      return false;
    }
  }
};
