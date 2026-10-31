import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  GitBranch,
  Target,
  Search,
  Activity,
  Flame,
  Zap,
  ArrowRight,
  Layers,
  Cpu,
  RefreshCw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Play,
  Grid,
} from "lucide-react";

export const AdvancedAnalyticsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"kill_chain" | "attack_path" | "risk_scoring" | "threat_hunting">("kill_chain");
  const [killChainStages, setKillChainStages] = useState<any[]>([]);
  const [attackPathGraph, setAttackPathGraph] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState<boolean>(true);

  // Risk Scoring Calculator State
  const [assetCriticality, setAssetCriticality] = useState<number>(10);
  const [cvssScore, setCvssScore] = useState<number>(9.8);
  const [threatIntelConfidence, setThreatIntelConfidence] = useState<number>(95);
  const [uebaAnomalyScore, setUebaAnomalyScore] = useState<number>(88);
  const [calculatedRiskScore, setCalculatedRiskScore] = useState<number>(98);

  // Threat Hunting Workspace State
  const [awmQlQuery, setAwmQlQuery] = useState<string>("event.category == 'malware' AND threat.score >= 80 AND process.name == 'lsass.exe'");
  const [huntResults, setHuntResults] = useState<any>(null);
  const [huntingExecuting, setHuntingExecuting] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resKc, resAp] = await Promise.all([
        fetch("/api/analytics/kill-chain"),
        fetch("/api/analytics/attack-path"),
      ]);

      if (resKc.ok) setKillChainStages(await resKc.json());
      if (resAp.ok) setAttackPathGraph(await resAp.json());
    } catch (err) {
      console.error("Failed to load Advanced Security Analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCalculateRisk = async () => {
    try {
      const res = await fetch("/api/analytics/risk-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criticality: assetCriticality,
          cvss: cvssScore,
          threatIntel: threatIntelConfidence,
          ueba: uebaAnomalyScore,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalculatedRiskScore(data.riskScore);
      }
    } catch (err) {
      console.error("Error calculating risk score:", err);
    }
  };

  const handleExecuteThreatHunt = async () => {
    setHuntingExecuting(true);
    try {
      const res = await fetch("/api/analytics/threat-hunt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awmQlQuery }),
      });
      if (res.ok) {
        setHuntResults(await res.json());
      }
    } catch (err) {
      console.error("Error executing threat hunt:", err);
    } finally {
      setHuntingExecuting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 p-6 rounded-2xl border border-rose-500/20 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              PHASE 6 ADVANCED ANALYTICS
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              AWM-QL HUNTING ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-7 h-7 text-rose-400" />
            Advanced Security Posture & Threat Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Multi-factor Risk Scoring Engine, Cyber Kill Chain Stages, Directed Attack Path Graphing, and Interactive Threat Hunting Workspace.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Analytics
        </button>
      </div>

      {/* Sub Navigation */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("kill_chain")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "kill_chain" ? "border-rose-400 text-rose-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" /> Cyber Kill Chain Visualizer
        </button>
        <button
          onClick={() => setActiveTab("attack_path")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "attack_path" ? "border-rose-400 text-rose-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <GitBranch className="w-4 h-4" /> Attack Path Graphing
        </button>
        <button
          onClick={() => setActiveTab("risk_scoring")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "risk_scoring" ? "border-rose-400 text-rose-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame className="w-4 h-4" /> Multi-Factor Risk Scoring Engine
        </button>
        <button
          onClick={() => setActiveTab("threat_hunting")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "threat_hunting" ? "border-rose-400 text-rose-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="w-4 h-4" /> Threat Hunting Workspace (AWM-QL)
        </button>
      </div>

      {/* KILL CHAIN TAB */}
      {activeTab === "kill_chain" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-400" /> Lockheed Martin Cyber Kill Chain Mapping
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {killChainStages.map((stage) => (
              <div
                key={stage.stageNumber}
                className={`p-5 rounded-2xl border space-y-3 transition ${
                  stage.status === "CRITICAL"
                    ? "bg-rose-950/30 border-rose-500/40 shadow-lg shadow-rose-950/50"
                    : stage.status === "ELEVATED"
                    ? "bg-amber-950/20 border-amber-500/30"
                    : "bg-slate-900/80 border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Stage {stage.stageNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      stage.status === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : stage.status === "ELEVATED"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-white text-base">{stage.stageName}</h3>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Active Threats:</span>
                  <strong className="text-rose-400 font-extrabold">{stage.activeThreatCount}</strong>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">MITRE Techniques:</span>
                  <div className="flex flex-wrap gap-1">
                    {stage.mitreTechniqueIds.map((t: string) => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-cyan-300 border border-slate-800">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <span className="font-semibold text-slate-400 block text-[10px]">Recent Detections:</span>
                  {stage.recentDetections.map((d: string, idx: number) => (
                    <p key={idx} className="line-clamp-2 italic text-slate-300">
                      • {d}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATTACK PATH TAB */}
      {activeTab === "attack_path" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-rose-400" /> Directed Attack Path Visualization Graph
            </h2>
          </div>

          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 overflow-x-auto p-4 bg-slate-950 rounded-xl border border-slate-800/80">
              {attackPathGraph.nodes.map((node, index) => (
                <React.Fragment key={node.id}>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl w-64 shrink-0 space-y-2 shadow-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-rose-400 uppercase">{node.type}</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">{node.ipAddress}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{node.label}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{node.description}</p>
                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono border border-slate-800">{node.mitreTechniqueId}</span>
                      <span className="font-bold text-rose-400">P(Compromise): {node.compromiseProbability}%</span>
                    </div>
                  </div>

                  {index < attackPathGraph.nodes.length - 1 && (
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <ArrowRight className="w-6 h-6 text-rose-400" />
                      <span className="text-[10px] font-mono text-slate-400 mt-1">{attackPathGraph.edges[index]?.protocolPort}</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RISK SCORING TAB */}
      {activeTab === "risk_scoring" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" /> Multi-Factor Risk Score Calculator
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Asset Criticality Weight (0 - 10)</span>
                  <strong className="text-cyan-400">{assetCriticality}</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={assetCriticality}
                  onChange={(e) => {
                    setAssetCriticality(parseFloat(e.target.value));
                    handleCalculateRisk();
                  }}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Vulnerability CVSS v3.1 Score (0 - 10.0)</span>
                  <strong className="text-rose-400">{cvssScore}</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={cvssScore}
                  onChange={(e) => {
                    setCvssScore(parseFloat(e.target.value));
                    handleCalculateRisk();
                  }}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Threat Intelligence Confidence (0 - 100%)</span>
                  <strong className="text-amber-400">{threatIntelConfidence}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={threatIntelConfidence}
                  onChange={(e) => {
                    setThreatIntelConfidence(parseFloat(e.target.value));
                    handleCalculateRisk();
                  }}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>UEBA Anomaly Deviation Score (0 - 100)</span>
                  <strong className="text-indigo-400">{uebaAnomalyScore}</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={uebaAnomalyScore}
                  onChange={(e) => {
                    setUebaAnomalyScore(parseFloat(e.target.value));
                    handleCalculateRisk();
                  }}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-center items-center text-center space-y-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Composite Security Risk Score</span>
            <div className="text-6xl font-black text-rose-400 drop-shadow-[0_0_25px_rgba(244,63,94,0.4)]">
              {calculatedRiskScore} / 100
            </div>
            <p className="text-xs text-slate-300 max-w-md">
              Score calculated via: Risk = (Criticality × 2.5) + (CVSS × 3.5) + (ThreatIntel × 0.25) + (UEBA × 0.15)
            </p>
          </div>
        </div>
      )}

      {/* THREAT HUNTING TAB */}
      {activeTab === "threat_hunting" && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-rose-400" /> AWM-QL Threat Hunting Query Console
            </h2>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={awmQlQuery}
                onChange={(e) => setAwmQlQuery(e.target.value)}
                placeholder="event.category == 'malware' AND threat.score >= 80"
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-cyan-300 focus:border-cyan-500"
              />
              <button
                onClick={handleExecuteThreatHunt}
                disabled={huntingExecuting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
              >
                <Play className="w-4 h-4" /> {huntingExecuting ? "Hunting..." : "Execute AWM-QL Hunt"}
              </button>
            </div>
          </div>

          {huntResults && (
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div>
                  <span className="text-xs font-bold text-rose-400">Hunt Query ID: {huntResults.queryId}</span>
                  <h3 className="font-bold text-white text-base">Threat Group Match: {huntResults.threatGroupMatch || "Unknown Adversary"}</h3>
                </div>
                <span className="text-xs text-slate-400">Matched Events: <strong className="text-emerald-400">{huntResults.matchedEventsCount}</strong></span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Matched Telemetry Log Records:</h4>
                <div className="space-y-2">
                  {huntResults.matchedLogs.map((log: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-cyan-300 font-bold">{log.host}</span>
                          <span className="text-slate-400">({log.source})</span>
                        </div>
                        <p className="text-slate-200">{log.eventSummary}</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                        Confidence {log.confidenceScore}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
