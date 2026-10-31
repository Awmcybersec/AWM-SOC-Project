import React, { useState } from "react";
import {
  Search,
  Terminal,
  Clock,
  Play,
  Save,
  Code2,
  Sparkles,
  FileCode,
  History,
  CheckCircle2,
  Copy,
  Plus,
  Zap,
  Filter,
} from "lucide-react";

interface SavedQuery {
  id: string;
  name: string;
  category: string;
  awmql: string;
  schedule: "15_MIN" | "1_HOUR" | "DAILY" | "MANUAL";
  lastRun: string;
  matchesFound: number;
}

export const AdvancedThreatHuntingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"CONSOLE" | "SAVED" | "RULE_GENERATOR" | "TIMELINE">("CONSOLE");
  const [awmqlQuery, setAwmqlQuery] = useState<string>(
    "FIND logs WHERE process == 'powershell.exe' AND command_line CONTAINS '-EncodedCommand' AND user == 'SYSTEM'"
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [generatedRule, setGeneratedRule] = useState<string | null>(null);
  const [ruleType, setRuleType] = useState<"SIGMA" | "YARA">("SIGMA");
  const [copiedRule, setCopiedRule] = useState<boolean>(false);

  const savedQueries: SavedQuery[] = [
    {
      id: "HUNT-101",
      name: "Encoded PowerShell Process Execution",
      category: "Execution",
      awmql: "FIND logs WHERE process == 'powershell.exe' AND command_line CONTAINS '-EncodedCommand'",
      schedule: "15_MIN",
      lastRun: new Date(Date.now() - 60000 * 10).toISOString(),
      matchesFound: 4,
    },
    {
      id: "HUNT-102",
      name: "LSASS Process Memory Dump (lsass.exe)",
      category: "Credential Access",
      awmql: "FIND logs WHERE target_process == 'lsass.exe' AND granted_access CONTAINS '0x1010'",
      schedule: "1_HOUR",
      lastRun: new Date(Date.now() - 60000 * 45).toISOString(),
      matchesFound: 1,
    },
    {
      id: "HUNT-103",
      name: "Outbound Network Traffic on Non-Standard Port",
      category: "C2 Communication",
      awmql: "FIND logs WHERE log_type == 'firewall' AND dest_port IN (4444, 8443, 9001) AND action == 'ALLOW'",
      schedule: "DAILY",
      lastRun: new Date(Date.now() - 3600000 * 6).toISOString(),
      matchesFound: 12,
    },
  ];

  const handleExecuteQuery = () => {
    setIsExecuting(true);
    setQueryResults(null);
    setTimeout(() => {
      setQueryResults([
        {
          id: "EVT-8921",
          timestamp: new Date(Date.now() - 60000 * 3).toISOString(),
          host: "DC01.CORP.INTERNAL",
          user: "NT AUTHORITY\\SYSTEM",
          process: "powershell.exe",
          commandLine: "powershell.exe -NoP -NonI -W Hidden -Enc JABzA...==",
          riskScore: 95,
        },
        {
          id: "EVT-8920",
          timestamp: new Date(Date.now() - 60000 * 14).toISOString(),
          host: "WORKSTATION-SEC-04",
          user: "CORP\\jdoe",
          process: "powershell.exe",
          commandLine: "powershell.exe -ExecutionPolicy Bypass -EncodedCommand SQBFAFgA...",
          riskScore: 88,
        },
      ]);
      setIsExecuting(false);
    }, 800);
  };

  const handleGenerateDetectionRule = () => {
    if (ruleType === "SIGMA") {
      setGeneratedRule(`title: Suspicious Encoded PowerShell Execution
id: ${Math.random().toString(36).substring(2, 10)}-sigma-rule
status: experimental
description: Detects encoded powershell command line execution mapped via AWM-QL threat hunt.
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\powershell.exe'
    CommandLine|contains:
      - '-EncodedCommand'
      - '-enc'
  condition: selection
falsepositives:
  - Administrative deployment scripts
level: high`);
    } else {
      setGeneratedRule(`rule AWM_Encoded_PowerShell_Execution {
    meta:
        description = "Detects encoded PowerShell execution payload string"
        author = "AWM AI SOC Threat Hunter"
        date = "${new Date().toISOString().split("T")[0]}"
        hash = "e3b0c44298fc1c149afbf4c8996fb924"
    strings:
        $cmd1 = "-EncodedCommand" nocase
        $cmd2 = "powershell.exe" nocase
        $ps_magic = { 70 6F 77 65 72 73 68 65 6C 6C }
    condition:
        all of ($cmd*) or $ps_magic
}`);
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Advanced Threat Hunting Platform</h1>
            <p className="text-xs text-slate-400 mt-1">
              AWM-QL Query Engine, scheduled hunting playbooks, automated YARA/Sigma rule synthesis, and historical timeline investigation.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab("CONSOLE")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "CONSOLE"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> AWM-QL Console
          </button>
          <button
            onClick={() => setActiveTab("SAVED")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "SAVED"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Scheduled Hunts
          </button>
          <button
            onClick={() => setActiveTab("RULE_GENERATOR")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "RULE_GENERATOR"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Rule Synthesizer
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "CONSOLE" && (
        <div className="space-y-6">
          {/* AWM-QL Query Console Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono">
                <Terminal className="w-4 h-4 text-indigo-400" /> AWM-QL Expression Editor
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setAwmqlQuery(
                      "FIND logs WHERE log_type == 'syslog' AND message CONTAINS 'Failed password' GROUP BY source_ip HAVING COUNT > 10"
                    )
                  }
                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs rounded-lg transition-all font-mono"
                >
                  Template: Brute Force
                </button>
                <button
                  onClick={() =>
                    setAwmqlQuery(
                      "FIND logs WHERE process == 'cmd.exe' AND command_line CONTAINS 'net user /add'"
                    )
                  }
                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs rounded-lg transition-all font-mono"
                >
                  Template: Persistence
                </button>
              </div>
            </div>

            <textarea
              value={awmqlQuery}
              onChange={(e) => setAwmqlQuery(e.target.value)}
              rows={3}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500/60 leading-relaxed"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Syntax: FIND &lt;dataset&gt; WHERE &lt;condition&gt; [GROUP BY &lt;field&gt;] [LIMIT &lt;n&gt;]
              </span>
              <button
                onClick={handleExecuteQuery}
                disabled={isExecuting}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
              >
                {isExecuting ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Execute Threat Hunt
              </button>
            </div>
          </div>

          {/* Results Table */}
          {queryResults && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Hunt Results ({queryResults.length} matches)
                </h3>
                <span className="text-xs text-slate-400 font-mono">Execution time: 38ms</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                      <th className="p-3">ID</th>
                      <th className="p-3">TIMESTAMP</th>
                      <th className="p-3">HOST</th>
                      <th className="p-3">USER</th>
                      <th className="p-3">COMMAND LINE</th>
                      <th className="p-3 text-right">RISK SCORE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {queryResults.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-800/40 text-slate-300">
                        <td className="p-3 text-indigo-400 font-bold">{res.id}</td>
                        <td className="p-3 text-slate-400">{new Date(res.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 text-slate-200">{res.host}</td>
                        <td className="p-3 text-slate-300">{res.user}</td>
                        <td className="p-3 text-slate-400 max-w-xs truncate" title={res.commandLine}>
                          {res.commandLine}
                        </td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-bold">
                            {res.riskScore}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "SAVED" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-indigo-400" /> Scheduled Threat Hunting Catalog
          </h2>

          <div className="space-y-3">
            {savedQueries.map((sq) => (
              <div key={sq.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-400 font-bold">{sq.id}</span>
                    <h3 className="font-bold text-sm text-slate-100">{sq.name}</h3>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded font-mono">
                      {sq.category}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold rounded-lg font-mono">
                    Interval: {sq.schedule}
                  </span>
                </div>

                <p className="font-mono text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  {sq.awmql}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Last Run: {new Date(sq.lastRun).toLocaleTimeString()}</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    Matches Identified: {sq.matchesFound} events
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "RULE_GENERATOR" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Automated Detection Rule Synthesizer
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically convert hunt findings into production-ready Sigma or YARA rules.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-800 rounded-lg">
              <button
                onClick={() => setRuleType("SIGMA")}
                className={`px-3 py-1 text-xs font-bold rounded ${
                  ruleType === "SIGMA" ? "bg-purple-500 text-white" : "text-slate-400"
                }`}
              >
                Sigma Rule
              </button>
              <button
                onClick={() => setRuleType("YARA")}
                className={`px-3 py-1 text-xs font-bold rounded ${
                  ruleType === "YARA" ? "bg-purple-500 text-white" : "text-slate-400"
                }`}
              >
                YARA Rule
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGenerateDetectionRule}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
            >
              <Zap className="w-4 h-4" /> Synthesize Rule from Current Hunt
            </button>

            {generatedRule && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-mono">
                    Generated {ruleType} Manifest:
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedRule);
                      setCopiedRule(true);
                      setTimeout(() => setCopiedRule(false), 2000);
                    }}
                    className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg flex items-center gap-1 hover:border-slate-700 font-mono"
                  >
                    {copiedRule ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRule ? "Copied" : "Copy Manifest"}
                  </button>
                </div>

                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-purple-300 overflow-x-auto leading-relaxed">
                  {generatedRule}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
