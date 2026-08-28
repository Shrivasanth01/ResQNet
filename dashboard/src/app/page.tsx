"use client";
import React, { useState, useEffect } from "react";
import { useIncidents } from "@/context/IncidentContext";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { 
  AlertTriangle, 
  Activity, 
  Clock, 
  Users, 
  Radio, 
  TrendingDown, 
  ShieldCheck, 
  ExternalLink,
  Bot,
  Radar,
  RadioTower,
  Cpu
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { incidents, responders, gateways, analytics, isConnected, isBackendOffline } = useIncidents();
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeIncidents = incidents.filter((i) => i.status === "OPEN" || i.status === "DISPATCHED");
  const criticalIncidents = incidents.filter((i) => i.severity === "CRITICAL" && (i.status === "OPEN" || i.status === "DISPATCHED"));

  return (
    <div className="space-y-8">
      {/* Tactical HUD Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600 to-rose-900 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)] shrink-0">
            <Radar className="w-7 h-7 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Disaster Operations Command Center</h1>
              <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-mono font-extrabold tracking-wider">
                LIVE HUD TACTICAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Real-Time Mesh Triage & Geospatial Distress Matrix</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-cyan-400">{timeStr}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-extrabold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Telemetry engine:</span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-extrabold flex items-center gap-2">
            <RadioTower className="w-4 h-4 text-cyan-400" />
            <span>Mesh Uptime:</span>
            <span className="text-cyan-400">99.98%</span>
          </div>
          <Link
            href="/queue"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs border border-rose-500/50 flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
          >
            Triage Queue
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Tactical HUD Telemetry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Active Field Distress Alerts */}
        <div className="card-tactical-critical">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-slate-400">Active Field Distress Alerts</span>
            <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl font-black text-white font-mono tracking-tight">{activeIncidents.length}</span>
            <span className="badge-critical">{criticalIncidents.length} CRITICAL</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5 font-mono">
            <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            Emergency Confidence Score (ECS) Live Triage
          </p>
        </div>

        {/* Card 2: Average Response Dispatch Time */}
        <div className="card-tactical-amber">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-slate-400">Avg Triage Dispatch Time</span>
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl font-black text-white font-mono tracking-tight">3.9 <span className="text-xl text-slate-400">min</span></span>
            <span className="text-xs text-emerald-400 font-mono font-extrabold flex items-center gap-0.5">
              <TrendingDown className="w-4 h-4" /> -18.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-mono">Automated countdown alarm cutting radio latency</p>
        </div>

        {/* Card 3: Tactical Responder Fleet */}
        <div className="card-tactical-emerald">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-slate-400">Tactical Responder Fleet</span>
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl font-black text-white font-mono tracking-tight">{responders.length}</span>
            <span className="badge-info">{responders.filter(r => r.status === "AVAILABLE").length} AVAILABLE</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-mono">Ambulance, SAR Heavy Rescue & Medevac Units</p>
        </div>

        {/* Card 4: Mesh Gateway Relays */}
        <div className="card-tactical-cyan">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-slate-400">Active Mesh Relays</span>
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl font-black text-white font-mono tracking-tight">{gateways.length} <span className="text-xl text-slate-400">Nodes</span></span>
            <span className="text-xs text-cyan-300 font-mono font-extrabold">98.2% ACK</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-mono">Bluetooth & Wi-Fi Direct P2P Mesh Uplinks</p>
        </div>
      </div>

      {/* Centerpiece: Live Tactical Map HUD */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-white flex items-center gap-2.5 uppercase tracking-wide">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            Live Geospatial Radar Grid
          </h2>
          <Link href="/map" className="text-xs font-extrabold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-all font-mono">
            Full Screen Map HUD <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <InteractiveMap heightClass="h-[520px]" />
        </div>
      </div>

      {/* Bottom Grid: Triage Stream & System Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Triage Ingestion Stream (2 Cols) */}
        <div className="lg:col-span-2 card-surface space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-xs tracking-widest uppercase flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              High Priority Emergency Triage Stream
            </h3>
            <Link href="/queue" className="text-xs font-extrabold text-cyan-400 hover:underline font-mono">
              Complete Queue ({activeIncidents.length})
            </Link>
          </div>

          <div className="space-y-3">
            {isBackendOffline ? (
              <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto animate-pulse" />
                <h4 className="text-base font-black text-rose-300">FastAPI Gateway Offline</h4>
                <p className="text-xs text-slate-400 font-mono">Operating in local Standalone Offline Vault mode. REST endpoints standby.</p>
              </div>
            ) : activeIncidents.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-base font-black text-white">Sector Clear & Protected</h4>
                <p className="text-xs text-slate-400">No active emergency distress signals detected in current mesh perimeter.</p>
              </div>
            ) : (
              activeIncidents.slice(0, 4).map((inc) => (
                <div key={inc.incident_id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between hover:border-slate-700 transition-all">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className={inc.severity === "CRITICAL" ? "badge-critical" : inc.severity === "HIGH" ? "badge-high" : "badge-moderate"}>
                        {inc.severity}
                      </span>
                      <span className="font-mono text-xs text-rose-400 font-black">ECS: {inc.emergency_confidence_score}/100</span>
                      <span className="text-[11px] text-slate-500 font-mono">[ID: {inc.incident_id}]</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">{inc.emergency_type}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">Assigned Unit: <span className="text-emerald-400 font-bold">{inc.assigned_responder_id || "PENDING DISPATCH"}</span> | Gateway: {inc.gatewayId || "P2P Mesh"}</p>
                  </div>

                  <Link
                    href={`/incidents/${inc.incident_id}`}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all font-mono"
                  >
                    Inspect Vault
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System & AI Intelligence Status (1 Col) */}
        <div className="card-surface space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-white text-xs tracking-widest uppercase border-b border-slate-800 pb-3 flex items-center gap-2 font-mono">
              <Bot className="w-4 h-4 text-cyan-400" />
              Engine Intelligence & Security
            </h3>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs text-slate-300 font-extrabold">FastAPI Routing API</span>
                <span className="badge-info">ONLINE</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs text-slate-300 font-extrabold">PostgreSQL ACID Vault</span>
                <span className="text-xs font-mono font-extrabold text-emerald-400">SYNCHRONIZED</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs text-slate-300 font-extrabold">Ed25519 Cryptographic Envelope</span>
                <span className="text-xs font-mono font-extrabold text-cyan-400">ACTIVE & SIGNING</span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-1">
                <span className="font-extrabold flex items-center gap-1 text-rose-400 font-mono">
                  <Bot className="w-3.5 h-3.5" /> AI Triage Classifier:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Real-time sensor fusion filtering out non-emergency civilian motion artifacts and ranking distress priority.
                </p>
              </div>
            </div>
          </div>

          <Link href="/analytics" className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-center font-bold text-xs border border-slate-700 block transition-all font-mono uppercase tracking-wider">
            Disaster Analytics & Heatmaps
          </Link>
        </div>
      </div>
    </div>
  );
}
