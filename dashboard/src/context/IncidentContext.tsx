"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { IncidentReport, ResponderUnit, GatewayNode, FacilityMarker, AnalyticsSummary } from "@/types";
import { ApiService } from "@/lib/api";

interface IncidentContextType {
  incidents: IncidentReport[];
  responders: ResponderUnit[];
  gateways: GatewayNode[];
  facilities: FacilityMarker[];
  analytics: AnalyticsSummary | null;
  isConnected: boolean;
  activeAlertsCount: number;
  criticalCount: number;
  refreshData: () => Promise<void>;
  updateIncidentStatus: (id: string, status: IncidentReport["status"], responderId?: string) => Promise<boolean>;
  simulateNewIncomingIncident: (custom?: Partial<IncidentReport>) => void;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [responders, setResponders] = useState<ResponderUnit[]>([]);
  const [gateways, setGateways] = useState<GatewayNode[]>([]);
  const [facilities, setFacilities] = useState<FacilityMarker[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);

  const refreshData = useCallback(async () => {
    const [incData, respData, gwData, facData, anlData] = await Promise.all([
      ApiService.getIncidents(),
      ApiService.getResponders(),
      ApiService.getGateways(),
      ApiService.getFacilities(),
      ApiService.getAnalytics(),
    ]);
    setIncidents([...incData]);
    setResponders([...respData]);
    setGateways([...gwData]);
    setFacilities([...facData]);
    setAnalytics({ ...anlData });
  }, []);

  useEffect(() => {
    refreshData();
    // Attempt real-time WebSocket connection to Phase 3 FastAPI server
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket("ws://localhost:8000/api/v1/ws/incidents");
        
        ws.onopen = () => {
          setIsConnected(true);
          console.log("WebSocket connected to ResQNet Cloud Streaming Hub.");
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.event === "NEW_EMERGENCY_INCIDENT") {
              const newInc = payload.data;
              setIncidents((prev) => [
                {
                  incident_id: newInc.incident_id,
                  packet_id: newInc.packet_id,
                  user_id: newInc.user_id,
                  emergency_type: newInc.emergency_type,
                  severity: newInc.severity,
                  emergency_confidence_score: newInc.emergency_confidence_score,
                  latitude: newInc.latitude,
                  longitude: newInc.longitude,
                  altitude: newInc.altitude || 0.0,
                  status: newInc.status || "OPEN",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  assigned_responder_id: newInc.assigned_responder_id,
                  meshRoute: newInc.meshRoute || [],
                  gatewayId: newInc.gatewayId,
                  ackId: newInc.ackId,
                  medicalVault: newInc.medicalVault,
                  timeline: [{ timeline_id: `TML-${Date.now()}`, timestamp: new Date().toISOString(), event_type: "WEBSOCKET_ALERT", summary: "Real-time stream incoming from field gateway.", ecs_snapshot: newInc.emergency_confidence_score }]
                },
                ...prev,
              ]);
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Auto reconnect after 5 seconds in operational environments
          setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        socketRef.current = ws;
      } catch (e) {
        setIsConnected(false);
      }
    };

    connectWebSocket();
    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [refreshData]);

  const updateIncidentStatus = async (id: string, status: IncidentReport["status"], responderId?: string): Promise<boolean> => {
    const success = await ApiService.updateIncidentStatus(id, status, responderId);
    if (success) {
      setIncidents((prev) =>
        prev.map((item) =>
          item.incident_id === id
            ? {
                ...item,
                status,
                assigned_responder_id: responderId || item.assigned_responder_id,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
    }
    return success;
  };

  /**
   * Interactive test harness allowing operators to simulate real-time packet intake during evaluations
   */
  const simulateNewIncomingIncident = (custom?: Partial<IncidentReport>) => {
    const newId = `INC-${Math.floor(Math.random() * 899999 + 100000).toString(16).toUpperCase()}`;
    const synthetic: IncidentReport = {
      incident_id: newId,
      packet_id: `RQ-PKT-LIVE-${Math.floor(Math.random() * 900 + 100)}`,
      user_id: "usr_active_001",
      emergency_type: custom?.emergency_type || "Multi-Sensor Impact (Automated SOS)",
      severity: custom?.severity || "CRITICAL",
      emergency_confidence_score: custom?.emergency_confidence_score || 94,
      latitude: custom?.latitude || 37.7749 + (Math.random() * 0.04 - 0.02),
      longitude: custom?.longitude || -122.4194 + (Math.random() * 0.04 - 0.02),
      status: "OPEN",
      created_at: new Date().toISOString(),
      gatewayId: "GW-MOBILE-V3",
      timeline: [
        { timeline_id: `TML-${Date.now()}`, timestamp: new Date().toISOString(), event_type: "INCIDENT_INGESTED", summary: "Automated distress packet received over Bluetooth Mesh gateway relay.", ecs_snapshot: 94 }
      ],
      ...custom,
    };
    setIncidents((prev) => [synthetic, ...prev]);
  };

  const activeAlertsCount = incidents.filter((i) => i.status === "OPEN" || i.status === "DISPATCHED").length;
  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL" && (i.status === "OPEN" || i.status === "DISPATCHED")).length;

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        responders,
        gateways,
        facilities,
        analytics,
        isConnected,
        activeAlertsCount,
        criticalCount,
        refreshData,
        updateIncidentStatus,
        simulateNewIncomingIncident,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncidents = (): IncidentContextType => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncidents must be used within an IncidentProvider");
  }
  return context;
};
