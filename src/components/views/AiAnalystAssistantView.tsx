// AWM AI SOC SENIOR - AI SOC Analyst Assistant View
// Specialized Cybersecurity AI Workbench powered 

import React, { useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  FileText,
  ShieldAlert,
  Terminal,
  Send,
  Copy,
  Check,
  Zap,
  Cpu,
  Layers,
} from "lucide-react";

export const AiAnalystAssistantView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"explain" | "summarize" | "report">("explain");

  // Explain Threat State
  const [threatTitle, setThreatTitle] = useState<string>("LSASS Process Injection & Memory Dump");
  const [threatLog, setThreatLog] = useState<string>(
    `{"EventID": 4688, "Process": "powershell.exe", "CommandLine": "powershell.exe -nop -w hidden -encodedcommand SQBFAFgA...", "TargetProcess": "lsass.exe", "Host": "WIN-DC01"}`
  );
  const [explanationResult, setExplanationResult] = useState<any>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  // Summarize Incident State
  const [incidentJson, setIncidentJson] = useState<string>(
    JSON.stringify(
      {
        id: "INC-2026-8801",
        title: "Ransomware Pre-Execution & Process Injection on WIN-DC01",
        severity: "Critical",
        affectedAssets: ["WIN-DC01", "SQL-PROD-02"],
        source: "EDR + SIEM Correlation",
      },
      null,
      2
    )
  );
  const [summaryResult, setSummaryResult] = useState<any>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  // Investigation Report State
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleExplainThreat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExplaining(true);
    try {
      const res = await fetch("/api/ai-analyst/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: threatTitle,
          rawLog: threatLog,
          severity: "Critical",
        }),
      });

      if (res.ok) {
        setExplanationResult(await res.json());
      }
    } catch (err) {
      console.warn("Explain threat error:", err);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSummarizeIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSummarizing(true);
    try {
      const parsed = JSON.parse(incidentJson);
      const res = await fetch("/api/ai-analyst/summarize-incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (res.ok) {
        setSummaryResult(await res.json());
      }
    } catch (err) {
      console.warn("Summarize incident error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const parsed = JSON.parse(incidentJson);
      const res = await fetch("/api/ai-analyst/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (res.ok) {
        const data = await res.json();
        setReportMarkdown(data.reportMarkdown);
      }
    } catch (err) {
      console.warn("Generate report error:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const copyReportToClipboard = () => {
    if (!reportMarkdown) return;
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>AI SOC Security Analyst Assistant</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                   Real Time
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Autonomous Threat Explainer, CISO Incident Summarizer, & Formal Report Generator
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("explain")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "explain" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Threat Explainer
          </button>
          <button
            onClick={() => setActiveTab("summarize")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "summarize" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            CISO Summarizer
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "report" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Investigation Report
          </button>
        </div>
      </div>

      {/* Tab 1: Threat Explainer */}
      {activeTab === "explain" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-slate-100">Submit Security Event for AI Deep Analysis</h3>
            </div>

            <form onSubmit={handleExplainThreat} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Threat Context / Title</label>
                <input
                  type="text"
                  value={threatTitle}
                  onChange={(e) => setThreatTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Raw Security Log / Telemetry JSON</label>
                <textarea
                  rows={6}
                  value={threatLog}
                  onChange={(e) => setThreatLog(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isExplaining}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded transition flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>{isExplaining ? "AWM Reasoning in Progress..." : "Execute AI Threat Explanation"}</span>
              </button>
            </form>
          </div>

          {/* Result Output */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100">AI Explanation Output</h3>
            </div>

            {explanationResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                    Technical Attack Vector
                  </div>
                  <p className="text-slate-200 leading-relaxed">{explanationResult.explanation}</p>
                </div>

                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-red-400 uppercase tracking-wider text-[10px]">
                    Risk Assessment & Blast Radius
                  </div>
                  <p className="text-slate-300">{explanationResult.riskAssessment}</p>
                </div>

                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    MITRE ATT&CK Matrix Mapping
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {explanationResult.mitreTechniques?.map((t: string) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                    Recommended Action Steps
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {explanationResult.recommendedActions?.map((act: string, idx: number) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                Submit a threat query on the left to see AWM AI reasoning output.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: CISO Summarizer */}
      {activeTab === "summarize" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100">Input Incident JSON Payload</h3>
            </div>

            <form onSubmit={handleSummarizeIncident} className="space-y-4 text-xs">
              <textarea
                rows={12}
                value={incidentJson}
                onChange={(e) => setIncidentJson(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono focus:outline-none"
              />

              <button
                type="submit"
                disabled={isSummarizing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded transition flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>{isSummarizing ? "Compiling CISO Briefing..." : "Generate Executive Briefing"}</span>
              </button>
            </form>
          </div>

          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100">CISO Briefing Summary</h3>
            </div>

            {summaryResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    CISO Executive Summary
                  </div>
                  <p className="text-slate-200 leading-relaxed">{summaryResult.executiveSummary}</p>
                </div>

                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Technical Root Cause
                  </div>
                  <p className="text-slate-300">{summaryResult.technicalRootCause}</p>
                </div>

                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Containment & Next Steps
                  </div>
                  <p className="text-slate-300 mb-2">{summaryResult.containmentStatus}</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {summaryResult.nextSteps?.map((step: string, idx: number) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                Submit incident JSON to compile CISO executive summary.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Formal Investigation Report */}
      {activeTab === "report" && (
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100">Formal Investigation Report Generator</h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded transition flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>{isGeneratingReport ? "Generating Report..." : "Build Markdown Report"}</span>
              </button>

              {reportMarkdown && (
                <button
                  onClick={copyReportToClipboard}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition flex items-center space-x-1"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied!" : "Copy Report"}</span>
                </button>
              )}
            </div>
          </div>

          {reportMarkdown ? (
            <pre className="p-5 rounded-lg bg-slate-950 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 max-h-[600px] overflow-y-auto">
              {reportMarkdown}
            </pre>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Click 'Build Markdown Report' to compile a formal incident investigation document.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
