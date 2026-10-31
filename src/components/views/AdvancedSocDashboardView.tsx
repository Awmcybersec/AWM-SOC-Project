// AWM AI SOC SENIOR - Advanced SOC Command Center Dashboard
// Features real-time threat monitoring, active incidents, attack timeline, posture gauge, risk heatmap, asset matrix, & AI recommendations.

import React, { useState } from "react";
import {
  ShieldAlert,
  Activity,
  Zap,
  TrendingUp,
  Server,
  Terminal,
  AlertTriangle,
  Play,
  Cpu,
  Layers,
  ArrowUpRight,
  Eye,
  BarChart2,
} from "lucide-react";
import { Alert, Incident, EnterpriseAsset } from "../../types";

interface AdvancedSocDashboardProps {
  alerts: Alert[];
  incidents: Incident[];
  assets: EnterpriseAsset[];
  onSelectTab: (tab: any) => void;
}

export const AdvancedSocDashboardView: React.FC<AdvancedSocDashboardProps> = ({
  alerts,
  incidents,
  assets,
  onSelectTab,
}) => {
  const [selectedAssetSegment, setSelectedAssetSegment] = useState<string>("ALL");
  const [recommendationExecuted, setRecommendationExecuted] = useState<string | null>(null);

  const activeIncidents = incidents.filter((i) => i.status !== "Closed");
  const criticalAlerts = alerts.filter((a) => a.severity === "Critical");
  const highAlerts = alerts.filter((a) => a.severity === "High");

  const executeRecommendation = (recId: string) => {
    setRecommendationExecuted(recId);
    setTimeout(() => {
      setRecommendationExecuted(null);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Posture Score Metric Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Security Posture Score
            </div>
            <div className="text-3xl font-bold text-emerald-400 flex items-baseline space-x-2">
              <span>88 / 100</span>
              <span className="text-xs text-emerald-500 flex items-center font-normal">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +4.2%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Autonomous Protection Enforced</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Activity className="w-7 h-7" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Active Incident Cases
            </div>
            <div className="text-3xl font-bold text-red-400 flex items-baseline space-x-2">
              <span>{activeIncidents.length} Cases</span>
              <span className="text-xs text-red-400 font-normal">2 Critical</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">MTTR: 4.8 min average</p>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Correlated SIEM Signals
            </div>
            <div className="text-3xl font-bold text-cyan-400 flex items-baseline space-x-2">
              <span>{alerts.length} Triggers</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {criticalAlerts.length} Crit | {highAlerts.length} High
            </p>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Zap className="w-7 h-7" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Monitored Assets
            </div>
            <div className="text-3xl font-bold text-amber-400 flex items-baseline space-x-2">
              <span>{assets.length || 1420} Nodes</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">100% Agent RPC Connected</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Server className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Main Grid: Active Incidents + AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents Overview (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-slate-100">Active Incident Lifecycle Matrix</h3>
            </div>
            <button
              onClick={() => onSelectTab("incident_response")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition flex items-center space-x-1"
            >
              <span>Manage All Incidents</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {incidents.slice(0, 3).map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {inc.id}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        inc.severity === "Critical"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : inc.severity === "High"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Status: <span className="text-slate-200">{inc.status}</span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Assignee: <span className="text-slate-300">{inc.assignee}</span>
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-200">{inc.title}</div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <span>Source: {inc.source}</span>
                    <span>•</span>
                    <span>Assets: {inc.affectedAssets.join(", ")}</span>
                  </div>
                  <button
                    onClick={() => onSelectTab("incident_response")}
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
                  >
                    <span>View Evidence ({inc.evidence.length})</span>
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">AI Threat Recommendations</h3>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Automated SOAR Action
                </span>
                <span className="text-xs text-slate-400">Blast Radius: Minimal</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Isolate host <code className="text-indigo-300 font-mono">WIN-DC01</code> and revoke Kerberos ticket TGT for account <code className="text-indigo-300 font-mono">CORP\svc_backup</code>.
              </p>
              <button
                onClick={() => executeRecommendation("REC-01")}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center justify-center space-x-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {recommendationExecuted === "REC-01" ? "Execution In Progress..." : "Approve & Execute via SOAR"}
                </span>
              </button>
            </div>

            <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Perimeter Firewall Block
                </span>
                <span className="text-xs text-slate-400">Confidence: 98%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Null-route C2 IP <code className="text-indigo-300 font-mono">185.220.101.5</code> across Palo Alto & Fortinet edge gateways.
              </p>
              <button
                onClick={() => executeRecommendation("REC-02")}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center space-x-2 border border-slate-700"
              >
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {recommendationExecuted === "REC-02" ? "Firewall Updated!" : "Apply Firewall Rule Mesh"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attack Timeline + Risk Heatmap Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Timeline Visualizer */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-slate-100">Live Attack Timeline Visualizer</h3>
            </div>
            <span className="text-xs text-cyan-400 font-mono">UTC Stream Active</span>
          </div>

          <div className="space-y-4 pl-4 border-l-2 border-slate-800">
            <div className="relative space-y-1">
              <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900" />
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-red-400 font-bold">14:22:10 UTC — LSASS Memory Dump</span>
                <span className="text-slate-500">Asset: WIN-DC01</span>
              </div>
              <p className="text-xs text-slate-300">
                Process <code className="text-red-300 font-mono">powershell.exe</code> injected into LSASS process memory space (T1003.001).
              </p>
            </div>

            <div className="relative space-y-1">
              <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-slate-900" />
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-orange-400 font-bold">14:23:45 UTC — Outbound C2 Handshake</span>
                <span className="text-slate-500">Source: WIN-DC01</span>
              </div>
              <p className="text-xs text-slate-300">
                TLS 1.3 session opened to malicious C2 IP <code className="text-orange-300 font-mono">185.220.101.5:443</code>.
              </p>
            </div>

            <div className="relative space-y-1">
              <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-400 font-bold">14:24:00 UTC — Autonomous Containment</span>
                <span className="text-slate-500">Engine: SOAR Driver</span>
              </div>
              <p className="text-xs text-slate-300">
                EDR network filter engaged. Endpoint isolated. C2 IP blocked on edge perimeter.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Heatmap & Asset Status */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-slate-100">Enterprise Risk Heatmap</h3>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setSelectedAssetSegment("ALL")}
                className={`px-2 py-1 rounded ${
                  selectedAssetSegment === "ALL" ? "bg-slate-800 text-amber-300" : "text-slate-400"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedAssetSegment("SERVERS")}
                className={`px-2 py-1 rounded ${
                  selectedAssetSegment === "SERVERS" ? "bg-slate-800 text-amber-300" : "text-slate-400"
                }`}
              >
                Domain Servers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-red-950/30 border border-red-500/30 space-y-1">
              <div className="text-xs text-red-400 font-bold uppercase tracking-wider">Active Directory Domain</div>
              <div className="text-2xl font-bold text-slate-100">Risk: 92/100</div>
              <p className="text-xs text-slate-400">2 Critical incidents active</p>
            </div>

            <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1">
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">Production Databases</div>
              <div className="text-2xl font-bold text-slate-100">Risk: 68/100</div>
              <p className="text-xs text-slate-400">1 Unpatched vulnerability</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">K8s Cloud Clusters</div>
              <div className="text-2xl font-bold text-slate-100">Risk: 24/100</div>
              <p className="text-xs text-slate-400">Normal operations</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">User Workstations</div>
              <div className="text-2xl font-bold text-slate-100">Risk: 18/100</div>
              <p className="text-xs text-slate-400">EDR Driver enforced</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
