// AWM AI SOC SENIOR - Threat Intelligence Platform (TIP) View
// Features MISP, OpenCTI, and STIX/TAXII Feed Connectors, Reputation Calculator, & Threat Actor Profiles.

import React, { useState, useEffect } from "react";
import {
  Globe2,
  RefreshCw,
  Search,
  Database,
  Users,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  Plus,
  Radio,
  Tag,
  Cpu,
} from "lucide-react";
import { IOC, ThreatFeedConnector, ThreatActor } from "../../types";

export const ThreatIntelPlatformView: React.FC = () => {
  const [connectors, setConnectors] = useState<ThreatFeedConnector[]>([]);
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [threatActors, setThreatActors] = useState<ThreatActor[]>([]);

  // Search & Reputation Query
  const [queryInput, setQueryInput] = useState<string>("185.220.101.5");
  const [reputationResult, setReputationResult] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  // Sync state
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resConn, resIoc, resActors] = await Promise.all([
        fetch("/api/threatintel/connectors"),
        fetch("/api/threatintel/iocs"),
        fetch("/api/threatintel/actors"),
      ]);

      if (resConn.ok) setConnectors(await resConn.json());
      if (resIoc.ok) setIocs(await resIoc.json());
      if (resActors.ok) setThreatActors(await resActors.json());
    } catch (err) {
      console.warn("Failed to fetch threat intel data:", err);
    }
  };

  const handleSyncConnector = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await fetch(`/api/threatintel/connectors/${id}/sync`, {
        method: "POST",
      });

      if (res.ok) {
        const updated = await res.json();
        setConnectors((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } catch (err) {
      console.warn("Sync error:", err);
    } finally {
      setTimeout(() => setSyncingId(null), 1200);
    }
  };

  const handleQueryReputation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput) return;

    setIsQuerying(true);
    try {
      const res = await fetch("/api/threatintel/reputation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indicator: queryInput, type: "IP" }),
      });

      if (res.ok) {
        setReputationResult(await res.json());
      }
    } catch (err) {
      console.warn("Reputation query error:", err);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Threat Intelligence Platform (TIP)</h2>
            <p className="text-xs text-slate-400">
              MISP, OpenCTI & STIX/TAXII 2.1 Connectors, Reputation Matrix & Threat Actor Profiling
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Connectors Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Radio className="w-4 h-4 text-emerald-400" />
          <span>Active Threat Feed Sync Connectors ({connectors.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {connectors.map((conn) => (
            <div
              key={conn.id}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{conn.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {conn.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">{conn.endpointUrl}</div>
                <div className="text-xs font-semibold text-emerald-400">{conn.iocCount.toLocaleString()} IOCs</div>
              </div>

              <button
                onClick={() => handleSyncConnector(conn.id)}
                disabled={syncingId === conn.id}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition border border-slate-700 flex items-center justify-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${syncingId === conn.id ? "animate-spin text-indigo-400" : ""}`} />
                <span>{syncingId === conn.id ? "Syncing..." : "Sync Feed"}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reputation Query Engine + Threat Actors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reputation Matrix Query (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Search className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">IOC Reputation Intelligence Matrix</h3>
          </div>

          <form onSubmit={handleQueryReputation} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter IP, SHA256, or Domain..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isQuerying}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition"
            >
              Analyze
            </button>
          </form>

          {reputationResult && (
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="font-mono font-bold text-slate-200">{reputationResult.indicator}</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    reputationResult.reputation === "Malicious"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {reputationResult.reputation} ({reputationResult.confidenceScore}%)
                </span>
              </div>

              <div className="space-y-1 text-slate-300">
                <div>
                  <strong className="text-slate-400">Threat Actor:</strong> {reputationResult.threatGroup}
                </div>
                <div>
                  <strong className="text-slate-400">Feed Source:</strong> {reputationResult.feedSource}
                </div>
                <div>
                  <strong className="text-slate-400">Recommendation:</strong> {reputationResult.recommendation}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {reputationResult.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Threat Actor Profiles (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Users className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-slate-100">Adversary Threat Actor Profiles</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {threatActors.map((actor) => (
              <div key={actor.id} className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{actor.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {actor.sophistication}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{actor.description}</p>

                Target Sectors:{" "}
<span className="text-slate-300">
  {(actor.targetSectors || []).join(", ") || "Unknown"}
</span>

                <div className="flex flex-wrap gap-1 pt-1">
  {(actor.mitreAttckIds || []).map((t: string) => (
    <span
      key={t}
      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
    >
      {t}
    </span>
  ))}
</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
