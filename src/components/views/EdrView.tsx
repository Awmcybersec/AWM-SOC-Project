import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Laptop,
  Cpu,
  Terminal,
  FileCode2,
  Database,
  Lock,
  Unlock,
  Bot,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Radio,
  FileSearch,
  HardDrive
} from 'lucide-react';

interface Endpoint {
  id: string;
  hostname: string;
  os_name: string;
  platform: 'WINDOWS' | 'LINUX' | 'MACOS';
  ip_address: string;
  mac_address: string;
  agent_version: string;
  status: 'ONLINE' | 'OFFLINE' | 'ISOLATED' | 'DEGRADED';
  is_isolated: boolean;
  risk_score: number;
  last_seen: string;
  created_at: string;
  cpu_usage_pct: number;
  memory_usage_mb: number;
  health_score: number;
}

interface EdrProcess {
  id: string;
  endpoint_id: string;
  pid: number;
  ppid: number;
  process_name: string;
  process_path: string;
  command_line: string;
  user_account: string;
  hash_sha256: string;
  integrity_level: string;
  parent_process_name: string;
  is_suspicious: boolean;
  suspicious_reason?: string;
  timestamp: string;
}

interface FileEvent {
  id: string;
  endpoint_id: string;
  timestamp: string;
  event_type: 'CREATE' | 'MODIFY' | 'DELETE' | 'RENAME';
  file_path: string;
  file_hash: string;
  process_id: number;
  user_account: string;
  is_ransomware_activity: boolean;
}

interface RegistryEvent {
  id: string;
  endpoint_id: string;
  timestamp: string;
  action: 'SET_VALUE' | 'DELETE_KEY' | 'CREATE_KEY';
  hive: string;
  key_path: string;
  value_name: string;
  value_data: string;
  process_id: number;
  is_persistence_mechanism: boolean;
}

interface EdrAlert {
  id: string;
  endpoint_id: string;
  timestamp: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitre_tactic: string;
  mitre_technique: string;
  attack_procedure: string;
  status: 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'FALSE_POSITIVE';
}

interface ResponseAction {
  id: string;
  endpoint_id: string;
  action_type: string;
  status: string;
  initiated_by: string;
  result_summary: string;
  created_at: string;
}

interface EdrStats {
  totalEndpoints: number;
  onlineEndpoints: number;
  isolatedEndpoints: number;
  criticalAlerts: number;
  highAlerts: number;
  totalProcessesTracked: number;
  totalFileEventsTracked: number;
  totalMemoryDetections: number;
  averageHealthScore: number;
}

export const EdrView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'processes' | 'fim' | 'alerts' | 'copilot' | 'simulator'>('endpoints');
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [processes, setProcesses] = useState<EdrProcess[]>([]);
  const [fileEvents, setFileEvents] = useState<FileEvent[]>([]);
  const [registryEvents, setRegistryEvents] = useState<RegistryEvent[]>([]);
  const [alerts, setAlerts] = useState<EdrAlert[]>([]);
  const [responseActions, setResponseActions] = useState<ResponseAction[]>([]);
  const [stats, setStats] = useState<EdrStats | null>(null);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('EP-WIN-DC01');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [simulatingEvent, setSimulatingEvent] = useState(false);

  useEffect(() => {
    fetchEdrData();
    const interval = setInterval(fetchEdrData, 5000);
    return () => clearInterval(interval);
  }, [selectedEndpointId]);

  const fetchEdrData = async () => {
    try {
      const [epRes, procRes, fileRes, regRes, alertRes, actRes, statsRes] = await Promise.all([
        fetch('/api/edr/endpoints'),
        fetch(`/api/edr/processes?endpointId=${selectedEndpointId}`),
        fetch(`/api/edr/file-events?endpointId=${selectedEndpointId}`),
        fetch(`/api/edr/registry-events?endpointId=${selectedEndpointId}`),
        fetch('/api/edr/alerts'),
        fetch('/api/edr/response-actions'),
        fetch('/api/edr/stats'),
      ]);

      if (epRes.ok) setEndpoints(await epRes.json());
      if (procRes.ok) setProcesses(await procRes.json());
      if (fileRes.ok) setFileEvents(await fileRes.json());
      if (regRes.ok) setRegistryEvents(await regRes.json());
      if (alertRes.ok) setAlerts(await alertRes.json());
      if (actRes.ok) setResponseActions(await actRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching EDR data:', err);
    }
  };

  const handleIsolateEndpoint = async (endpointId: string, currentIsolated: boolean) => {
    try {
      const res = await fetch(`/api/edr/endpoints/${endpointId}/isolate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isolate: !currentIsolated }),
      });
      if (res.ok) {
        fetchEdrData();
      }
    } catch (err) {
      console.error('Error toggling endpoint isolation:', err);
    }
  };

  const handleExecuteResponseAction = async (actionType: string, pid?: number) => {
    try {
      const res = await fetch('/api/edr/response-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointId: selectedEndpointId,
          actionType,
          details: { pid },
        }),
      });
      if (res.ok) {
        fetchEdrData();
      }
    } catch (err) {
      console.error('Error executing response action:', err);
    }
  };

  const handleRunAiInvestigation = async () => {
    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      const res = await fetch('/api/edr/ai-investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId: selectedEndpointId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysisResult(data);
      }
    } catch (err) {
      console.error('AI Investigation failed:', err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleSimulateAttack = async (type: string) => {
    setSimulatingEvent(true);
    try {
      if (type === 'POWERSHELL') {
        await fetch('/api/edr/processes/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint_id: selectedEndpointId,
            process_name: 'powershell.exe',
            command_line: 'powershell.exe -e SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQ...',
            user_account: 'CORP\\Administrator',
            parent_process_name: 'cmd.exe',
          }),
        });
      } else if (type === 'RANSOMWARE') {
        await fetch('/api/edr/file-events/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint_id: selectedEndpointId,
            file_path: 'C:\\Users\\Admin\\Documents\\Databases_Backup.sql.locked',
            event_type: 'MODIFY',
            process_id: 3840,
            user_account: 'CORP\\Administrator',
          }),
        });
      } else if (type === 'REGISTRY') {
        await fetch('/api/edr/registry-events/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint_id: selectedEndpointId,
            hive: 'HKLM',
            key_path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Run',
            value_name: 'MaliciousUpdater',
            value_data: 'C:\\ProgramData\\Temp\\backdoor.exe',
          }),
        });
      }
      fetchEdrData();
    } catch (err) {
      console.error('Attack simulation failed:', err);
    } finally {
      setSimulatingEvent(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === 'WINDOWS') return <Laptop className="w-5 h-5 text-blue-500" />;
    if (platform === 'LINUX') return <Server className="w-5 h-5 text-amber-500" />;
    return <Cpu className="w-5 h-5 text-purple-500" />;
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">MEDIUM</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Endpoint Detection & Response (EDR) Engine</h1>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse" /> Active Protection
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Real-time Windows, Linux, and macOS endpoint agent telemetry, process trees, FIM, memory analysis, and remote containment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEdrData}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Total Endpoints</span>
            <Laptop className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{stats?.totalEndpoints || 3}</div>
          <p className="text-xs text-slate-500 mt-1">{stats?.onlineEndpoints || 3} Online Agents</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Isolated Hosts</span>
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{stats?.isolatedEndpoints || 0}</div>
          <p className="text-xs text-slate-500 mt-1">Network Contained</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Critical Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{stats?.criticalAlerts || 2}</div>
          <p className="text-xs text-slate-500 mt-1">Requiring SOC Action</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Active Processes</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-2">{stats?.totalProcessesTracked || 4}</div>
          <p className="text-xs text-slate-500 mt-1">Process Tree Tracked</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Agent Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{stats?.averageHealthScore || 98}%</div>
          <p className="text-xs text-slate-500 mt-1">Kernel Tamper-Proof</p>
        </div>
      </div>

      {/* Target Endpoint Selection & View Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
              activeTab === 'endpoints'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Laptop className="w-4 h-4" /> Endpoints Inventory
          </button>
          <button
            onClick={() => setActiveTab('processes')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
              activeTab === 'processes'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4" /> Process Tree Explorer
          </button>
          <button
            onClick={() => setActiveTab('fim')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
              activeTab === 'fim'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HardDrive className="w-4 h-4" /> FIM & Registry
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Threat Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
              activeTab === 'copilot'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> AWM AI Assistant Investigation
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4" /> Attack Simulator
          </button>
        </div>

        {/* Selected Endpoint Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Focus Target:</span>
          <select
            value={selectedEndpointId}
            onChange={(e) => setSelectedEndpointId(e.target.value)}
            className="px-3 py-1.5 text-sm bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {endpoints.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.hostname} ({ep.platform}) - Risk: {ep.risk_score}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: ENDPOINTS INVENTORY */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                onClick={() => setSelectedEndpointId(ep.id)}
                className={`p-5 rounded-xl border transition cursor-pointer ${
                  selectedEndpointId === ep.id
                    ? 'bg-slate-900 border-indigo-500/60 shadow-lg ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                      {getPlatformIcon(ep.platform)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">{ep.hostname}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{ep.os_name}</p>
                    </div>
                  </div>
                  {ep.is_isolated ? (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> ISOLATED
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ONLINE
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                  <div>IP: <span className="text-slate-200 font-mono">{ep.ip_address}</span></div>
                  <div>Agent: <span className="text-slate-200 font-mono">{ep.agent_version}</span></div>
                  <div>CPU: <span className="text-slate-200 font-mono">{ep.cpu_usage_pct}%</span></div>
                  <div>RAM: <span className="text-slate-200 font-mono">{ep.memory_usage_mb} MB</span></div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Risk Score:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        ep.risk_score > 70
                          ? 'bg-red-500/20 text-red-400'
                          : ep.risk_score > 40
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {ep.risk_score} / 100
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIsolateEndpoint(ep.id, ep.is_isolated);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5 ${
                      ep.is_isolated
                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border-red-500/30'
                    }`}
                  >
                    {ep.is_isolated ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> Restore Network
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Isolate Host
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Endpoint Agent Details & Response Actions History */}
          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Remote SOAR Response Actions Executed
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Action ID</th>
                    <th className="p-3">Endpoint ID</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Initiated By</th>
                    <th className="p-3">Result Summary</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {responseActions.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono text-indigo-400">{act.id}</td>
                      <td className="p-3 font-mono">{act.endpoint_id}</td>
                      <td className="p-3 font-semibold text-amber-400">{act.action_type}</td>
                      <td className="p-3">{act.initiated_by}</td>
                      <td className="p-3 text-slate-300">{act.result_summary}</td>
                      <td className="p-3 text-slate-500">{new Date(act.created_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROCESS TREE EXPLORER */}
      {activeTab === 'processes' && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" /> Real-time Process Hierarchy & Execution Tree
                </h3>
                <p className="text-xs text-slate-400">Inspecting process execution lineage on {selectedEndpointId}</p>
              </div>

              <button
                onClick={() => handleExecuteResponseAction('TERMINATE_PROCESS')}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-md transition flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Kill Suspicious Process Tree
              </button>
            </div>

            <div className="space-y-3">
              {processes.map((proc) => (
                <div
                  key={proc.id}
                  className={`p-4 rounded-xl border transition ${
                    proc.is_suspicious
                      ? 'bg-red-950/20 border-red-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg font-mono text-xs font-bold ${proc.is_suspicious ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                        PID: {proc.pid}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">{proc.process_name}</span>
                          <span className="text-xs text-slate-500">PPID: {proc.ppid} ({proc.parent_process_name})</span>
                          {proc.is_suspicious && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30">
                              SUSPICIOUS
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1 break-all bg-slate-900 p-2 rounded border border-slate-800">
                          {proc.command_line}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 md:mt-0">
                      <div>User: <span className="text-slate-200">{proc.user_account}</span></div>
                      <div>Token: <span className="text-slate-200">{proc.integrity_level}</span></div>
                      <button
                        onClick={() => handleExecuteResponseAction('TERMINATE_PROCESS', proc.pid)}
                        className="px-2.5 py-1 text-xs font-medium rounded bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 transition"
                      >
                        Terminate PID
                      </button>
                    </div>
                  </div>

                  {proc.suspicious_reason && (
                    <div className="mt-2 text-xs text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{proc.suspicious_reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FILE INTEGRITY MONITORING (FIM) & REGISTRY */}
      {activeTab === 'fim' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FIM File Events */}
          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-indigo-400" /> File Integrity Monitoring (FIM) & Ransomware Detection
            </h3>
            <div className="space-y-3">
              {fileEvents.map((fe) => (
                <div
                  key={fe.id}
                  className={`p-3.5 rounded-lg border text-xs ${
                    fe.is_ransomware_activity
                      ? 'bg-red-950/20 border-red-500/40 text-slate-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-400">{fe.event_type}</span>
                    <span className="text-slate-500 font-mono">{new Date(fe.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-mono mt-1 text-slate-200 break-all">{fe.file_path}</p>
                  {fe.is_ransomware_activity && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      BEHAVIORAL RANSOMWARE ENCRYPTION DETECTED
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Registry Persistence */}
          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <FileCode2 className="w-5 h-5 text-purple-400" /> Windows Registry Persistence Events
            </h3>
            <div className="space-y-3">
              {registryEvents.map((re) => (
                <div key={re.id} className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-purple-400 font-semibold">
                    <span>{re.hive}\\{re.value_name}</span>
                    <span className="text-slate-500 font-mono">{new Date(re.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-mono mt-1 text-slate-300 break-all">{re.key_path}</p>
                  <div className="mt-2 p-2 rounded bg-slate-900 font-mono text-slate-400 break-all">
                    Data: {re.value_data}
                  </div>
                  {re.is_persistence_mechanism && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      PERSISTENCE AUTORUN KEY
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: THREAT ALERTS & MITRE ATT&CK */}
      {activeTab === 'alerts' && (
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" /> EDR Endpoint Intrusion Alerts & MITRE ATT&CK TTP Mapping
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Alert ID</th>
                  <th className="p-3">Endpoint</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Alert Title</th>
                  <th className="p-3">MITRE Technique</th>
                  <th className="p-3">Attack Procedure</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alerts.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-indigo-400">{alt.id}</td>
                    <td className="p-3 font-mono">{alt.endpoint_id}</td>
                    <td className="p-3">{getSeverityBadge(alt.severity)}</td>
                    <td className="p-3 font-semibold text-slate-100">{alt.title}</td>
                    <td className="p-3 font-mono text-amber-400">{alt.mitre_technique}</td>
                    <td className="p-3 text-slate-400">{alt.attack_procedure}</td>
                    <td className="p-3 font-semibold text-emerald-400">{alt.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AI SECURITY COPILOT INVESTIGATION */}
      {activeTab === 'copilot' && (
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" /> AWM AI Endpoint Threat Investigation Engine
              </h3>
              <p className="text-xs text-slate-400">
                Analyzes process trees, FIM changes, memory injection events, and alert telemetry for target endpoint <span className="text-indigo-400 font-mono">{selectedEndpointId}</span>.
              </p>
            </div>

            <button
              onClick={handleRunAiInvestigation}
              disabled={isAiAnalyzing}
              className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isAiAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> AI Reasoning in Progress...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" /> Run AI Behavior Analysis
                </>
              )}
            </button>
          </div>

          {aiAnalysisResult && (
            <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    THREAT SCORE: {aiAnalysisResult.calculated_threat_score} / 100
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    Classification: {aiAnalysisResult.malware_classification}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Automated Summary</h4>
                <p className="text-sm text-slate-200 mt-1 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  {aiAnalysisResult.investigation_summary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MITRE ATT&CK Summary</h4>
                <p className="text-xs font-mono text-amber-300 mt-1">{aiAnalysisResult.mitre_summary}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recommended Automated SOAR Actions</h4>
                <ul className="mt-2 space-y-2">
                  {aiAnalysisResult.recommended_soar_actions?.map((act: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-200 bg-slate-900 p-2.5 rounded border border-slate-800">
                      <ChevronRight className="w-4 h-4 text-indigo-400" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: ATTACK SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Endpoint Attack Scenario Telemetry Simulator
          </h3>
          <p className="text-xs text-slate-400">
            Inject synthetic threat vectors into the target host <span className="text-indigo-400 font-mono">{selectedEndpointId}</span> to test real-time detection, rules evaluation, and SIEM correlation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> PowerShell Obfuscation
              </h4>
              <p className="text-xs text-slate-400">Infect host with Base64 encoded execution command</p>
              <button
                onClick={() => handleSimulateAttack('POWERSHELL')}
                disabled={simulatingEvent}
                className="w-full py-2 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-500 text-white transition"
              >
                Inject PowerShell Event
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" /> Ransomware (.locked)
              </h4>
              <p className="text-xs text-slate-400">Simulate mass rapid file modification & encryption extension</p>
              <button
                onClick={() => handleSimulateAttack('RANSOMWARE')}
                disabled={simulatingEvent}
                className="w-full py-2 text-xs font-medium rounded bg-red-600 hover:bg-red-500 text-white transition"
              >
                Inject Ransomware FIM Event
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-purple-400" /> Registry Autorun
              </h4>
              <p className="text-xs text-slate-400">Inject persistence key in HKLM\\...\\CurrentVersion\\Run</p>
              <button
                onClick={() => handleSimulateAttack('REGISTRY')}
                disabled={simulatingEvent}
                className="w-full py-2 text-xs font-medium rounded bg-purple-600 hover:bg-purple-500 text-white transition"
              >
                Inject Registry Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
