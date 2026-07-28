"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useIncidents } from "@/context/IncidentContext";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Map as MapIcon, 
  ListOrdered, 
  Users, 
  Radio, 
  BarChart3, 
  LogOut, 
  UserCheck 
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeAlertsCount, criticalCount } = useIncidents();

  const navItems = [
    { label: "Operations Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Live Incident Map", path: "/map", icon: MapIcon, count: activeAlertsCount, countCritical: criticalCount > 0 },
    { label: "Incident Triage Queue", path: "/queue", icon: ListOrdered, count: activeAlertsCount },
    { label: "Responder Fleet", path: "/responders", icon: Users },
    { label: "Gateway Monitoring", path: "/gateways", icon: Radio },
    { label: "Disaster Analytics", path: "/analytics", icon: BarChart3 },
  ];

  return (
    <aside className="w-72 bg-surface border-r border-border flex flex-col h-screen shrink-0 sticky top-0 select-none">
      {/* ResQNet Brand Header */}
      <div className="p-6 border-b border-border flex items-center gap-3.5 bg-surfaceLight/30">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center shadow-glow shrink-0">
          <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            Res<span className="text-rose-500">Q</span>Net
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Command Center v4</p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-2 px-3">Operational Channels</div>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/" && pathname?.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path} className={isActive ? "nav-link-active" : "nav-link"}>
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold shadow-sm ${item.countCritical ? "bg-rose-500 text-white animate-pulse" : "bg-slate-800 text-slate-300"}`}>
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Operator Session Info Footnote */}
      <div className="p-4 border-t border-border bg-background/50">
        {user ? (
          <div className="bg-surfaceLight/50 p-3.5 rounded-xl border border-border/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.name}</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/40">
                {user.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tighter truncate">{user.station}</p>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out Session
            </button>
          </div>
        ) : (
          <Link href="/login" className="w-full block text-center py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-glow transition-all">
            Operator Access Login
          </Link>
        )}
      </div>
    </aside>
  );
};
