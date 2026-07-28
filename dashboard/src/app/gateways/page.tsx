"use client";
import React from "react";
import { useIncidents } from "@/context/IncidentContext";
import { 
  Radio, 
  Wifi, 
  Activity, 
  Battery, 
  CheckCircle2, 
  AlertOctagon, 
  Server, 
  ArrowUpRight 
} from "lucide-react";

export default function GatewaysPage() {
  const { gateways } = useIncidents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            Decentralized Gateway & Mesh Node Network
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time supervision of field mobile repeaters, fixed tower relays, and emergency satellite uplinks synchronizing with FastAPI Cloud.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono font-extrabold text-cyan-300">
            Total Relayed: 10,270 Packets
          </span>
        </div>
      </div>

      {/* Gateway Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gateways.map((gw) => (
          <div key={gw.gateway_id} className="card-surface space-y-5 hover:border-cyan-500/50 transition-all bg-gradient-to-br from-surface to-slate-900/90">
            <div className="flex items-start justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-sm">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">{gw.node_name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{gw.gateway_id}</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${gw.status === "ONLINE" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"}`}>
                <span className={`w-2 h-2 rounded-full ${gw.status === "ONLINE" ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                {gw.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-border/60 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase">Sector Location:</span>
                <span className="text-xs font-black text-white">{gw.location_name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-border">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Signal Quality</span>
                  <span className="text-base font-black text-emerald-400">{gw.signal_quality_dbm} dBm</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-border">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Relay Latency</span>
                  <span className="text-base font-black text-cyan-300">{gw.latency_ms} ms</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold">Total Packets Processed:</span>
                <span className="font-mono font-extrabold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-border">{gw.packet_relay_count} pkts</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-emerald-400" />
                <span>Battery: <strong className="text-white">{gw.battery_percentage}%</strong></span>
              </div>
              <span className="text-cyan-400 font-bold">FastAPI Cloud Link Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
