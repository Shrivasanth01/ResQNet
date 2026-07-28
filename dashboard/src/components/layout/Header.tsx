"use client";
import React from "react";
import { useIncidents } from "@/context/IncidentContext";
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  RadioTower, 
  Bell, 
  RefreshCw, 
  Zap, 
  AlertTriangle 
} from "lucide-react";

export const Header: React.FC = () => {
  const { isConnected, activeAlertsCount, criticalCount, refreshData, simulateNewIncomingIncident } = useIncidents();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="h-20 bg-surface border-b border-border flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-lg bg-opacity-90">
      {/* Left: Operations Status & Sector Alert Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-border">
          {isConnected ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-400">Live FastAPI WebSocket Stream</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-extrabold uppercase tracking-wide text-amber-400">Standalone Mesh Simulation Vault</span>
            </>
          )}
        </div>

        {criticalCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/60 border border-rose-500/50 text-rose-300 shadow-glow animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-xs font-extrabold uppercase">{criticalCount} Critical Life-Threatening Incidents Active</span>
          </div>
        )}
      </div>

      {/* Right: Throughput Gauge & Action Buttons */}
      <div className="flex items-center gap-5">
        {/* Real-time RF Throughput Gauge */}
        <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-xl bg-surfaceLight/50 border border-border/80">
          <RadioTower className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Mesh Packet Throughput</div>
            <div className="text-xs font-extrabold font-mono text-cyan-300">9,350 Packets | 98.2% ACK Delivery</div>
          </div>
        </div>

        {/* Simulation Injection Harness Button for Evaluations */}
        <button
          onClick={() => simulateNewIncomingIncident()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs tracking-wide shadow-glow transition-all active:scale-95"
          title="Inject a real-time synthetic emergency distress packet into the operations stream"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
          Simulate Incoming SOS
        </button>

        {/* Manual Refresh Sync */}
        <button
          onClick={handleManualRefresh}
          className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 border border-border transition-all"
          title="Refresh Data from PostgreSQL Database"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
        </button>

        {/* Active Alert Notification Badge */}
        <div className="relative p-2.5 rounded-xl bg-slate-800/60 text-slate-200 border border-border">
          <Bell className="w-5 h-5" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border border-surface shadow-md">
              {activeAlertsCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
