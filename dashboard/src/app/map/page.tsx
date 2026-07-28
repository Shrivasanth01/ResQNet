"use client";
import React from "react";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { MapPin, Shield, Layers } from "lucide-react";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-rose-500 animate-bounce" />
            Live Incident & Responder Tactical Grid
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time layered geospatial tracking across San Francisco Regional Sector. Tap markers for live telemetry and medical drills.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-lg bg-surface border border-border flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Grid Resolution: <span className="text-white font-extrabold">SUB-METER IMU LOCK</span>
          </span>
        </div>
      </div>

      {/* Large full-screen map canvas */}
      <InteractiveMap heightClass="h-[740px]" />
    </div>
  );
}
