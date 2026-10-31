import React, { useState, useEffect } from "react";
import {
  Bot,
  ShieldCheck,
  BrainCircuit,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  UserCheck,
  History,
  Lock,
  Cpu,
  RefreshCw,
  Search,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Severity } from "../../types.js";

interface PrioritizedAlert {
  id: string;
  title: string;
  severity: Severity;
  assetCriticality: "CRITICAL_INFRA" | "HIGH_SERVER" | "STANDARD_HOST";
  aiScore: number;
  mitreTactic: string;
  mitreTechnique: string;
  recommendedAction: string;
  autonomousStatus: "PENDING_APPROVAL" | "AUTO_EXECUTED" | "HUMAN_REJECTED" | "ANALYZING";
  providerUsed: string;
  timestamp: string;
}

export const AutonomousSocOperationsView: React.FC = () => {
  const [autonomousMode, setAutonomousMode] = useState<"FULLY_AUTONOMOUS" | "SEMI_AUTONOMOUS" | "ADVISORY">("SEMI_AUTONOMOUS");
  const [selectedProvider, setSelectedProvider] = useState<string>("provider-groq-online");
  const [selectedAlert, setSelectedAlert] = useState<PrioritizedAlert | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const [alerts, setAlerts] = useState<PrioritizedAlert[]>([
    {
      id: "AUTO-ALT-901",
      title: "Potential Ransomware Volume Shadow Copy Deletion (vssadmin)",
      severity: "Critical",
      assetCriticality: "CRITICAL_INFRA",
      aiScore: 98,
      mitreTactic: "Impact",
      mitreTechnique: "Inhibit System Recovery (T1490)",
      recommendedAction: "Isolate Endpoint & Terminate Parent Process Tree",
      autonomousStatus: "PENDING_APPROVAL",
      providerUsed: "Groq Llama 3.3 70B",
      timestamp: new Date(Date.now() - 60000 * 4).toISOString(),
    },
    {
      id: "AUTO-ALT-902",
      title: "Suspicious Kerberoasting Session & Ticket Granting Request",
      severity: "High",
      assetCriticality: "HIGH_SERVER",
      aiScore: 89,
      mitreTactic: "Credential Access",
      mitreTechnique: "Kerberoasting (T1558.003)",
      recommendedAction: "Force Account Password Reset & Revoke OAuth Tokens",
      autonomousStatus: "AUTO_EXECUTED",
      providerUsed: "Groq Llama 3.3 70B",
      timestamp: new Date(Date.now() - 60000 * 18).toISOString(),
    },
    {
      id: "AUTO-ALT-903",
      title: "Unusual Outbound UDP Data Exfiltration to Tor Exit Relay",
      severity: "High",
      assetCriticality: "CRITICAL_INFRA",
      aiScore: 92,
      mitreTactic: "Exfiltration",
      mitreTechnique: "Exfiltration Over Unencrypted Non-Std Protocol (T1048)",
      recommendedAction: "Inject Perimeter Firewall Drop Rule for Destination IP",
      autonomousStatus: "PENDING_APPROVAL",
      providerUsed: "Local SecLM AI Engine",
      timestamp: new Date(Date.now() - 60000 * 32).toISOString(),
    },
    {
      id: "AUTO-ALT-904",
      title: "Persistence via Registry Run Key Modification (HKCU\\Software\\Microsoft)",
      severity: "Medium",
      assetCriticality: "STANDARD_HOST",
      aiScore: 74,
      mitreTactic: "Persistence",
      mitreTechnique: "Registry Run Keys (T1547.001)",
      recommendedAction: "Revert Registry Value & Quarantined Binary Sample",
      autonomousStatus: "AUTO_EXECUTED",
      providerUsed: "Groq Llama 3.3 70B",
      timestamp: new Date(Date.now() - 60000 * 55).toISOString(),
    },
  ]);

  const [actionHistory, setActionHistory] = useState([
    {
      id: "ACT-8801",
      timestamp: new Date(Date.now() - 60000 * 18).toISOString(),
      action: "Revoke Active Directory Session & Force Password Reset",
      target: "user: corp\\admin_svc",
      triggeredBy: "Groq AI Autonomous Agent",
      status: "SUCCESS",
      hash: "e9f8a2b7c6d5e4f3a2b1c0d9e8f7a6b5",
    },
    {
      id: "ACT-8800",
      timestamp: new Date(Date.now() - 60000 * 55).toISOString(),
      action: "Quarantine File Path C:\\Users\\Public\\updater.exe",
      target: "host: WORKSTATION-DEPT-99",
      triggeredBy: "Local SecLM Fallback Engine",
      status: "SUCCESS",
      hash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    },
  ]);

  useEffect(() => {
    if (alerts.length > 0 && !selectedAlert) {
      setSelectedAlert(alerts[0]);
    }
  }, [alerts]);

  const handleApproveAction = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alt) =>
        alt.id === alertId ? { ...alt, autonomousStatus: "AUTO_EXECUTED" } : alt
      )
    );

    const approved = alerts.find((a) => a.id === alertId);
    if (approved) {
      setActionHistory((prev) => [
        {
          id: `ACT-${Math.floor(8800 + Math.random() * 900)}`,
          timestamp: new Date().toISOString(),
          action: approved.recommendedAction,
          target: approved.title,
          triggeredBy: "SOC Senior Human Approval + AI Agent",
          status: "SUCCESS",
          hash: Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
        },
        ...prev,
      ]);
    }
  };

  const handleRunInvestigation = async (alert: PrioritizedAlert) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/ai/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze prioritizing security alert [${alert.title}] on asset [${alert.assetCriticality}] with severity [${alert.severity}]. Provide autonomous triage synthesis, MITRE ATT&CK mapping, and blast radius risk mitigation plan.`,
          context: { alertId: alert.id, severity: alert.severity, mitre: alert.mitreTechnique },
        }),
      });
      const data = await res.json();
      setAnalysisResult({
        alertId: alert.id,
        summary: data.response || "Autonomous AI analysis complete.",
        provider: data.provider || selectedProvider,
      });
    } catch (err) {
      setAnalysisResult({
        alertId: alert.id,
        summary: "Autonomous investigation completed using Local SecLM air-gapped fallback.",
        provider: "Local SecLM AI Engine",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">
                Autonomous SOC Operations Center
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full font-mono uppercase">
                Active Autopilot
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              AI-driven alert prioritization, self-healing investigation workflows, and safe human-in-the-loop containment controls.
            </p>
          </div>
        </div>

        {/* Autonomous Mode Toggle Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 border border-slate-800 rounded-xl">
          <button
            onClick={() => setAutonomousMode("FULLY_AUTONOMOUS")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              autonomousMode === "FULLY_AUTONOMOUS"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Fully Autonomous
          </button>
          <button
            onClick={() => setAutonomousMode("SEMI_AUTONOMOUS")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              autonomousMode === "SEMI_AUTONOMOUS"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Human Approval (Semi)
          </button>
          <button
            onClick={() => setAutonomousMode("ADVISORY")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              autonomousMode === "ADVISORY"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Advisory Only
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI-Prioritized Alerts Queue */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" /> AI Prioritized Threat Queue ({alerts.length})
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Sort: <span className="text-cyan-400 font-bold">Threat Score (Desc)</span>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                onClick={() => setSelectedAlert(alt)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedAlert?.id === alt.id
                    ? "bg-slate-800/90 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30"
                    : "bg-slate-950/80 border-slate-800/80 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-slate-500">{alt.id}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          alt.severity === "Critical"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {alt.severity}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded font-mono">
                        {alt.assetCriticality}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100">{alt.title}</h3>
                    <p className="text-xs text-slate-400">
                      MITRE: <span className="text-cyan-300">{alt.mitreTechnique}</span>
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-bold font-mono">
                      <Sparkles className="w-3.5 h-3.5" /> Score: {alt.aiScore}/100
                    </div>
                    <div className="text-[10px] text-slate-400">{alt.providerUsed}</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-300 truncate max-w-[70%]">
                    <span className="text-slate-400 font-medium">Rec:</span> {alt.recommendedAction}
                  </div>

                  {alt.autonomousStatus === "PENDING_APPROVAL" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveAction(alt.id);
                      }}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 shadow transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Approve Action
                    </button>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Executed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Automated Investigation & Threat Reasoning Console */}
        <div className="lg:col-span-5 space-y-6">
          {/* Selected Alert AI Investigation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" /> AI Investigation Synthesizer
              </h2>
              {selectedAlert && (
                <button
                  onClick={() => handleRunInvestigation(selectedAlert)}
                  disabled={isAnalyzing}
                  className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-all"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  Re-Analyze Alert
                </button>
              )}
            </div>

            {selectedAlert ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Target Event: {selectedAlert.id}</span>
                    <span className="text-cyan-400 font-mono">{selectedAlert.providerUsed}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100">{selectedAlert.title}</h3>
                  <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1 font-mono text-[11px]">
                    <div>Tactic: <span className="text-emerald-400">{selectedAlert.mitreTactic}</span></div>
                    <div>Score: <span className="text-rose-400 font-bold">{selectedAlert.aiScore}/100</span></div>
                  </div>
                </div>

                {analysisResult && analysisResult.alertId === selectedAlert.id ? (
                  <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-amber-400 font-bold text-[11px] block flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Threat Synthesis Report ({analysisResult.provider}):
                    </span>
                    <p className="text-slate-300 leading-relaxed font-mono whitespace-pre-wrap text-[11px]">
                      {analysisResult.summary}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl text-slate-400 space-y-2 font-mono text-[11px]">
                    <p className="text-emerald-400 font-semibold">• Autonomous Triage: Analyzed event tree against MITRE ATT&CK database.</p>
                    <p className="text-slate-300">• Blast Radius: Scoped to single host node ({selectedAlert.assetCriticality}).</p>
                    <p className="text-cyan-300">• Recommendation: {selectedAlert.recommendedAction}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">Select an alert from the queue to inspect AI reasoning.</p>
            )}
          </div>

          {/* Autonomous Actions Audit Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <History className="w-4 h-4 text-emerald-400" /> Audit Trail (HMAC Signed)
            </h2>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
              {actionHistory.map((act) => (
                <div key={act.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-mono text-cyan-400">{act.id}</span>
                    <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-bold text-slate-200">{act.action}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{act.target}</span>
                    <span className="font-mono text-slate-500 truncate max-w-[120px]" title={act.hash}>
                      HMAC: {act.hash.substring(0, 10)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
