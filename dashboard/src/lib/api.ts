import { IncidentReport, ResponderUnit, GatewayNode, FacilityMarker, AnalyticsSummary } from "@/types";

const API_BASE_URL = "http://localhost:8000/api/v1";

// ============================================================================
// REALISTIC EMERGENCY TEST DATA & FALLBACK REPOSITORY
// ============================================================================
let mockIncidents: IncidentReport[] = [
  {
    incident_id: "INC-99A8B201",
    packet_id: "RQ-PKT-2026-F981",
    user_id: "usr_active_001",
    emergency_type: "Building Collapse & Entrapment",
    severity: "CRITICAL",
    emergency_confidence_score: 96,
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 12.0,
    status: "OPEN",
    created_at: new Date(Date.now() - 360000).toISOString(),
    assigned_responder_id: "RESP-MED-01",
    meshRoute: ["NODE-ORIGIN", "NODE-RELAY-104", "GW-MOBILE-V3"],
    gatewayId: "GW-MOBILE-V3",
    ackId: "RQ-ACK-88F932",
    medicalVault: {
      userId: "usr_active_001",
      fullName: "Alex Mercer",
      email: "alex.mercer@resqnet.org",
      phoneNumber: "+1-555-0101",
      bloodGroup: "O+",
      age: "29",
      medicalConditions: "Asthma | Type 1 Diabetes",
      allergies: "Penicillin, Peanuts",
      emergencyContacts: [
        { name: "Sarah Mercer", phoneNumber: "+1-555-0102", relationship: "Sister", priorityOrder: 1 },
        { name: "Dr. Jonathan Vance", phoneNumber: "+1-555-0103", relationship: "Physician", priorityOrder: 2 },
      ]
    },
    timeline: [
      { timeline_id: "TML-01", timestamp: new Date(Date.now() - 360000).toISOString(), event_type: "INCIDENT_INGESTED", summary: "High-G sudden deceleration impact detected accompanied by persistent stationary immobility in severe hazard sector.", ecs_snapshot: 96 },
      { timeline_id: "TML-02", timestamp: new Date(Date.now() - 340000).toISOString(), event_type: "PACKET_RELAYED", summary: "Relayed over Bluetooth Low Energy mesh via node #104 to Mobile Gateway V3.", ecs_snapshot: 96 },
      { timeline_id: "TML-03", timestamp: new Date(Date.now() - 320000).toISOString(), event_type: "DISPATCH_ASSIGNMENT", summary: "Paramedic Unit Ambulance Alpha (MED-01) assigned by command operations.", ecs_snapshot: 96 }
    ]
  },
  {
    incident_id: "INC-44C1E309",
    packet_id: "RQ-PKT-2026-B321",
    user_id: "usr_civilian_882",
    emergency_type: "High-Speed Vehicular Crash",
    severity: "HIGH",
    emergency_confidence_score: 82,
    latitude: 37.7833,
    longitude: -122.4167,
    status: "DISPATCHED",
    created_at: new Date(Date.now() - 1200000).toISOString(),
    assigned_responder_id: "RESP-FIRE-02",
    meshRoute: ["NODE-VEHICLE", "GW-STAT-TOWER1"],
    gatewayId: "GW-STAT-TOWER1",
    ackId: "RQ-ACK-44C211",
    timeline: [
      { timeline_id: "TML-10", timestamp: new Date(Date.now() - 1200000).toISOString(), event_type: "INCIDENT_INGESTED", summary: "Vehicular speed deceleration spike (>35m/s to zero) detected by Phase 2A Intelligence Engine.", ecs_snapshot: 82 }
    ]
  },
  {
    incident_id: "INC-21D7A492",
    packet_id: "RQ-PKT-2026-A110",
    user_id: "usr_civilian_993",
    emergency_type: "Electrical Hazard & Flooding",
    severity: "MODERATE",
    emergency_confidence_score: 55,
    latitude: 37.7650,
    longitude: -122.4280,
    status: "OPEN",
    created_at: new Date(Date.now() - 2500000).toISOString(),
  }
];

let mockResponders: ResponderUnit[] = [
  { unit_id: "RESP-MED-01", callsign: "AMBULANCE ALPHA", name: "Paramedic Squad #1", unit_type: "AMBULANCE", specialization: "Advanced Trauma & Critical Triage", current_latitude: 37.7760, current_longitude: -122.4180, status: "DISPATCHED", assigned_incident_id: "INC-99A8B201", battery_level: 94, last_updated: new Date().toISOString() },
  { unit_id: "RESP-FIRE-02", callsign: "FIRE TRUCK BETA", name: "Heavy Rescue Squad #4", unit_type: "FIRE_TRUCK", specialization: "Extrication & Urban Search", current_latitude: 37.7810, current_longitude: -122.4140, status: "DISPATCHED", assigned_incident_id: "INC-44C1E309", battery_level: 88, last_updated: new Date().toISOString() },
  { unit_id: "RESP-AIR-03", callsign: "HELO GAMMA", name: "Medevac Air Unit #2", unit_type: "HELICOPTER", specialization: "Aerial Evac & Infrared Recon", current_latitude: 37.7900, current_longitude: -122.4050, status: "AVAILABLE", battery_level: 100, last_updated: new Date().toISOString() },
  { unit_id: "RESP-HAZ-04", callsign: "HAZMAT DELTA", name: "Chemical & Decontamination Unit", unit_type: "HAZMAT_SQUAD", specialization: "Hazardous Materials Containment", current_latitude: 37.7590, current_longitude: -122.4320, status: "AVAILABLE", battery_level: 85, last_updated: new Date().toISOString() }
];

let mockGateways: GatewayNode[] = [
  { gateway_id: "GW-MOBILE-V3", node_name: "Mobile Mesh Relay Alpha #104", location_name: "Downtown Mission District Sector", latitude: 37.7755, longitude: -122.4185, status: "ONLINE", internet_available: true, packet_relay_count: 1420, latency_ms: 24, battery_percentage: 92, signal_quality_dbm: -48, last_heartbeat: new Date().toISOString() },
  { gateway_id: "GW-STAT-TOWER1", node_name: "Fixed Command Relay Node #01", location_name: "City Hall Rooftop Tower", latitude: 37.7793, longitude: -122.4192, status: "ONLINE", internet_available: true, packet_relay_count: 8540, latency_ms: 12, battery_percentage: 100, signal_quality_dbm: -38, last_heartbeat: new Date().toISOString() },
  { gateway_id: "GW-EDGE-SAT04", node_name: "Remote LEO Satellite Uplink Post", location_name: "Twin Peaks High Ground Bunker", latitude: 37.7535, longitude: -122.4477, status: "DEGRADED", internet_available: true, packet_relay_count: 310, latency_ms: 480, battery_percentage: 64, signal_quality_dbm: -78, last_heartbeat: new Date().toISOString() }
];

let mockFacilities: FacilityMarker[] = [
  { id: "FAC-HOSP-01", name: "San Francisco General Emergency Hospital", type: "HOSPITAL", latitude: 37.7558, longitude: -122.4065, capacity: 250, current_occupancy: 184, status: "OPERATIONAL" },
  { id: "FAC-HOSP-02", name: "Saint Francis Trauma & Triage Pavilion", type: "HOSPITAL", latitude: 37.7895, longitude: -122.4148, capacity: 150, current_occupancy: 142, status: "NEAR_CAPACITY" },
  { id: "FAC-SHELTER-01", name: "Civic Center Civilian Emergency Shelter", type: "SHELTER", latitude: 37.7785, longitude: -122.4160, capacity: 800, current_occupancy: 410, status: "OPERATIONAL" },
  { id: "FAC-DEPOT-01", name: "ResQNet Central Disaster Supply & Medical Depot", type: "SUPPLY_DEPOT", latitude: 37.7700, longitude: -122.4120, capacity: 5000, current_occupancy: 3200, status: "OPERATIONAL" }
];

let mockAnalytics: AnalyticsSummary = {
  dailyIncidents: [
    { date: "Day - 6", count: 12, critical: 3 },
    { date: "Day - 5", count: 18, critical: 4 },
    { date: "Day - 4", count: 15, critical: 2 },
    { date: "Day - 3", count: 24, critical: 8 },
    { date: "Day - 2", count: 32, critical: 11 },
    { date: "Yesterday", count: 45, critical: 16 },
    { date: "Today (Live)", count: 68, critical: 22 },
  ],
  categoryBreakdown: [
    { category: "Medical Fall & Trauma", count: 28, percentage: 41 },
    { category: "Vehicular Collisions", count: 19, percentage: 28 },
    { category: "Structural Collaps & Floods", count: 14, percentage: 21 },
    { category: "Electrical & Fire Hazards", count: 7, percentage: 10 }
  ],
  communicationThroughput: [
    { method: "Internet REST (FastAPI)", count: 4210, successRate: 99.4 },
    { method: "Bluetooth Mesh Relays", count: 3180, successRate: 96.8 },
    { method: "Wi-Fi Direct P2P Sync", count: 1420, successRate: 98.2 },
    { method: "LEO Satellite Uplinks", count: 540, successRate: 92.5 }
  ],
  avgResponseTimeHistory: [
    { time: "00:00", minutes: 8.5 },
    { time: "04:00", minutes: 7.2 },
    { time: "08:00", minutes: 5.8 },
    { time: "12:00", minutes: 4.6 },
    { time: "16:00 (Now)", minutes: 3.9 }
  ],
  totalPacketsProcessed: 9350,
  overallDeliverySuccessRate: 98.2
};

// ============================================================================
// API CLIENT ENGINE
// ============================================================================
export const ApiService = {
  getIncidents: async (): Promise<IncidentReport[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/incidents/`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        // Merge fetched backend data with our simulation vault
        return data.length > 0 ? data : [...mockIncidents];
      }
    } catch (e) {
      console.warn("FastAPI backend connection offline. Rendering standalone simulation data vault.");
    }
    return [...mockIncidents];
  },

  getIncidentDetail: async (id: string): Promise<IncidentReport | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/incidents/${id}`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch (e) {}
    return mockIncidents.find((i) => i.incident_id === id) || null;
  },

  getResponders: async (): Promise<ResponderUnit[]> => {
    return [...mockResponders];
  },

  getGateways: async (): Promise<GatewayNode[]> => {
    return [...mockGateways];
  },

  getFacilities: async (): Promise<FacilityMarker[]> => {
    return [...mockFacilities];
  },

  getAnalytics: async (): Promise<AnalyticsSummary> => {
    return { ...mockAnalytics };
  },

  updateIncidentStatus: async (id: string, status: IncidentReport["status"], responderId?: string): Promise<boolean> => {
    const idx = mockIncidents.findIndex((i) => i.incident_id === id);
    if (idx >= 0) {
      mockIncidents[idx].status = status;
      if (responderId) mockIncidents[idx].assigned_responder_id = responderId;
      mockIncidents[idx].updated_at = new Date().toISOString();
      if (!mockIncidents[idx].timeline) mockIncidents[idx].timeline = [];
      mockIncidents[idx].timeline?.unshift({
        timeline_id: `TML-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event_type: "STATUS_UPDATED",
        summary: `Command operations changed incident status to ${status}.${responderId ? ` Assigned Unit: ${responderId}` : ""}`
      });
      return true;
    }
    return false;
  }
};
