import React, { useState, useEffect } from "react";
import {
  Workflow,
  Play,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  RefreshCw,
  Plus,
  ShieldAlert,
  Server,
  Bell,
  Lock,
  UserCheck,
  AlertTriangle,
  FolderKanban,
  FileText,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  Activity,
  Filter,
} from "lucide-react";
import { SoarPlaybook, SoarIncident, SoarExecution, SoarApproval } from "../../server/soarEngine";

export const SoarPlaybooksView: React.FC = () => {
  const [playbooks, setPlaybooks] = useState<SoarPlaybook[]>([]);
  const [incidents, setIncidents] = useState<SoarIncident[]>([]);
  const [executions, setExecutions] = useState<SoarExecution[]>([]);
  const [approvals, setApprovals] = useState<SoarApproval[]>([]);
  const [stats, setStats] = useState<{
    playbooksCount: number;
    incidentsCount: number;
    pendingApprovals: number;
    totalExecutions: number;
    blockedIpsCount: number;
    successRate: number;
  }>({
    playbooksCount: 0,
    incidentsCount: 0,
    pendingApprovals: 0,
    totalExecutions: 0,
    blockedIpsCount: 0,
    successRate: 100,
  });

  const [selectedPlaybook, setSelectedPlaybook] = useState<SoarPlaybook | null>(null);
  const [scenarioInput, setScenarioInput] = useState<string>("Active Directory Golden Ticket & Kerberoasting");
  const [targetAssetInput, setTargetAssetInput] = useState<string>("Domain Controller Cluster DC01");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaybook, setGeneratedPlaybook] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"playbooks" | "cases" | "executions" | "approvals">("playbooks");
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  // Fetch SOAR data
  const fetchSoarData = async () => {
    try {
      const [pRes, iRes, eRes, aRes, sRes] = await Promise.all([
        fetch("/api/soar/playbooks"),
        fetch("/api/soar/incidents"),
        fetch("/api/soar/executions"),
        fetch("/api/soar/approvals"),
        fetch("/api/soar/stats"),
      ]);

      if (pRes.ok) {
        const pData: SoarPlaybook[] = await pRes.json();
        setPlaybooks(pData);
        if (!selectedPlaybook && pData.length > 0) {
          setSelectedPlaybook(pData[0]);
        }
      }

      if (iRes.ok) {
        const iData: SoarIncident[] = await iRes.json();
        setIncidents(iData);
      }

      if (eRes.ok) {
        const eData: SoarExecution[] = await eRes.json();
        setExecutions(eData);
      }

      if (aRes.ok) {
        const aData: SoarApproval[] = await aRes.json();
        setApprovals(aData);
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        setStats(sData);
      }
    } catch (err) {
      console.warn("SOAR View fetch warning:", err);
    }
  };

  useEffect(() => {
    fetchSoarData();
    const interval = setInterval(fetchSoarData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Run Playbook
  const handleRunPlaybook = async (playbookId: string) => {
    try {
      setExecutionMessage(`Triggering playbook ${playbookId}...`);
      const res = await fetch(`/api/soar/playbooks/${playbookId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId: "EP-WIN-DC01", ip: "185.220.101.5", userId: "USR-ADMIN-01" }),
      });
      if (res.ok) {
        const data = await res.json();
        setExecutionMessage(`Playbook execution ${data.execution.id} started successfully.`);
        fetchSoarData();
      }
      setTimeout(() => setExecutionMessage(null), 4000);
    } catch (err) {
      setExecutionMessage("Failed to execute playbook");
    }
  };

  // Decide Approval
  const handleDecideApproval = async (approvalId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/soar/approvals/${approvalId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, approver: "SOC_LEAD_ANALYST" }),
      });
      if (res.ok) {
        fetchSoarData();
      }
    } catch (err) {
      console.error("Failed to process approval", err);
    }
  };

  // AI Generate Playbook
  const handleAiGeneratePlaybook = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/soar/generate-playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threatScenario: scenarioInput,
          targetAsset: targetAssetInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPlaybook(data);
      }
    } catch (err) {
      console.error("Playbook generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert Generated Playbook to Active
  const handleSaveGeneratedPlaybook = async () => {
    if (!generatedPlaybook) return;
    try {
      const res = await fetch("/api/soar/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generatedPlaybook.name,
          description: generatedPlaybook.description,
          trigger_type: generatedPlaybook.trigger || "SIEM_ALERT",
          triggerCategory: "AI Synthesized Playbook",
          is_active: true,
          steps: generatedPlaybook.steps?.map((s: any) => ({
            step: s.step,
            name: s.name,
            action: s.action || "CREATE_TICKET",
            target: "INFRASTRUCTURE_TARGET",
          })),
        }),
      });
      if (res.ok) {
        setGeneratedPlaybook(null);
        fetchSoarData();
      }
    } catch (err) {
      console.error("Failed to save playbook", err);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 bg-slate-950 text-slate-100 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-slate-100 flex items-center gap-2">
              SOAR Automation & Orchestration Engine
              <span className="text-xs px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono rounded-full border border-indigo-500/30">
                Playbook Engine v2.4
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous Incident Containment, Firewall Blacklisting, EDR Host Isolation, and SAML Token Revocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg font-mono">
            SOAR Containment Rate: 100%
          </span>
          <button
            onClick={fetchSoarData}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh SOAR Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {executionMessage && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 animate-pulse">
          <Activity className="w-4 h-4 text-indigo-400" />
          {executionMessage}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Playbooks</span>
            <Workflow className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.playbooksCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Enterprise Automation Workflows</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Incidents</span>
            <FolderKanban className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{stats.incidentsCount}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">SOAR Case Management</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pending Approvals</span>
            <Bell className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2">{stats.pendingApprovals}</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Human-in-the-Loop Gates</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Playbook Executions</span>
            <Play className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{stats.totalExecutions}</div>
          <div className="text-[11px] text-slate-500 mt-1">Automated Containments Run</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Blacklisted IPs</span>
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{stats.blockedIpsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Edge Firewall Active Blocks</div>
        </div>
      </div>

      {/* AI Playbook Synthesizer Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" /> AI Playbook Synthesizer (AWM AI Engine)
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Specify Threat Scenario (e.g. 'Golden Ticket Attack', 'S3 Bucket Exfiltration')..."
            value={scenarioInput}
            onChange={(e) => setScenarioInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 min-w-[240px]"
          />
          <input
            type="text"
            placeholder="Target Asset (e.g. 'Domain Controller DC01')..."
            value={targetAssetInput}
            onChange={(e) => setTargetAssetInput(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 w-[200px]"
          />
          <button
            onClick={handleAiGeneratePlaybook}
            disabled={isGenerating}
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 text-white shadow-md cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
            {isGenerating ? "Synthesizing Playbook..." : "Synthesize AI Playbook"}
          </button>
        </div>

        {generatedPlaybook && (
          <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-cyan-300 text-sm">{generatedPlaybook.name}</p>
                <p className="text-slate-400">{generatedPlaybook.description}</p>
              </div>
              <button
                onClick={handleSaveGeneratedPlaybook}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Save to Repository
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              {generatedPlaybook.steps?.map((step: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                    {step.step}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-200">{step.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main View Tabs */}
      <div className="flex border-b border-slate-800 text-sm font-medium">
        <button
          onClick={() => setActiveTab("playbooks")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "playbooks"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Workflow className="w-4 h-4" /> Playbook Repository ({playbooks.length})
        </button>
        <button
          onClick={() => setActiveTab("cases")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "cases"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FolderKanban className="w-4 h-4" /> Incident Cases ({incidents.length})
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "approvals"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bell className="w-4 h-4" /> Approval Gates ({approvals.length})
        </button>
        <button
          onClick={() => setActiveTab("executions")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "executions"
              ? "border-indigo-500 text-indigo-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="w-4 h-4" /> Execution Log
        </button>
      </div>

      {/* TAB 1: Playbooks List & Interactive Workflow Step Editor */}
      {activeTab === "playbooks" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Playbook List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
              <Workflow className="w-4 h-4 text-indigo-400" /> Active Enterprise Playbooks
            </h3>

            <div className="space-y-3">
              {playbooks.map((pb) => (
                <div
                  key={pb.id}
                  onClick={() => setSelectedPlaybook(pb)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedPlaybook?.id === pb.id
                      ? "bg-indigo-950/40 border-indigo-500 text-indigo-100"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-sm text-slate-100">{pb.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunPlaybook(pb.id);
                      }}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" /> Run
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{pb.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-3">
                    <span>Trigger: {pb.trigger_type}</span>
                    <span>Runs: {pb.total_runs}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Playbook Step Flow */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            {selectedPlaybook ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{selectedPlaybook.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">ID: {selectedPlaybook.id}</p>
                  </div>
                  <button
                    onClick={() => handleRunPlaybook(selectedPlaybook.id)}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Execute Playbook Flow
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedPlaybook.steps.map((step) => (
                    <div key={step.step} className="relative flex items-start gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-extrabold flex items-center justify-center shrink-0">
                        {step.step}
                      </div>

                      <div className="flex-1 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-100">{step.name}</h4>
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold rounded">
                            {step.action}
                          </span>
                        </div>
                        <p className="text-slate-400">Target Parameter: <span className="font-mono text-cyan-400">{step.target}</span></p>
                        {step.require_approval && (
                          <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5 pt-1">
                            <Bell className="w-3.5 h-3.5 text-amber-400" /> Human-in-the-Loop Approval Required before action execution
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">Select a playbook to inspect workflow steps</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Incident Case Management Console */}
      {activeTab === "cases" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              Active Incident Cases
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{inc.title}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{inc.id} • Source: {inc.source_module}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      inc.severity === "CRITICAL" ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    }`}>
                      {inc.severity}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300">
                    <div className="font-semibold text-slate-400 text-[11px]">Evidence & Attributes:</div>
                    {inc.evidence.map((ev, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="text-slate-500">{ev.key}:</span>
                        <span className="font-mono text-cyan-300">{ev.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Timeline Events: {inc.timeline.length} records logged
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Human-in-the-Loop Approvals */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-400" />
              Pending Containment Action Approval Gates
            </h2>

            {approvals.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 border border-slate-800 rounded-xl">
                No pending containment approvals require analyst intervention at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map((appr) => (
                  <div key={appr.id} className="p-4 bg-slate-950 border border-purple-500/40 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-white flex items-center gap-2">
                        {appr.step_name}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                          {appr.required_role}
                        </span>
                      </div>
                      <p className="text-slate-300">Playbook: {appr.playbook_name}</p>
                      <p className="text-slate-400">Target Asset: <span className="font-mono text-cyan-400">{appr.target}</span></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecideApproval(appr.id, "APPROVED")}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Check className="w-4 h-4" /> Approve Execution
                      </button>
                      <button
                        onClick={() => handleDecideApproval(appr.id, "REJECTED")}
                        className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Execution Log */}
      {activeTab === "executions" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Execution ID</th>
                  <th className="py-3 px-4">Playbook Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Steps Executed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {executions.map((exec) => (
                  <tr key={exec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(exec.started_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-300">{exec.id}</td>
                    <td className="py-3 px-4 font-semibold text-white">{exec.playbook_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        exec.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-300"
                      }`}>
                        {exec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{exec.step_results.length} steps logged</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
