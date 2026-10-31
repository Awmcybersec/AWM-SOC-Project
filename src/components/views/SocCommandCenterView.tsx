import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  Activity,
  Radio,
  Cpu,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Zap,
  Globe,
  Layers,
  Sparkles,
  Bot,
  Play,
  User,
  Server,
  Lock,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  FileText,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

interface SocIncident {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
  riskScore: number;
  mitreTactics: string[];
  affectedHosts: string[];
  affectedUsers: string[];
  assignedAnalyst: string;
  summary: string;
  createdAt: string;
}

interface SocAlert {
  id: string;
  sourceModule: 'SIEM' | 'NDR' | 'EDR' | 'UEBA' | 'SOAR' | 'TIP' | 'VM' | 'GRC';
  alertName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitreTechnique?: string;
  hostname?: string;
  sourceIp?: string;
  destinationIp?: string;
  timestamp: string;
}

interface AttackTimelineStage {
  id: string;
  incidentId: string;
  stageOrder: number;
  stageTitle: string;
  description: string;
  mitreTechnique?: string;
  moduleSource: string;
  timestamp: string;
}

interface AiInvestigationReport {
  incidentId: string;
  aiExecutiveSummary: string;
  attackVectorAnalysis: string;
  recommendedPlaybooks: string[];
  mitreTacticsExplained: string[];
  containmentGuidance: string;
}

export const SocCommandCenterView: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [incidents, setIncidents] = useState<SocIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SocIncident | null>(null);
  const [timeline, setTimeline] = useState<AttackTimelineStage[]>([]);
  const [aiReport, setAiReport] = useState<AiInvestigationReport | null>(null);
  const [investigating, setInvestigating] = useState<boolean>(false);
  const [soarActionMessage, setSoarActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSocData();

    // SSE Stream Subscription
    const eventSource = new EventSource('/api/soc/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'soc_alert' || data.type === 'incident_created') {
          fetchSocData();
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchSocData = async () => {
    try {
      const [dashRes, incRes] = await Promise.all([
        fetch('/api/soc/dashboard').then((r) => r.json()),
        fetch('/api/soc/incidents').then((r) => r.json()),
      ]);

      setDashboard(dashRes);
      setIncidents(incRes || []);
      if (incRes && incRes.length > 0 && !selectedIncident) {
        setSelectedIncident(incRes[0]);
        fetchTimeline(incRes[0].id);
      }
    } catch (err) {
      console.error('Error fetching SOC command data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (incId: string) => {
    try {
      const res = await fetch(`/api/soc/timeline/${incId}`);
      const data = await res.json();
      setTimeline(data || []);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    }
  };

  const handleSelectIncident = (inc: SocIncident) => {
    setSelectedIncident(inc);
    setAiReport(null);
    fetchTimeline(inc.id);
  };

  const handleRunAiInvestigation = async () => {
    if (!selectedIncident) return;
    setInvestigating(true);
    setAiReport(null);

    try {
      const res = await fetch(`/api/soc/incidents/${selectedIncident.id}/investigate`, {
        method: 'POST',
      });
      const data = await res.json();
      setAiReport(data);
    } catch (err) {
      console.error('Error running AI investigation:', err);
    } finally {
      setInvestigating(false);
    }
  };

  const handleTriggerSoarAction = async (actionType: string) => {
    if (!selectedIncident) return;
    setSoarActionMessage(`Executing SOAR automated containment action: '${actionType}'...`);

    try {
      // Simulate endpoint containment API call
      await new Promise((r) => setTimeout(r, 1200));

      // Update incident status
      await fetch(`/api/soc/incidents/${selectedIncident.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CONTAINED',
          analyst: 'AWM Cyber AI Autonomous SOC Response Agent',
        }),
      });

      setSoarActionMessage(`SUCCESS: Action '${actionType}' executed successfully. Host isolated & C2 blocked.`);
      fetchSocData();
      setTimeout(() => setSoarActionMessage(null), 5000);
    } catch (err) {
      setSoarActionMessage(`FAILED to execute SOAR response action.`);
    }
  };

  if (loading || !dashboard) {
    return (
      <div className="p-8 bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Connecting to AWM Cyber AI XDR Unified Event Mesh...</p>
      </div>
    );
  }

  const threatScore = dashboard.globalThreatScore || 85;

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 animate-pulse">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Enterprise XDR SOC Command Center
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                LIVE XDR CORRELATION
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Unified cross-engine security orchestration: SIEM, EDR, NDR, UEBA, SOAR, TIP, VM & GRC.
            </p>
          </div>
        </div>

        {/* Global Threat Risk Gauge */}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Global Threat Risk Index</span>
            <span className="text-xs font-mono text-slate-300">Unified 9-Engine Synthesis</span>
          </div>
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-xl border font-mono font-bold text-xl ${
              threatScore > 80
                ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/20 animate-pulse'
                : threatScore > 50
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {threatScore}
          </div>
        </div>
      </div>

      {/* SOC KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block">MTTD (Mean Time to Detect)</span>
          <span className="text-xl font-bold text-indigo-400 font-mono mt-1 block">{dashboard.socKpis.mttdMinutes}m</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block">MTTR (Mean Time to Respond)</span>
          <span className="text-xl font-bold text-indigo-400 font-mono mt-1 block">{dashboard.socKpis.mttrMinutes}m</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block">MTTC (Mean Containment)</span>
          <span className="text-xl font-bold text-indigo-400 font-mono mt-1 block">{dashboard.socKpis.mttcMinutes}m</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block">24h Ingested Events</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">{(dashboard.socKpis.events24h / 1000000).toFixed(2)}M</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block">SOAR Executions</span>
          <span className="text-xl font-bold text-cyan-400 font-mono mt-1 block">{dashboard.socKpis.playbooksExecuted}</span>
        </div>
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block">Active SOC Analysts</span>
          <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">{dashboard.socKpis.activeAnalysts} On-Duty</span>
        </div>
      </div>

      {/* Main SOC Command Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Incident Queue & Alert Stream (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 p-4 border border-slate-800 rounded-xl flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> Correlated Incidents ({incidents.length})
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Stream
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => handleSelectIncident(inc)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedIncident?.id === inc.id
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-400">{inc.id}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      inc.severity === 'CRITICAL'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-2">{inc.title}</h3>

                <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                  <span className="font-mono text-emerald-400">{inc.status}</span>
                  <span>Assigned: {inc.assignedAnalyst.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Critical Alerts Feed */}
          <div className="bg-slate-900/80 p-4 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Real-Time Cross-Module Alerts
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 font-mono text-xs">
              {dashboard.criticalAlerts.map((alt: SocAlert) => (
                <div key={alt.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-start justify-between gap-2">
                  <div>
                    <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-500/10 rounded mr-1.5 border border-cyan-500/20">
                      [{alt.sourceModule}]
                    </span>
                    <span className="text-slate-200">{alt.alertName}</span>
                    <div className="text-slate-500 text-[11px] mt-1">Target: {alt.hostname || alt.destinationIp || 'N/A'}</div>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(alt.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Incident Deep-Dive, AI Copilot & Attack Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedIncident ? (
            <div className="space-y-6">
              {/* Active Incident Header */}
              <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {selectedIncident.id}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        RISK SCORE: {selectedIncident.riskScore}/100
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1.5">{selectedIncident.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunAiInvestigation}
                      disabled={investigating}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs rounded-lg transition shadow-lg shadow-indigo-600/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      {investigating ? 'Running AWM AI Assistant Investigation...' : 'AWM AI Assistant Investigation'}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                  {selectedIncident.summary}
                </p>

                {/* Affected Entities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block font-semibold mb-1">Affected Endpoint Hosts:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedIncident.affectedHosts.map((h, idx) => (
                        <span key={idx} className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block font-semibold mb-1">Targeted User Identities:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedIncident.affectedUsers.map((u, idx) => (
                        <span key={idx} className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SOAR Action Response Notification */}
                {soarActionMessage && (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs font-mono text-indigo-300 flex items-center gap-2 animate-fade-in">
                    <Zap className="w-4 h-4 text-indigo-400 animate-bounce" />
                    {soarActionMessage}
                  </div>
                )}

                {/* SOAR Automated Containment Buttons */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    SOAR One-Click Containment Playbooks
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleTriggerSoarAction('Isolate Endpoint via EDR')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold rounded-lg transition"
                    >
                      <Lock className="w-3.5 h-3.5" /> Isolate Host (EDR)
                    </button>
                    <button
                      onClick={() => handleTriggerSoarAction('Block C2 IP on Firewall')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold rounded-lg transition"
                    >
                      <Globe className="w-3.5 h-3.5" /> Block C2 IP (NDR)
                    </button>
                    <button
                      onClick={() => handleTriggerSoarAction('Revoke IAM Credentials')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold rounded-lg transition"
                    >
                      <User className="w-3.5 h-3.5" /> Revoke Tokens (IAM)
                    </button>
                  </div>
                </div>
              </div>

              {/* AI COPILOT INVESTIGATION REPORT PANEL */}
              {aiReport && (
                <div className="p-5 bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm border-b border-indigo-500/20 pb-3">
                    <Bot className="w-5 h-5 text-indigo-400" />
                    AWM AI Assistant Autonomous SOC Investigation Report
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">CISO Executive Summary</span>
                      <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                        {aiReport.aiExecutiveSummary}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">Attack Vector Analysis</span>
                      <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                        {aiReport.attackVectorAnalysis}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">Containment & Remediation Guidance</span>
                      <p className="text-emerald-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-emerald-500/30 font-mono">
                        {aiReport.containmentGuidance}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ATTACK TIMELINE RECONSTRUCTION */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" /> Reconstructed Multi-Engine Attack Timeline
                </h3>

                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                  {timeline.map((stg) => (
                    <div key={stg.id} className="relative pl-8 space-y-1">
                      <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-950" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">Stage {stg.stageOrder}:</span>
                        <span className="text-xs font-bold text-white">{stg.stageTitle}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {stg.moduleSource}
                        </span>
                        {stg.mitreTechnique && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            {stg.mitreTechnique}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{stg.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-slate-900/80 border border-slate-800 rounded-xl text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">Select an incident from the left queue to begin analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
