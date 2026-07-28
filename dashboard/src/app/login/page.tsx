"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { ShieldAlert, KeyRound, UserCheck, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("director.vance@resqnet.org");
  const [role, setRole] = useState<UserRole>("Administrator");
  const { login } = useAuth();
  const router = useRouter();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, role);
    router.push("/");
  };

  const roles: Array<{ role: UserRole; desc: string }> = [
    { role: "Administrator", desc: "Full operational authority over emergency queue, fleet assignments, and system config." },
    { role: "Dispatcher", desc: "Triage operator authorized to assign ambulances and change emergency report status." },
    { role: "Responder", desc: "Field tactical squad member viewing real-time route maps and clinical victim profiles." },
    { role: "Viewer", desc: "Read-only situational awareness monitoring for governmental observers." },
  ];

  return (
    <div className="w-full max-w-md bg-surface border border-border/80 rounded-2xl p-8 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center mx-auto shadow-glow">
          <ShieldAlert className="w-8 h-8 text-white animate-pulse" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white mt-4">
          Res<span className="text-rose-500">Q</span>Net Command Center
        </h1>
        <p className="text-xs text-slate-400">Tactical Emergency Dispatch & Triage Authentication</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSignIn} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-rose-500" />
            Operator Email Handle
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 font-mono transition-all"
            placeholder="operator@resqnet.org"
          />
        </div>

        {/* Role Selector */}
        <div className="space-y-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            Select Tactical Clearance Role
          </label>
          <div className="space-y-2">
            {roles.map((r) => (
              <label
                key={r.role}
                onClick={() => setRole(r.role)}
                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  role === r.role ? "bg-rose-600/10 border-rose-500/60 shadow-glow" : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold ${role === r.role ? "text-rose-400" : "text-white"}`}>{r.role}</span>
                  {role === r.role && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{r.desc}</p>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm tracking-wide shadow-glow flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          Authorize Operation Access
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-4 border-t border-border/60 flex items-center justify-center gap-2 text-slate-500 text-[11px]">
        <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        Protected by ResQNet Ed25519 Cryptographic Envelope & JWT Sessions
      </div>
    </div>
  );
}
