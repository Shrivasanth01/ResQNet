"use client";
import React from "react";
import { useIncidents } from "@/context/IncidentContext";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  RadioTower, 
  ShieldAlert, 
  CheckCircle2 
} from "lucide-react";

export default function AnalyticsPage() {
  const { analytics } = useIncidents();

  if (!analytics) return null;

  const maxCount = Math.max(...analytics.dailyIncidents.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-violet-400" />
            Disaster Operations Analytics & Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical disaster trends, communication method distribution, and triage optimization statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono font-extrabold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Overall Delivery Success Rate: 98.2%
          </span>
        </div>
      </div>

      {/* Row 1: Daily Incident Volume Bar Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Bar Chart (2 cols) */}
        <div className="lg:col-span-2 card-surface space-y-6">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h3 className="font-extrabold text-white text-sm tracking-wide uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              7-Day Emergency Incident Volume Trend
            </h3>
            <span className="text-xs text-slate-400 font-mono">214 Total Incidents This Week</span>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-4 pt-4 pb-2 border-b border-slate-800">
            {analytics.dailyIncidents.map((day, idx) => {
              const heightPercent = Math.round((day.count / maxCount) * 100);
              const critPercent = Math.round((day.critical / day.count) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full flex flex-col items-center justify-end h-full relative">
                    <span className="text-[11px] font-mono font-extrabold text-white mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </span>
                    <div style={{ height: `${heightPercent}%` }} className="w-full max-w-[42px] bg-gradient-to-t from-slate-800 via-rose-700 to-rose-500 rounded-t-lg relative overflow-hidden shadow-lg transition-transform group-hover:scale-105">
                      <div style={{ height: `${critPercent}%` }} className="absolute bottom-0 left-0 right-0 bg-rose-400 opacity-80" />
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 tracking-tighter truncate w-full text-center">{day.date}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-rose-500" /> Total Incidents</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-rose-300" /> Critical Threats (ECS ≥ 85)</span>
          </div>
        </div>

        {/* Category Breakdown (1 col) */}
        <div className="card-surface space-y-6">
          <div className="border-b border-border/80 pb-3">
            <h3 className="font-extrabold text-white text-sm tracking-wide uppercase flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              Incident Categories
            </h3>
          </div>

          <div className="space-y-4">
            {analytics.categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{cat.category}</span>
                  <span className="font-mono text-cyan-300 font-extrabold">{cat.count} ({cat.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-border/50">
                  <div style={{ width: `${cat.percentage}%` }} className="h-full bg-gradient-to-r from-cyan-600 to-emerald-400 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-border text-xs text-slate-300">
            <strong className="text-white block mb-1">Operational Insight:</strong>
            Medical falls and vehicular collisions represent 69% of all distress signals, demonstrating high efficiency for Phase 2A sensor fusion math.
          </div>
        </div>
      </div>

      {/* Row 2: Communication Throughput table */}
      <div className="card-surface space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="font-extrabold text-white text-sm tracking-wide uppercase flex items-center gap-2">
            <RadioTower className="w-4 h-4 text-emerald-400" />
            Phase 2.75 Communication Engine Throughput & Delivery Receipts
          </h3>
          <span className="text-xs text-slate-400 font-mono">9,350 Packets Evaluated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.communicationThroughput.map((comm, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-border flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">{comm.method}</span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">{comm.count.toLocaleString()} pkts</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400 font-bold">Delivery Rate:</span>
                <span className="font-mono font-extrabold text-emerald-400">{comm.successRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
