import React, { useState } from "react";
import logo from "../../assets/logo.jpg";
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  Server,
  Filter,
  Search,
  ExternalLink,
  Play,
  Bot,
  Zap,
  Globe2,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Cpu,
  Radio,
  FileCode2,
} from "lucide-react";
import { Alert, Severity, AlertStatus, ActiveTab } from "../../types";

interface ExecutiveDashboardViewProps {
  alerts: Alert[];
  onUpdateAlertStatus: (id: string, status: AlertStatus) => void;
  onExecutePlaybookForAlert: (alert: Alert) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedAlertForCopilot?: (alert: Alert) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  alerts,
  onUpdateAlertStatus,
  onExecutePlaybookForAlert,
  setActiveTab,
  setSelectedAlertForCopilot,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const criticalCount = alerts.filter((a) => a.severity === "Critical").length;
  const highCount = alerts.filter((a) => a.severity === "High").length;
  const investigatingCount = alerts.filter((a) => a.status === "Investigating").length;
  const mitigatedCount = alerts.filter((a) => a.status === "Mitigated").length;

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSev = filterSeverity === "All" || alert.severity === filterSeverity;
    const matchesCat = filterCategory === "All" || alert.category === filterCategory;
    const matchesQuery =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.sourceIp.includes(searchQuery) ||
      (alert.user && alert.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
      alert.device.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesCat && matchesQuery;
  });

  // Simulated Global Threat Origins
  const threatOrigins = [
    { country: "Russia (Tor Exit Nodes)", count: 420, percent: "42%", ip: "185.220.101.5 / 101.9", threatLevel: "High" },
    { country: "China (APT41 Subnet)", count: 280, percent: "28%", ip: "103.251.140.2", threatLevel: "Critical" },
    { country: "North Korea (Lazarus C2)", count: 190, percent: "19%", ip: "194.165.16.81", threatLevel: "Critical" },
    { country: "Unknown Anonymous Proxies", count: 110, percent: "11%", ip: "45.154.255.80", threatLevel: "Medium" },
  ];

  // Sensor Health Status
  const sensors = [
    { name: "NIDS Sensor #1 (Core Network)", type: "Network Packet Inspector", status: "Online", latency: "1.2ms", eventsSec: 4250 },
    { name: "HIDS Endpoint Guard Cluster", type: "Agent Fleet (1,420 Nodes)", status: "Online", latency: "3.8ms", eventsSec: 8900 },
    { name: "SIEM Syslog Collector", type: "Elastic/Kafka Pipeline", status: "Online", latency: "0.8ms", eventsSec: 12400 },
    { name: "AWS CloudTrail Connector", type: "Cloud Audit Stream", status: "Online", latency: "12ms", eventsSec: 180 },
  ];

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Enterprise Title & Subtitle Landing Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-16 flex items-center justify-center shrink-0">
              <img
                src={logo}
                alt="AWM Cybersecurity Official Logo"
                className="w-full h-full object-contain filter drop-shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
                  AWM Cyber AI XDR
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  SOC Live Defense Active
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
                AWM AI SOC <span className="text-cyan-400">SENIOR</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-medium mt-1">
                Autonomous AI Cyber Security Operations Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("soc_command")}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              Unified SOC Command
            </button>
            <button
              onClick={() => setActiveTab("copilot")}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-xs rounded-xl transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              AWM AI Assistant
            </button>
          </div>
        </div>
      </div>

      {/* 9 Required Display Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-3">
        {/* 1. Active Threats */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 shadow-xl shadow-black/40 flex flex-col justify-between hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Threats</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-400">{criticalCount + highCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">{criticalCount} Critical / {highCount} High</p>
          </div>
        </div>

        {/* 2. AI Risk Score */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 shadow-xl shadow-black/40 flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">AI Risk Score</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-400">78 / 100</div>
            <p className="text-[10px] text-amber-300/80 mt-0.5">Elevated Risk State</p>
          </div>
        </div>

        {/* 3. Security Events */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 shadow-xl shadow-black/40 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Security Events</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-cyan-400">25.7k/s</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time Stream</p>
          </div>
        </div>

        {/* 4. Autonomous Responses */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 shadow-xl shadow-black/40 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Autonomous Responses</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-400">{mitigatedCount + 18}</div>
            <p className="text-[10px] text-emerald-300/80 mt-0.5">Auto-SOAR Executed</p>
          </div>
        </div>

        {/* 5. Pending SOC Approvals */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 shadow-xl shadow-black/40 flex flex-col justify-between hover:border-amber-300/30 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-300" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-300">2</div>
            <p className="text-[10px] text-slate-400 mt-0.5">High-Impact Isolation</p>
          </div>
        </div>

        {/* 6. Blocked Assets */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 shadow-xl shadow-black/40 flex flex-col justify-between hover:border-rose-400/30 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Blocked Assets</span>
            <Lock className="w-4 h-4 text-rose-300" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-300">14</div>
            <p className="text-[10px] text-slate-400 mt-0.5">IPs & Hosts Isolated</p>
          </div>
        </div>

        {/* 7. Threat Intelligence */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 shadow-xl shadow-black/40 flex flex-col justify-between hover:border-indigo-400/30 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Threat Intel</span>
            <Globe2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-indigo-400">14.2k</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Active Sync'd IOCs</p>
          </div>
        </div>

        {/* 8. Endpoint Status */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 shadow-xl shadow-black/40 flex flex-col justify-between hover:border-blue-400/30 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Endpoint Status</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-blue-400">1,420</div>
            <p className="text-[10px] text-emerald-400 mt-0.5">100% Guarded</p>
          </div>
        </div>

        {/* 9. AI Assistant Status */}
        <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3.5 shadow-xl shadow-black/40 flex flex-col justify-between hover:border-cyan-400/30 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">AI Assistant Status</span>
            <Bot className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="mt-2">
            <div className="text-xs font-black text-emerald-400 uppercase tracking-wide">ONLINE</div>
            <p className="text-[10px] text-slate-300 mt-0.5">AWM AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Alerts Feed + Threat Radar & Sensor Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Real-Time Alerts Stream */}
        <div className="lg:col-span-2 bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 shadow-xl shadow-black/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400 animate-pulse" />
              <h2 className="font-bold text-base text-slate-100">
                Real-Time Incident Stream & Security Alerts
              </h2>
              <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 text-xs font-extrabold rounded-full border border-rose-500/30">
                {filteredAlerts.length} Active
              </span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter IP, host, user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-44"
                />
              </div>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Alerts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/50 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Severity & ID</th>
                  <th className="py-2.5 px-3">Alert Title & MITRE</th>
                  <th className="py-2.5 px-3">Source IP & Host</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                      No active security alerts match your current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              alert.severity === "Critical"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                : alert.severity === "High"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <p className="text-[10px] font-mono text-slate-400">{alert.id}</p>
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top max-w-xs">
                        <p className="font-semibold text-slate-100">{alert.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{alert.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-cyan-400 font-mono">
                            {alert.mitreTechniqueId}: {alert.mitreTechnique}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top font-mono text-[11px]">
                        <p className="text-rose-300">{alert.sourceIp}</p>
                        <p className="text-slate-400 text-[10px]">{alert.device}</p>
                        {alert.user && <p className="text-indigo-300 text-[10px]">{alert.user}</p>}
                      </td>

                      <td className="py-3 px-3 align-top">
                        <select
                          value={alert.status}
                          onChange={(e) => onUpdateAlertStatus(alert.id, e.target.value as AlertStatus)}
                          className={`bg-slate-950 border text-[11px] font-semibold px-2 py-1 rounded focus:outline-none cursor-pointer ${
                            alert.status === "Mitigated"
                              ? "text-emerald-400 border-emerald-500/40"
                              : alert.status === "Investigating"
                              ? "text-amber-400 border-amber-500/40"
                              : alert.status === "Escalated"
                              ? "text-rose-400 border-rose-500/40"
                              : "text-slate-300 border-slate-700"
                          }`}
                        >
                          <option value="Unassigned">Unassigned</option>
                          <option value="Investigating">Investigating</option>
                          <option value="Mitigated">Mitigated</option>
                          <option value="Escalated">Escalated</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Run SOAR Playbook */}
                          <button
                            onClick={() => onExecutePlaybookForAlert(alert)}
                            className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded"
                            title="Execute SOAR Containment Playbook"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          {/* Copilot Investigate */}
                          <button
                            onClick={() => {
                              if (setSelectedAlertForCopilot) setSelectedAlertForCopilot(alert);
                              setActiveTab("copilot");
                            }}
                            className="p-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 rounded"
                            title="Analyze in AWM AI Assistant"
                          >
                            <Bot className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Threat Radar & Sensor Health */}
        <div className="space-y-6">
          {/* Global Threat Origins */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 shadow-xl shadow-black/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-cyan-400" /> Attack Origin Radar
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">BGP Telemetry</span>
            </div>

            <div className="space-y-2.5">
              {threatOrigins.map((origin, i) => (
                <div key={i} className="p-2.5 bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{origin.country}</span>
                    <span className="font-mono text-rose-400 font-bold">{origin.percent}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: origin.percent }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>IP Range: {origin.ip}</span>
                    <span>{origin.count} hits</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sensor Health Monitor */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 shadow-xl shadow-black/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" /> Sensor & Pipeline Health
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono">ALL OPERATIONAL</span>
            </div>

            <div className="space-y-2">
              {sensors.map((sensor, i) => (
                <div key={i} className="p-2.5 bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-200">{sensor.name}</p>
                    <p className="text-[10px] text-slate-400">{sensor.type}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                      {sensor.status}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {sensor.eventsSec} ev/s ({sensor.latency})
                    </p>
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
