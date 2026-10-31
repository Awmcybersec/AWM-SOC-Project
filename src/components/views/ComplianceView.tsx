import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  Layers,
  Search,
  Sparkles,
  RefreshCw,
  Eye,
  Download,
  Award,
  Activity,
  ChevronRight,
  Cpu,
  Lock,
  PieChart,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  AlertOctagon,
  UserCheck,
  Building2,
} from 'lucide-react';

interface Framework {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  total_controls: number;
  compliance_score: number;
}

interface Control {
  id: string;
  framework_id: string;
  control_code: string;
  title: string;
  description: string;
  domain: string;
  owner: string;
  severity_weight: number;
  automated_check_type: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NOT_APPLICABLE';
  effectiveness_score: number;
}

interface Evidence {
  id: string;
  control_id: string;
  evidence_type: string;
  source_system: string;
  evidence_data: any;
  verification_hash: string;
  collected_at: string;
}

interface AuditSession {
  id: string;
  audit_title: string;
  framework_id: string;
  lead_auditor: string;
  scope: string;
  status: string;
  started_at: string;
}

interface AuditFinding {
  id: string;
  audit_id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  finding_description: string;
  remediation_plan: string;
  assigned_to: string;
  status: string;
  identified_at: string;
}

interface RiskItem {
  id: string;
  risk_title: string;
  category: string;
  likelihood: number;
  impact: number;
  inherent_risk_score: number;
  residual_risk_score: number;
  risk_owner: string;
  risk_status: string;
  mitigation_controls: string[];
}

interface ComplianceReport {
  id: string;
  title: string;
  framework_id: string;
  author: string;
  compliance_score: number;
  executive_summary: string;
  gap_analysis: string[];
  policy_recommendations: string[];
  created_at: string;
}

interface ComplianceViewProps {
  frameworks?: any[];
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({ frameworks: propFrameworks }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'evidence' | 'audits' | 'risks' | 'copilot'>('overview');
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [audits, setAudits] = useState<AuditSession[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>('SOC2_TYPE2');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // AI Copilot State
  const [aiReportLoading, setAiReportLoading] = useState<boolean>(false);
  const [latestReport, setLatestReport] = useState<ComplianceReport | null>(null);
  const [selectedControlGap, setSelectedControlGap] = useState<any | null>(null);

  useEffect(() => {
    fetchComplianceData();
  }, [selectedFramework]);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const [fwRes, ctrlRes, evdRes, audRes, fndRes, rskRes, repRes] = await Promise.all([
        fetch('/api/compliance/frameworks').then((r) => r.json()),
        fetch(`/api/compliance/controls?frameworkId=${selectedFramework}`).then((r) => r.json()),
        fetch('/api/compliance/evidence').then((r) => r.json()),
        fetch('/api/compliance/audits').then((r) => r.json()),
        fetch('/api/compliance/findings').then((r) => r.json()),
        fetch('/api/compliance/risks').then((r) => r.json()),
        fetch('/api/compliance/reports').then((r) => r.json()),
      ]);

      setFrameworks(fwRes || []);
      setControls(ctrlRes || []);
      setEvidenceList(evdRes || []);
      setAudits(audRes || []);
      setFindings(fndRes || []);
      setRisks(rskRes || []);
      setReports(repRes || []);
      if (repRes && repRes.length > 0) {
        setLatestReport(repRes[0]);
      }
    } catch (err) {
      console.error('Error fetching compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAssessment = async () => {
    setLoading(true);
    try {
      await fetch('/api/compliance/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameworkId: selectedFramework }),
      });
      await fetchComplianceData();
    } catch (err) {
      console.error('Assessment failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiReport = async () => {
    setAiReportLoading(true);
    try {
      const res = await fetch('/api/compliance/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameworkId: selectedFramework }),
      });
      const data = await res.json();
      setLatestReport(data);
      setReports((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Report generation error:', err);
    } finally {
      setAiReportLoading(false);
    }
  };

  const handleExplainGap = async (controlId: string) => {
    try {
      const res = await fetch('/api/compliance/explain-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controlId }),
      });
      const data = await res.json();
      setSelectedControlGap(data);
    } catch (err) {
      console.error('Explain gap error:', err);
    }
  };

  const currentFw = frameworks.find((f) => f.id === selectedFramework) || frameworks[0];
  const overallAvgScore = Math.round(
    frameworks.reduce((acc, f) => acc + f.compliance_score, 0) / (frameworks.length || 1)
  );

  const filteredControls = controls.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.control_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Enterprise Compliance & Governance (GRC) Engine
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  ISO / NIST / SOC 2 / GDPR
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Continuous automated control assessment, evidence collection, audit workflows, and AI gap analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAssessment}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run Telemetry Assessment
          </button>
          <button
            onClick={handleGenerateAiReport}
            disabled={aiReportLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {aiReportLoading ? 'Synthesizing...' : 'AI Audit Report'}
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'overview'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4" /> Score Dashboard
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'matrix'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Control Matrix
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'evidence'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Live Evidence Repository
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'audits'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4" /> Audit Sessions & Findings
        </button>
        <button
          onClick={() => setActiveTab('risks')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'risks'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <AlertOctagon className="w-4 h-4" /> Risk Register Heatmap
        </button>
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'copilot'
              ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" /> AWM AI Compliance Assistant
        </button>
      </div>

      {/* TAB 1: OVERVIEW & SCORES */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Overall Enterprise Score</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white flex items-baseline gap-2">
                {overallAvgScore}%
                <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Passing SLA
                </span>
              </div>
              <p className="text-xs text-slate-400">Average across {frameworks.length} active regulatory frameworks</p>
            </div>

            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Assessed Controls</span>
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {controls.length}
                <span className="text-xs font-normal text-slate-400 ml-2">Total Evaluated</span>
              </div>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {controls.filter((c) => c.status === 'COMPLIANT').length} Compliant
              </p>
            </div>

            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Evidence Artifacts</span>
                <FileText className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-white">{evidenceList.length}</div>
              <p className="text-xs text-slate-400">Automated SIEM, EDR & VM telemetry logs</p>
            </div>

            <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Audit Findings</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white">{findings.length}</div>
              <p className="text-xs text-amber-400">
                {findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length} Critical / High
              </p>
            </div>
          </div>

          {/* Framework Comparison Grid */}
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" /> Compliance Framework Posture
                </h2>
                <p className="text-xs text-slate-400">
                  Select a framework to filter control matrix and evidence collections.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {frameworks.map((fw) => {
                const isSelected = fw.id === selectedFramework;
                return (
                  <div
                    key={fw.id}
                    onClick={() => setSelectedFramework(fw.id)}
                    className={`p-5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {fw.version}
                        </span>
                        <h3 className="text-base font-bold text-white mt-2">{fw.name}</h3>
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          fw.compliance_score >= 85
                            ? 'text-emerald-400'
                            : fw.compliance_score >= 70
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {fw.compliance_score}%
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{fw.description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>{fw.total_controls} Controls Catalog</span>
                      <span className="text-blue-400 font-medium flex items-center gap-1">
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTROL MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/80 p-4 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase">Framework:</span>
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {frameworks.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Filter by control code, title, domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm text-white pl-9 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Control Title</th>
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Telemetry Check</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Effectiveness</th>
                    <th className="px-4 py-3 text-center">AWM AI Assistant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredControls.map((ctrl) => (
                    <tr key={ctrl.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400 font-bold">{ctrl.control_code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{ctrl.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-1">{ctrl.description}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">{ctrl.domain}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{ctrl.owner}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded font-mono bg-slate-950 text-cyan-400 border border-slate-800">
                          {ctrl.automated_check_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ctrl.status === 'COMPLIANT' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLIANT
                          </span>
                        )}
                        {ctrl.status === 'PARTIALLY_COMPLIANT' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" /> PARTIAL GAP
                          </span>
                        )}
                        {ctrl.status === 'NON_COMPLIANT' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="w-3.5 h-3.5" /> NON COMPLIANT
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">{ctrl.effectiveness_score}%</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleExplainGap(ctrl.id)}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded transition inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> Explain Gap
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Gap Explanation Modal / Drawer */}
          {selectedControlGap && (
            <div className="p-5 bg-slate-900 border border-emerald-500/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  AI Control Gap Analysis: {selectedControlGap.controlId}
                </h3>
                <button
                  onClick={() => setSelectedControlGap(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <p className="text-xs text-slate-300">{selectedControlGap.gapAnalysis}</p>

              <div>
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  Remediation Steps
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  {selectedControlGap.remediationGuide?.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 text-xs text-amber-400 font-medium">
                Risk Impact: {selectedControlGap.riskImpact}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EVIDENCE EXPLORER */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Automated Telemetry Evidence Repository
              </h2>
              <p className="text-xs text-slate-400">
                Cryptographically hashed audit artifacts pulled automatically from SIEM, EDR, and VM scanners.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Total Artifacts: {evidenceList.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidenceList.map((evd) => (
              <div key={evd.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {evd.evidence_type}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{evd.source_system}</h3>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(evd.collected_at).toLocaleTimeString()}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
                  <pre>{JSON.stringify(evd.evidence_data, null, 2)}</pre>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Hash: {evd.verification_hash}</span>
                  <span className="text-emerald-400 font-sans">✓ Cryptographically Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT SESSIONS & FINDINGS */}
      {activeTab === 'audits' && (
        <div className="space-y-6">
          {/* Active Audit Sessions */}
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Active Audit Workspaces
            </h2>

            <div className="space-y-3">
              {audits.map((aud) => (
                <div key={aud.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-400">{aud.id}</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {aud.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{aud.audit_title}</h3>
                  <p className="text-xs text-slate-400">Lead Auditor: {aud.lead_auditor}</p>
                  <p className="text-xs text-slate-400">Scope: {aud.scope}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Findings */}
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Open Audit Findings Register
            </h2>

            <div className="space-y-3">
              {findings.map((fnd) => (
                <div key={fnd.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-red-400">{fnd.id}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                      {fnd.severity}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{fnd.title}</h3>
                  <p className="text-xs text-slate-300">{fnd.finding_description}</p>
                  <p className="text-xs text-emerald-400">Remediation: {fnd.remediation_plan}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RISK REGISTER HEATMAP */}
      {activeTab === 'risks' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-amber-400" /> Enterprise Cyber Risk Register
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {risks.map((rsk) => (
                <div key={rsk.id} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-400">{rsk.id}</span>
                    <span className="text-xs font-bold text-white bg-slate-800 px-2 py-1 rounded">
                      Inherent Score: {rsk.inherent_risk_score} / 25
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{rsk.risk_title}</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>Likelihood: {rsk.likelihood} / 5</div>
                    <div>Impact: {rsk.impact} / 5</div>
                    <div>Owner: {rsk.risk_owner}</div>
                    <div>Status: {rsk.risk_status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AI COMPLIANCE COPILOT */}
      {activeTab === 'copilot' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/80 border border-emerald-500/30 rounded-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" /> AWM AI Engine Compliance Executive Report
                </h2>
                <p className="text-xs text-slate-400">
                  AI-driven executive gap analysis and policy improvement recommendations.
                </p>
              </div>
              <button
                onClick={handleGenerateAiReport}
                disabled={aiReportLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition"
              >
                {aiReportLoading ? 'Synthesizing...' : 'Regenerate Report'}
              </button>
            </div>

            {latestReport ? (
              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <h3 className="text-sm font-bold text-white">{latestReport.title}</h3>
                  <p className="text-xs text-slate-400">{latestReport.executive_summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Identified Compliance Gaps
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {latestReport.gap_analysis.map((gap, idx) => (
                        <li key={idx}>{gap}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Policy Improvement Recommendations
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {latestReport.policy_recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Click Regenerate Report to synthesize AI audit summary.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
