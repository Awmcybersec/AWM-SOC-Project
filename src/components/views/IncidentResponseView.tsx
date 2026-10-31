// AWM AI SOC SENIOR - Incident Response Management System View
// Handles Incident Lifecycle tracking, Investigation Notes, Evidence Locker, Response Audits, & AI Report Generation.

import React, { useState, useEffect } from "react";
import {
  Siren,
  Plus,
  Filter,
  UserCheck,
  Clock,
  ShieldAlert,
  FileText,
  FileCode,
  Lock,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Incident, Severity, IncidentNote, DigitalEvidence } from "../../types";

export const IncidentResponseView: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // New Note State
  const [newNoteText, setNewNoteText] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  // Create Incident Form
  const [newTitle, setNewTitle] = useState<string>("");
  const [newSeverity, setNewSeverity] = useState<Severity>("High");
  const [newAssignee, setNewAssignee] = useState<string>("Alex Rivera (L3 Responder)");
  const [newAsset, setNewAsset] = useState<string>("WIN-DC01");
  const [newNote, setNewNote] = useState<string>("");

  // Report Modal / AI Output
  const [generatedReportMarkdown, setGeneratedReportMarkdown] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await fetch("/api/incidents");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
        if (data.length > 0 && !selectedIncident) {
          setSelectedIncident(data[0]);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch incidents:", err);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          severity: newSeverity,
          assignee: newAssignee,
          affectedAssets: [newAsset],
          initialNote: newNote,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIncidents((prev) => [created, ...prev]);
        setSelectedIncident(created);
        setIsCreateModalOpen(false);
        setNewTitle("");
        setNewNote("");
      }
    } catch (err) {
      console.warn("Error creating incident:", err);
    }
  };

  const handleUpdateStatus = async (id: string, status: Incident["status"]) => {
    try {
      const res = await fetch(`/api/incidents/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updated = await res.json();
        setIncidents((prev) => prev.map((inc) => (inc.id === id ? updated : inc)));
        setSelectedIncident(updated);
      }
    } catch (err) {
      console.warn("Error updating status:", err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNoteText, author: "Alex Rivera (L3)" }),
      });

      if (res.ok) {
        const note = await res.json();
        const updatedInc = {
          ...selectedIncident,
          investigationNotes: [...selectedIncident.investigationNotes, note],
        };
        setSelectedIncident(updatedInc);
        setIncidents((prev) => prev.map((inc) => (inc.id === updatedInc.id ? updatedInc : inc)));
        setNewNoteText("");
      }
    } catch (err) {
      console.warn("Error adding note:", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleGenerateAiReport = async () => {
    if (!selectedIncident) return;
    setIsGeneratingReport(true);
    try {
      const res = await fetch("/api/ai-analyst/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedIncident),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedReportMarkdown(data.reportMarkdown);
      }
    } catch (err) {
      console.warn("Error generating report:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter !== "ALL" && inc.status !== statusFilter) return false;
    if (severityFilter !== "ALL" && inc.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            <Siren className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Incident Response Management System</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 5 Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Enterprise Incident Lifecycle, Evidence Locker, Response Audits & AI Investigation Reports
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchIncidents}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Refresh Incidents"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Incident Case</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Incident List (Left) + Detail View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident Selector & Filter Sidebar (4 cols) */}
        <div className="lg:col-span-4 rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Incident Cases ({filteredIncidents.length})</span>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Triaged">Triaged</option>
              <option value="Investigating">Investigating</option>
              <option value="Containment">Containment</option>
              <option value="Remediated">Remediated</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>
          </div>

          {/* Incident List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredIncidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3 rounded-lg border cursor-pointer transition space-y-2 ${
                    isSelected
                      ? "bg-slate-800/90 border-indigo-500/80 shadow-md"
                      : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300">{inc.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inc.severity === "Critical"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : inc.severity === "High"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200 line-clamp-2">{inc.title}</div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                    <span>{inc.status}</span>
                    <span>{new Date(inc.createdTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Incident Detail View (8 cols) */}
        <div className="lg:col-span-8 rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-6">
          {selectedIncident ? (
            <div className="space-y-6">
              {/* Incident Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-mono font-bold text-indigo-400">{selectedIncident.id}</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                        selectedIncident.severity === "Critical"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : selectedIncident.severity === "High"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {selectedIncident.severity} Severity
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Status: {selectedIncident.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{selectedIncident.title}</h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGenerateAiReport}
                    disabled={isGeneratingReport}
                    className="px-3 py-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/40 text-xs font-semibold transition flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>{isGeneratingReport ? "Generating AI Report..." : "AI Investigation Report"}</span>
                  </button>
                </div>
              </div>

              {/* Status Stepper Buttons */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Incident State Machine Transition
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(["New", "Triaged", "Investigating", "Containment", "Remediated", "Closed"] as Incident["status"][]).map(
                    (st) => {
                      const isActive = selectedIncident.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(selectedIncident.id, st)}
                          className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                            isActive
                              ? "bg-indigo-600 text-white border-indigo-500"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                          }`}
                        >
                          {st}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Incident Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800/80">
                  <div className="text-slate-400 mb-1">Assigned Analyst</div>
                  <div className="font-semibold text-slate-200">{selectedIncident.assignee}</div>
                </div>
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800/80">
                  <div className="text-slate-400 mb-1">Detection Source</div>
                  <div className="font-semibold text-slate-200">{selectedIncident.source}</div>
                </div>
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800/80">
                  <div className="text-slate-400 mb-1">Impacted Assets</div>
                  <div className="font-semibold text-slate-200">{selectedIncident.affectedAssets.join(", ")}</div>
                </div>
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800/80">
                  <div className="text-slate-400 mb-1">Created Time</div>
                  <div className="font-semibold text-slate-200">
                    {new Date(selectedIncident.createdTime).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Investigation Notes & Evidence Locker Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notes Thread */}
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Investigation Timeline & Notes ({selectedIncident.investigationNotes.length})</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedIncident.investigationNotes.map((n) => (
                      <div key={n.id} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-indigo-300">{n.author}</span>
                          <span className="text-[10px]">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-300">{n.note}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add investigation note..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingNote}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* Digital Evidence Locker */}
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Digital Evidence Locker ({selectedIncident.evidence.length})</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedIncident.evidence.length === 0 ? (
                      <div className="text-xs text-slate-500 italic py-4 text-center">
                        No evidence artifacts attached yet.
                      </div>
                    ) : (
                      selectedIncident.evidence.map((evd) => (
                        <div key={evd.id} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-slate-200">{evd.filename}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {evd.fileType}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            SHA256: {evd.hash}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                            <span>Collector: {evd.collector}</span>
                            <span>{evd.sizeKb} KB</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-sm">Select an incident to review details.</div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {generatedReportMarkdown && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-100">AI Investigation Report Output</h3>
              </div>
              <button
                onClick={() => setGeneratedReportMarkdown(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <pre className="p-4 rounded bg-slate-950 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-slate-800">
              {generatedReportMarkdown}
            </pre>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">Create New Security Incident Case</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LSASS Memory Injection on Domain Controller"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as Severity)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Affected Asset</label>
                  <input
                    type="text"
                    value={newAsset}
                    onChange={(e) => setNewAsset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Assignee</label>
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Initial Investigation Note</label>
                <textarea
                  rows={3}
                  placeholder="Describe initial indicators or detection triggers..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-xs transition"
              >
                Initialize Incident Case File
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
