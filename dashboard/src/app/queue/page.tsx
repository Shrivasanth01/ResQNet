"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useIncidents } from "@/context/IncidentContext";
import { useAuth } from "@/context/AuthContext";
import { IncidentReport } from "@/types";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Navigation, 
  ExternalLink, 
  SlidersHorizontal 
} from "lucide-react";

export default function IncidentQueuePage() {
  const { incidents, responders, updateIncidentStatus } = useIncidents();
  const { canEdit } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [selectedResponder, setSelectedResponder] = useState<Record<string, string>>({});

  // Filter & Sort by ECS / Severity Priority
  const filtered = incidents
    .filter((inc) => {
      if (statusFilter === "ACTIVE" && inc.status === "RESOLVED") return false;
      if (statusFilter === "RESOLVED" && inc.status !== "RESOLVED") return false;
      if (severityFilter !== "ALL" && inc.severity !== severityFilter) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          inc.emergency_type.toLowerCase().includes(query) ||
          inc.incident_id.toLowerCase().includes(query) ||
          inc.packet_id.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => b.emergency_confidence_score - a.emergency_confidence_score);

  const handleAssign = async (incidentId: string) => {
    if (!canEdit) {
      alert("Unauthorized: Only Administrators and Dispatchers can modify emergency queue assignments.");
      return;
    }
    const respId = selectedResponder[incidentId];
    if (respId) {
      await updateIncidentStatus(incidentId, "DISPATCHED", respId);
    }
  };

  const handleResolve = async (incidentId: string) => {
    if (!canEdit) {
      alert("Unauthorized: Only Administrators and Dispatchers can resolve emergency reports.");
      return;
    }
    await updateIncidentStatus(incidentId, "RESOLVED");
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
            Emergency Incident Triage Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ordered strictly by Phase 2A Emergency Confidence Score (ECS) & Severity for zero-latency rescue triage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-surface px-3 py-1.5 rounded-lg border border-border font-bold">
            Showing <span className="text-rose-400">{filtered.length}</span> Prioritized Items
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-surface flex flex-col md:flex-row items-center justify-between gap-4 p-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incident type, ID, or packet..."
            className="w-full bg-slate-900 border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Severity:
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-border rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Threats Only</option>
            <option value="HIGH">High Severity</option>
            <option value="MODERATE">Moderate / Info</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold shrink-0 ml-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-border rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
          >
            <option value="ACTIVE">Active (Open & Dispatched)</option>
            <option value="RESOLVED">Resolved Incidents</option>
            <option value="ALL">All Historical</option>
          </select>
        </div>
      </div>

      {/* Main Triage Table */}
      <div className="card-surface p-0 overflow-hidden border border-border/80 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-900/90 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="p-4">Priority / ECS</th>
                <th className="p-4">Incident Telemetry & Type</th>
                <th className="p-4">Geographic Coordinates</th>
                <th className="p-4">Assigned Rescue Unit</th>
                <th className="p-4">Status & Action</th>
                <th className="p-4">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {filtered.map((inc) => (
                <tr key={inc.incident_id} className="hover:bg-slate-800/40 transition-colors">
                  {/* ECS Score */}
                  <td className="p-4 font-mono">
                    <div className="flex flex-col items-start gap-1">
                      <span className={inc.severity === "CRITICAL" ? "badge-critical" : inc.severity === "HIGH" ? "badge-high" : "badge-moderate"}>
                        {inc.severity}
                      </span>
                      <span className="text-xs font-black text-rose-400">ECS: {inc.emergency_confidence_score}/100</span>
                    </div>
                  </td>

                  {/* Telemetry Type & ID */}
                  <td className="p-4">
                    <div className="font-extrabold text-white text-base">{inc.emergency_type}</div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">ID: <span className="text-white">{inc.incident_id}</span> | Packet: {inc.packet_id}</div>
                  </td>

                  {/* Coordinates */}
                  <td className="p-4 font-mono text-xs text-slate-300">
                    <div>Lat: {Number(inc.latitude).toFixed(4)}</div>
                    <div>Lng: {Number(inc.longitude).toFixed(4)}</div>
                  </td>

                  {/* Assigned Unit & Dispatch Control */}
                  <td className="p-4">
                    <div className="space-y-2">
                      {inc.assigned_responder_id ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-mono text-xs font-extrabold flex items-center gap-1.5 w-fit shadow-sm">
                          <Navigation className="w-3.5 h-3.5 fill-current" />
                          {inc.assigned_responder_id}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 font-bold italic">Unassigned (Awaiting Unit)</span>
                      )}

                      {canEdit && inc.status !== "RESOLVED" && (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedResponder[inc.incident_id] || ""}
                            onChange={(e) => setSelectedResponder({ ...selectedResponder, [inc.incident_id]: e.target.value })}
                            className="bg-slate-950 border border-border rounded-lg px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-400"
                          >
                            <option value="">Select unit...</option>
                            {responders.map((r) => (
                              <option key={r.unit_id} value={r.unit_id}>{r.callsign} ({r.specialization})</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssign(inc.incident_id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] shadow-sm transition-all"
                          >
                            Assign
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status & Resolve Action */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${inc.status === "RESOLVED" ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-cyan-950 text-cyan-300 border border-cyan-500/50"}`}>
                        {inc.status}
                      </span>
                      {canEdit && inc.status !== "RESOLVED" && (
                        <button
                          onClick={() => handleResolve(inc.incident_id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/80 text-slate-300 hover:text-white border border-border transition-all"
                          title="Resolve Emergency Incident"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Drill-down inspect */}
                  <td className="p-4">
                    <Link
                      href={`/incidents/${inc.incident_id}`}
                      className="p-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 hover:border-rose-500 flex items-center justify-center transition-all shadow-glow"
                      title="Open Comprehensive Medical Vault & Timeline"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 text-sm italic font-medium">
                    No active emergency incidents matching your specified filtering parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
