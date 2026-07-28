"use client";
import React, { useState } from "react";
import { useIncidents } from "@/context/IncidentContext";
import { 
  Navigation, 
  Users, 
  Battery, 
  MapPin, 
  CheckCircle2, 
  ShieldAlert, 
  Filter, 
  Truck 
} from "lucide-react";

export default function RespondersPage() {
  const { responders } = useIncidents();
  const [filterType, setFilterType] = useState("ALL");

  const filtered = responders.filter((r) => filterType === "ALL" || r.unit_type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-400" />
            Tactical Responder & Vehicle Fleet
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time GPS location, battery telemetry, and triage dispatch status across all emergency operational squads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-surface border border-border rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400 shadow-sm"
          >
            <option value="ALL">All Unit Types ({responders.length})</option>
            <option value="AMBULANCE">Ambulances & Paramedics</option>
            <option value="FIRE_TRUCK">Fire & Heavy Rescue</option>
            <option value="HELICOPTER">Medevac Helicopters</option>
            <option value="HAZMAT_SQUAD">Hazmat Squads</option>
          </select>
        </div>
      </div>

      {/* Responder Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((resp) => (
          <div key={resp.unit_id} className="card-surface space-y-4 hover:border-emerald-500/50 transition-all bg-gradient-to-br from-surface to-slate-900/80">
            <div className="flex items-start justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm">
                  <Navigation className="w-6 h-6 transform rotate-45" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">{resp.callsign}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">{resp.name}</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${resp.status === "AVAILABLE" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-cyan-950 text-cyan-300 border border-cyan-500/40"}`}>
                {resp.status}
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-medium text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[11px]">Specialization:</span>
                <span className="text-emerald-300 font-black">{resp.specialization}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[11px]">Current Coordinates:</span>
                <span className="font-mono text-slate-200">[{resp.current_latitude.toFixed(4)}, {resp.current_longitude.toFixed(4)}]</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[11px]">Assigned Incident:</span>
                <span className="font-mono font-bold text-rose-400">{resp.assigned_incident_id || "NONE (PATROLLING SECTOR)"}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-amber-400" />
                <span>Power Reserve: <strong className="text-white">{resp.battery_level}%</strong></span>
              </div>
              <span>Updated: Just Now</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
