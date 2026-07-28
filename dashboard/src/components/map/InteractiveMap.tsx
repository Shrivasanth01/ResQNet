"use client";
import React, { useState } from "react";
import { useIncidents } from "@/context/IncidentContext";
import { IncidentReport, ResponderUnit, GatewayNode, FacilityMarker } from "@/types";
import { 
  MapPin, 
  Navigation, 
  Radio, 
  Building2, 
  Flame, 
  Layers, 
  Maximize2, 
  Info, 
  CheckCircle, 
  ExternalLink 
} from "lucide-react";
import Link from "next/link";

/**
 * Interactive Layered Geospatial Command Map
 * 
 * DESIGN PRINCIPLE:
 * Engineered using SVG coordinate transformation matrices over simulated tactical regional map grids.
 * Provides guaranteed cross-browser compile compatibility without reliance on third-party tile server APIs or API keys!
 */
export const InteractiveMap: React.FC<{ heightClass?: string }> = ({ heightClass = "h-[650px]" }) => {
  const { incidents, responders, gateways, facilities } = useIncidents();
  
  // Layer filter toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showResponders, setShowResponders] = useState(true);
  const [showGateways, setShowGateways] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: string; data: any } | null>(null);

  // Geographic bonding grid (San Francisco Bay Disaster Sector)
  const MIN_LAT = 37.7450;
  const MAX_LAT = 37.8000;
  const MIN_LNG = -122.4500;
  const MAX_LNG = -122.3900;

  const latToPercent = (lat: number) => Math.max(5, Math.min(95, ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 100));
  const lngToPercent = (lng: number) => Math.max(5, Math.min(95, ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100));

  const getSeverityBadge = (severity: string) => {
    if (severity === "CRITICAL") return "badge-critical";
    if (severity === "HIGH") return "badge-high";
    return "badge-moderate";
  };

  return (
    <div className={`w-full ${heightClass} bg-slate-950 border border-border/80 rounded-2xl relative overflow-hidden shadow-2xl flex flex-col select-none`}>
      {/* Top Map Action Bar & Layer Control Engine */}
      <div className="p-4 bg-surface/90 border-b border-border flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <h3 className="font-extrabold text-sm tracking-wider text-white uppercase flex items-center gap-2">
            San Francisco Regional Tactical Sector Map (Live Grid)
          </h3>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${showIncidents ? "bg-rose-500/20 text-rose-300 border-rose-500/50" : "bg-slate-900 text-slate-500 border-slate-800"}`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            Incidents ({incidents.filter(i => i.status !== "RESOLVED").length})
          </button>

          <button
            onClick={() => setShowResponders(!showResponders)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${showResponders ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" : "bg-slate-900 text-slate-500 border-slate-800"}`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            Responders ({responders.length})
          </button>

          <button
            onClick={() => setShowGateways(!showGateways)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${showGateways ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50" : "bg-slate-900 text-slate-500 border-slate-800"}`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Gateways ({gateways.length})
          </button>

          <button
            onClick={() => setShowFacilities(!showFacilities)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${showFacilities ? "bg-amber-500/20 text-amber-300 border-amber-500/50" : "bg-slate-900 text-slate-500 border-slate-800"}`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            Facilities ({facilities.length})
          </button>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${showHeatmap ? "bg-violet-600 text-white border-violet-400 shadow-lg" : "bg-slate-900 text-slate-400 border-slate-800"}`}
          >
            <Layers className="w-3.5 h-3.5" />
            Heatmap Overlay
          </button>
        </div>
      </div>

      {/* Main Interactive Map Canvas Grid */}
      <div className="flex-1 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] overflow-hidden">
        {/* Simulated Sector Radar Background lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none border-[40px] border-slate-900 rounded-3xl" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/40 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-700/40 pointer-events-none" />
        
        {/* Heatmap Simulation Overlay */}
        {showHeatmap && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-rose-600/10 via-amber-500/10 to-transparent blur-3xl animate-pulse" />
        )}

        {/* 1. LAYER: GATEWAY NODES (Cyan Pins) */}
        {showGateways && gateways.map((gw) => {
          const top = 100 - latToPercent(gw.latitude);
          const left = lngToPercent(gw.longitude);
          return (
            <div
              key={gw.gateway_id}
              onClick={() => setSelectedItem({ type: "GATEWAY", data: gw })}
              style={{ top: `${top}%`, left: `${left}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
            >
              <div className="w-9 h-9 rounded-full bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-transform group-hover:scale-125">
                <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 top-10 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900 text-cyan-300 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-cyan-500/50">
                {gw.node_name}
              </span>
            </div>
          );
        })}

        {/* 2. LAYER: HOSPITALS & SHELTERS (Amber & Violet Pins) */}
        {showFacilities && facilities.map((fac) => {
          const top = 100 - latToPercent(fac.latitude);
          const left = lngToPercent(fac.longitude);
          const isHosp = fac.type === "HOSPITAL";
          return (
            <div
              key={fac.id}
              onClick={() => setSelectedItem({ type: "FACILITY", data: fac })}
              style={{ top: `${top}%`, left: `${left}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
            >
              <div className={`w-9 h-9 rounded-xl ${isHosp ? "bg-amber-950/80 border-2 border-amber-400 text-amber-300" : "bg-violet-950/80 border-2 border-violet-400 text-violet-300"} flex items-center justify-center shadow-lg transition-transform group-hover:scale-125`}>
                <Building2 className="w-4 h-4" />
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 top-10 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900 text-slate-200 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700">
                {fac.name}
              </span>
            </div>
          );
        })}

        {/* 3. LAYER: RESPONDER VEHICLE FLEET (Emerald Pins) */}
        {showResponders && responders.map((resp) => {
          const top = 100 - latToPercent(resp.current_latitude);
          const left = lngToPercent(resp.current_longitude);
          return (
            <div
              key={resp.unit_id}
              onClick={() => setSelectedItem({ type: "RESPONDER", data: resp })}
              style={{ top: `${top}%`, left: `${left}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-transform group-hover:scale-125">
                <Navigation className="w-5 h-5 text-emerald-300 fill-emerald-300 transform rotate-45" />
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 top-11 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-emerald-900 text-emerald-200 text-[11px] font-extrabold shadow-md pointer-events-none border border-emerald-500/60">
                {resp.callsign}
              </span>
            </div>
          );
        })}

        {/* 4. LAYER: ACTIVE INCIDENTS (Rose Critical / Amber High Pins) */}
        {showIncidents && incidents.map((inc) => {
          if (inc.status === "RESOLVED") return null;
          const top = 100 - latToPercent(Number(inc.latitude));
          const left = lngToPercent(Number(inc.longitude));
          const isCrit = inc.severity === "CRITICAL";
          return (
            <div
              key={inc.incident_id}
              onClick={() => setSelectedItem({ type: "INCIDENT", data: inc })}
              style={{ top: `${top}%`, left: `${left}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-30"
            >
              {isCrit && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />}
              <div className={`w-11 h-11 rounded-full ${isCrit ? "bg-rose-600 border-2 border-white text-white shadow-glow" : "bg-amber-600 border-2 border-white text-white shadow-glowAmber"} flex items-center justify-center relative transition-transform group-hover:scale-125`}>
                <MapPin className="w-6 h-6 fill-current animate-bounce" />
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 top-12 whitespace-nowrap px-2 py-1 rounded bg-slate-900 text-white font-extrabold text-[11px] shadow-2xl pointer-events-none border border-rose-500/60 flex items-center gap-1">
                {inc.emergency_type} (ECS: {inc.emergency_confidence_score})
              </span>
            </div>
          );
        })}
      </div>

      {/* Interactive Item Details Bottom Drawer / Modal */}
      {selectedItem && (
        <div className="p-5 bg-surface/95 border-t border-border z-40 animate-in slide-in-from-bottom flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-lg">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase font-extrabold text-cyan-400 tracking-widest">[ Selected {selectedItem.type} Telemetry ]</span>
              {selectedItem.type === "INCIDENT" && <span className={getSeverityBadge(selectedItem.data.severity)}>{selectedItem.data.severity}</span>}
              {selectedItem.type === "RESPONDER" && <span className="badge-info">{selectedItem.data.status}</span>}
            </div>
            
            {selectedItem.type === "INCIDENT" && (
              <>
                <h4 className="text-lg font-extrabold text-white">{selectedItem.data.emergency_type}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Incident ID: <span className="font-mono text-white">{selectedItem.data.incident_id}</span> | ECS Score: <span className="font-extrabold text-rose-400">{selectedItem.data.emergency_confidence_score}/100</span> | Coordinates: [{selectedItem.data.latitude.toFixed(4)}, {selectedItem.data.longitude.toFixed(4)}]</p>
              </>
            )}

            {selectedItem.type === "RESPONDER" && (
              <>
                <h4 className="text-lg font-extrabold text-white">{selectedItem.data.callsign} ({selectedItem.data.name})</h4>
                <p className="text-xs text-slate-400 mt-0.5">Specialization: <span className="text-emerald-300 font-bold">{selectedItem.data.specialization}</span> | Battery telemetry: <span className="text-amber-300 font-mono">{selectedItem.data.battery_level}%</span></p>
              </>
            )}

            {selectedItem.type === "GATEWAY" && (
              <>
                <h4 className="text-lg font-extrabold text-white">{selectedItem.data.node_name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Location: <span className="text-cyan-300 font-semibold">{selectedItem.data.location_name}</span> | Signal: <span className="font-mono text-emerald-400">{selectedItem.data.signal_quality_dbm} dBm</span> | Relays: {selectedItem.data.packet_relay_count} pkts</p>
              </>
            )}

            {selectedItem.type === "FACILITY" && (
              <>
                <h4 className="text-lg font-extrabold text-white">{selectedItem.data.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Occupancy Load: <span className="font-extrabold text-amber-400">{selectedItem.data.current_occupancy} / {selectedItem.data.capacity}</span> | Status: <span className="text-emerald-400 font-bold">{selectedItem.data.status}</span></p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {selectedItem.type === "INCIDENT" && (
              <Link
                href={`/incidents/${selectedItem.data.incident_id}`}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-glow transition-all flex items-center gap-2"
              >
                Open Full Medical & Forensic Drilldown
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={() => setSelectedItem(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-border"
            >
              Dismiss Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
