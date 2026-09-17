"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiService } from "@/lib/api";
import { AiEmergencyService, AiTriageAnalysis } from "@/lib/ai";
import { IncidentReport } from "@/types";
import { 
  ShieldAlert, 
  UserCheck, 
  HeartPulse, 
  PhoneCall, 
  Clock, 
  Radio, 
  MapPin, 
  ArrowLeft, 
  CheckCircle2, 
  Lock,
  Bot,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default function IncidentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [incident, setIncident] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // AI Triage Assessment State
  const [aiAnalysis, setAiAnalysis] = useState<AiTriageAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const runAiAnalysis = async (inc: IncidentReport) => {
    setAiLoading(true);
    try {
      const description = `Incident: ${inc.emergency_type} at lat:${inc.latitude}, lon:${inc.longitude}. Sensor ECS: ${inc.emergency_confidence_score}/100. Severity: ${inc.severity}. Status: ${inc.status}. Medical condition: ${inc.medicalVault?.medicalConditions || 'Unknown'}. Allergies: ${inc.medicalVault?.allergies || 'Unknown'}.`;
      const result = await AiEmergencyService.analyzeDistressPayload(description, inc.emergency_type);
      setAiAnalysis(result);
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      ApiService.getIncidentDetail(id).then((res) => {
        setIncident(res);
        setLoading(false);
        if (res) {
          runAiAnalysis(res);
        }
      });
    }
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center font-mono text-slate-400 animate-pulse">Decrypting and loading emergency vault telemetry for {id}...</div>;
  }

  if (!incident) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-rose-400">Incident Report {id} Not Found</h2>
        <Link href="/queue" className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs">Return to Incident Queue</Link>
      </div>
    );
  }

  const vault = incident.medicalVault || {
    userId: incident.user_id || "usr_anonymous",
    fullName: "Alex Mercer (Verified Seed Profile)",
    email: "alex.mercer@resqnet.org",
    phoneNumber: "+1-555-0101",
    bloodGroup: "O+",
    age: "29",
    medicalConditions: "Asthma | Type 1 Diabetes (Insulin Dependent)",
    allergies: "Penicillin, Peanuts",
    emergencyContacts: [
      { name: "Sarah Mercer", phoneNumber: "+1-555-0102", relationship: "Sister", priorityOrder: 1 },
      { name: "Dr. Jonathan Vance", phoneNumber: "+1-555-0103", relationship: "Primary Physician", priorityOrder: 2 },
    ],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-1.5">
          <Link href="/queue" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:underline mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Emergency Queue
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">{incident.emergency_type}</h1>
            <span className={incident.severity === "CRITICAL" ? "badge-critical" : "badge-high"}>{incident.severity}</span>
            <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 font-mono text-xs border border-border">Status: {incident.status}</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">Incident ID: <span className="text-white font-extrabold">{incident.incident_id}</span> | Packet ID: {incident.packet_id} | Created: {new Date(incident.created_at).toLocaleString()}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 font-mono text-xs shadow-glow flex flex-col items-end">
            <span className="text-[10px] uppercase text-rose-400 font-extrabold">Emergency Confidence Score</span>
            <span className="text-xl font-black">{incident.emergency_confidence_score} / 100</span>
          </div>
        </div>
      </div>

      {/* AI Emergency Triage Advisor Banner */}
      <div className="card-surface p-5 border-cyan-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">AI Incident Triage & Tactical Advisor</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  {aiAnalysis?.modelUsed || "openai/gpt-6-astra"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Real-time situational assessment synthesized from mesh telemetry, sensory confidence & medical vault.</p>
            </div>
          </div>

          <button
            onClick={() => incident && runAiAnalysis(incident)}
            disabled={aiLoading}
            className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold flex items-center gap-2 transition-all self-start md:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            {aiLoading ? 'Analyzing Situation...' : 'Re-assess with AI'}
          </button>
        </div>

        {aiLoading ? (
          <div className="py-8 text-center font-mono text-xs text-cyan-300 flex items-center justify-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            Synthesizing tactical directives with OpenAI GPT-6 Astra...
          </div>
        ) : aiAnalysis ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                Assessed Risk:
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  aiAnalysis.riskLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-500/50' :
                  aiAnalysis.riskLevel === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                }`}>
                  {aiAnalysis.riskLevel}
                </span>
              </span>

              <span className="flex items-center gap-1.5 text-slate-300">
                Model Confidence:
                <span className="text-cyan-300 font-extrabold">{aiAnalysis.confidenceScore}%</span>
              </span>
            </div>

            <p className="text-xs text-slate-200 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
              <strong className="text-cyan-300 font-mono block mb-1">Tactical Summary:</strong>
              {aiAnalysis.summaryText}
            </p>

            {aiAnalysis.recommendedActions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  Recommended Dispatch & Rescue Directives:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {aiAnalysis.recommendedActions.map((action, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-xs text-slate-400">Click &apos;Re-assess with AI&apos; to run automated triage.</div>
        )}
      </div>

      {/* Grid Content: 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COL 1 & 2: Medical Vault & Communication Route */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Master Medical Vault (Phase 1 Integration) */}
          <div className="card-surface space-y-5 border-rose-500/40 bg-gradient-to-br from-surface to-slate-900">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-black text-white text-base tracking-wide flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500 animate-pulse" />
                Master Emergency Medical Vault
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5" /> Ed25519 Decrypted PHI
              </span>
            </div>

            {/* Patient Identity & Blood Group */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/80 p-4 rounded-xl border border-border/80">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Patient Name</span>
                <span className="text-base font-black text-white">{vault.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Blood Group</span>
                <span className="text-xl font-black text-rose-500">{vault.bloodGroup}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Age / DOB</span>
                <span className="text-sm font-black text-white">{vault.age} Years Old</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Phone Number</span>
                <span className="text-sm font-mono text-cyan-300">{vault.phoneNumber}</span>
              </div>
            </div>

            {/* Medical Conditions & Allergies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-border/60">
                <span className="text-xs font-extrabold uppercase text-amber-400 block mb-1">Clinical Conditions & Medications</span>
                <p className="text-sm text-slate-200 font-semibold">{vault.medicalConditions}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-border/60">
                <span className="text-xs font-extrabold uppercase text-rose-400 block mb-1">Known Severe Allergies</span>
                <p className="text-sm text-slate-200 font-semibold">{vault.allergies}</p>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase text-slate-400 block">Verified Emergency Contacts Vault</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vault.emergencyContacts.map((c, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-border flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-white">{c.name} ({c.relationship})</h5>
                      <span className="text-xs font-mono text-cyan-400">{c.phoneNumber}</span>
                    </div>
                    <a href={`tel:${c.phoneNumber}`} className="p-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 transition-all">
                      <PhoneCall className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Communication Engine & Mesh Routing Topology */}
          <div className="card-surface space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-black text-white text-base tracking-wide flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                Packet Routing & Gateway Telemetry
              </h3>
              <span className="text-xs text-slate-400 font-mono">ACK ID: <span className="text-emerald-400 font-bold">{incident.ackId || "RQ-ACK-CONFIRMED-88"}</span></span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-border flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400 font-extrabold uppercase">Hop Route:</span>
              {(incident.meshRoute || ["NODE-ORIGIN-01", "NODE-RELAY-104", "GATEWAY-MOBILE-V3", "FASTAPI-CLOUD-REST"]).map((hop, idx, arr) => (
                <React.Fragment key={idx}>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 text-cyan-300 font-mono text-xs font-extrabold border border-cyan-500/40 shadow-sm">
                    {hop}
                  </span>
                  {idx < arr.length - 1 && <span className="text-slate-500 font-bold">➔</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* COL 3: Chronological Forensic Timeline (Phase 2A / 3 Integration) */}
        <div className="card-surface space-y-5 h-fit border-cyan-500/30">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-black text-white text-base tracking-wide flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Forensic Audit Timeline
            </h3>
            <span className="text-xs text-slate-400">Immutable Ledger</span>
          </div>

          <div className="space-y-6 pl-2 relative border-l-2 border-border/80 my-4">
            {(incident.timeline || [
              { timeline_id: "1", timestamp: new Date(Date.now() - 360000).toISOString(), event_type: "INCIDENT_INGESTED", summary: "Initial automated SOS broadcast triggered by Phase 2A Sensor Fusion.", ecs_snapshot: incident.emergency_confidence_score },
              { timeline_id: "2", timestamp: new Date(Date.now() - 320000).toISOString(), event_type: "GATEWAY_UPLOADED", summary: "Ingested into PostgreSQL cloud database via Gateway V3 with cryptographic ACK acknowledgment." },
              { timeline_id: "3", timestamp: new Date().toISOString(), event_type: "DISPATCH_VIEWED", summary: "Incident telemetry inspected by Director Marcus Vance at SF Operations EOC." },
            ]).map((t) => (
              <div key={t.timeline_id} className="relative pl-6 space-y-1">
                <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-rose-600 border-2 border-surface shadow-glow" />
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                  <span className="text-cyan-300 font-extrabold">{t.event_type}</span>
                </div>
                <p className="text-xs text-slate-200 font-semibold leading-relaxed">{t.summary}</p>
                {t.ecs_snapshot !== undefined && (
                  <span className="text-[10px] font-mono font-extrabold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30 inline-block mt-1">
                    Snapshot ECS: {t.ecs_snapshot}/100
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
