import React, { useState, useEffect } from "react";
import {
  Globe2,
  Search,
  Shield,
  Tag,
  ExternalLink,
  Flame,
  Activity,
  AlertTriangle,
  RefreshCw,
  Plus,
  Sparkles,
  Database,
  FileText,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2,
  ArrowRight,
  Filter,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ThreatIndicator, ThreatFeed, ThreatActor, ThreatCampaign, ThreatReport, IocMatch } from "../../server/threatIntelEngine";

export const ThreatIntelView: React.FC = () => {
  const [iocs, setIocs] = useState<ThreatIndicator[]>([]);
  const [feeds, setFeeds] = useState<ThreatFeed[]>([]);
  const [actors, setActors] = useState<ThreatActor[]>([]);
  const [campaigns, setCampaigns] = useState<ThreatCampaign[]>([]);
  const [reports, setReports] = useState<ThreatReport[]>([]);
  const [matches, setMatches] = useState<IocMatch[]>([]);
  const [stats, setStats] = useState<any>({
    totalIndicatorsCount: 0,
    activeFeedsCount: 0,
    threatActorsCount: 0,
    matchesCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIoc, setSelectedIoc] = useState<ThreatIndicator | null>(null);
  const [activeTab, setActiveTab] = useState<"iocs" | "actors" | "feeds" | "reports" | "matches" | "mitre">("iocs");

  // AI Copilot state
  const [enrichInput, setEnrichInput] = useState("185.220.101.5");
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedData, setEnrichedData] = useState<any>(null);

  // New IOC state
  const [newIocValue, setNewIocValue] = useState("");
  const [newIocType, setNewIocType] = useState<ThreatIndicator["type"]>("IPv4");
  const [newIocActor, setNewIocActor] = useState("APT28 (Fancy Bear)");

  const fetchThreatIntelData = async () => {
    try {
      const [iRes, fRes, aRes, cRes, rRes, mRes, sRes] = await Promise.all([
        fetch("/api/threatintel/iocs"),
        fetch("/api/threatintel/feeds"),
        fetch("/api/threatintel/actors"),
        fetch("/api/threatintel/campaigns"),
        fetch("/api/threatintel/reports"),
        fetch("/api/threatintel/matches"),
        fetch("/api/threatintel/stats"),
      ]);

      if (iRes.ok) {
        const iData = await iRes.json();
        setIocs(iData);
        if (!selectedIoc && iData.length > 0) setSelectedIoc(iData[0]);
      }
      if (fRes.ok) setFeeds(await fRes.json());
      if (aRes.ok) setActors(await aRes.json());
      if (cRes.ok) setCampaigns(await cRes.json());
      if (rRes.ok) setReports(await rRes.json());
      if (mRes.ok) setMatches(await mRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch (err) {
      console.warn("Threat Intel fetch warning:", err);
    }
  };

  useEffect(() => {
    fetchThreatIntelData();
    const interval = setInterval(fetchThreatIntelData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncFeeds = async () => {
    try {
      const res = await fetch("/api/threatintel/sync", { method: "POST" });
      if (res.ok) {
        fetchThreatIntelData();
      }
    } catch (err) {
      console.error("Feed sync failed", err);
    }
  };

  const handleIngestNewIoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIocValue) return;

    try {
      const res = await fetch("/api/threatintel/iocs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: newIocValue,
          type: newIocType,
          threat_actor: newIocActor,
          feed_source: "MANUAL_ANALYST_INGEST",
          tags: ["analyst_verified", "priority_watch"],
        }),
      });

      if (res.ok) {
        setNewIocValue("");
        fetchThreatIntelData();
      }
    } catch (err) {
      console.error("IOC Ingestion failed", err);
    }
  };

  const handleEnrichIoc = async () => {
    setIsEnriching(true);
    try {
      const res = await fetch("/api/threatintel/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iocValue: enrichInput, iocType: "IPv4" }),
      });
      if (res.ok) {
        const data = await res.json();
        setEnrichedData(data);
      }
    } catch (err) {
      console.error("Enrichment error", err);
    } finally {
      setIsEnriching(false);
    }
  };

  const filteredIocs = iocs.filter(
    (ioc) =>
      ioc.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ioc.threat_actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ioc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 space-y-6 p-6 bg-slate-950 text-slate-100 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-slate-100 flex items-center gap-2">
              Enterprise Threat Intelligence Platform (TIP)
              <span className="text-xs px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono rounded-full border border-cyan-500/30">
                STIX/TAXII 2.1 Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated Indicator Exchange, Cross-Engine Matching, MITRE Mapping, and AWM AI Enrichment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncFeeds}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync STIX Feeds
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Threat Indicators</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.totalIndicatorsCount || iocs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active High-Confidence IOCs</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>STIX 2.1 Feeds</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 mt-2">{stats.activeFeedsCount || feeds.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">CISA & Mandiant Feeds Active</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tracked APT Actors</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{stats.threatActorsCount || actors.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">State-Sponsored Threat Groups</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>IOC Cross Matches</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{stats.matchesCount || matches.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">SIEM / NDR Telemetry Hits</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Intel Reports</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2">{reports.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">AWM AI Assistant Threat Assessments</div>
        </div>
      </div>

      {/* AWM AI Assistant Intelligence Enrichment Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <h3 className="font-bold text-xs text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" /> AWM AI Threat Intelligence Assistant (AWM AI Engine)
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Enter IP, Hash, Domain, or URL to enrich (e.g. '185.220.101.5')..."
            value={enrichInput}
            onChange={(e) => setEnrichInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 min-w-[260px]"
          />
          <button
            onClick={handleEnrichIoc}
            disabled={isEnriching}
            className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 text-white shadow cursor-pointer disabled:opacity-50"
          >
            {isEnriching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isEnriching ? "Enriching Indicator..." : "Enrich Indicator with AWM AI"}
          </button>
        </div>

        {enrichedData && (
          <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl text-xs space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-cyan-300 text-sm">{enrichedData.value}</span>
                <span className="ml-2 text-slate-400 font-mono text-[11px]">[{enrichedData.type}]</span>
              </div>
              <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 font-extrabold text-[11px] rounded border border-rose-500/30">
                Risk Score: {enrichedData.riskScore}/100 • {enrichedData.threatActor}
              </span>
            </div>

            <p className="text-slate-300">{enrichedData.summary}</p>

            {enrichedData.detectionRules && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {enrichedData.detectionRules.yara && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 font-mono text-[10px]">
                    <div className="font-bold text-amber-400">YARA Signature Rule</div>
                    <pre className="text-slate-300 whitespace-pre-wrap">{enrichedData.detectionRules.yara}</pre>
                  </div>
                )}
                {enrichedData.detectionRules.suricata && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 font-mono text-[10px]">
                    <div className="font-bold text-indigo-400">Suricata NDR Rule</div>
                    <pre className="text-slate-300 whitespace-pre-wrap">{enrichedData.detectionRules.suricata}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main View Tabs */}
      <div className="flex border-b border-slate-800 text-sm font-medium">
        <button
          onClick={() => setActiveTab("iocs")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "iocs"
              ? "border-cyan-500 text-cyan-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="w-4 h-4" /> IOC Repository ({iocs.length})
        </button>
        <button
          onClick={() => setActiveTab("actors")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "actors"
              ? "border-cyan-500 text-cyan-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame className="w-4 h-4" /> Threat Actors ({actors.length})
        </button>
        <button
          onClick={() => setActiveTab("feeds")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "feeds"
              ? "border-cyan-500 text-cyan-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="w-4 h-4" /> STIX/TAXII Feeds ({feeds.length})
        </button>
        <button
          onClick={() => setActiveTab("matches")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "matches"
              ? "border-cyan-500 text-cyan-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Zap className="w-4 h-4" /> Telemetry Matches ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "reports"
              ? "border-cyan-500 text-cyan-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" /> Threat Reports ({reports.length})
        </button>
      </div>

      {/* TAB 1: IOC Repository & Ingestion Form */}
      {activeTab === "iocs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IOC Search & Ingest Column */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search IOC value, actor, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Ingest IOC Card */}
            <form onSubmit={handleIngestNewIoc} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
              <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5 uppercase">
                <Plus className="w-4 h-4 text-cyan-400" /> Ingest Manual Indicator
              </h3>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold">Indicator Value</label>
                <input
                  type="text"
                  placeholder="198.51.100.99 or Hash"
                  value={newIocValue}
                  onChange={(e) => setNewIocValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono mt-1 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Type</label>
                  <select
                    value={newIocType}
                    onChange={(e) => setNewIocType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 mt-1 focus:outline-none"
                  >
                    <option value="IPv4">IPv4 Address</option>
                    <option value="DOMAIN">Domain Name</option>
                    <option value="SHA256">SHA256 Hash</option>
                    <option value="URL">Phishing URL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Attributed Actor</label>
                  <select
                    value={newIocActor}
                    onChange={(e) => setNewIocActor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 mt-1 focus:outline-none"
                  >
                    <option value="APT28 (Fancy Bear)">APT28 (Fancy Bear)</option>
                    <option value="Lazarus Group (APT38)">Lazarus Group</option>
                    <option value="FIN7 / Cobalt Group">FIN7 / Cobalt</option>
                    <option value="APT29 (Cozy Bear)">APT29 (Cozy Bear)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Ingest & Trigger Cross Match
              </button>
            </form>
          </div>

          {/* IOC Feed List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
              <Globe2 className="w-4 h-4 text-cyan-400" /> Active STIX/TAXII Indicator Feed ({filteredIocs.length})
            </h3>

            <div className="space-y-3">
              {filteredIocs.map((ioc) => (
                <div
                  key={ioc.id}
                  onClick={() => setSelectedIoc(ioc)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedIoc?.id === ioc.id
                      ? "bg-cyan-950/40 border-cyan-500 text-cyan-100"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold rounded">
                        {ioc.type}
                      </span>
                      <span className="font-mono text-slate-100 font-bold">{ioc.value}</span>
                    </div>

                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-extrabold text-[10px] rounded">
                      Reputation: {ioc.reputation_score}/100
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Attribution: <strong className="text-indigo-300">{ioc.threat_actor}</strong></span>
                    <span>Source: {ioc.feed_source}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {ioc.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] rounded flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Threat Actor Profiles */}
      {activeTab === "actors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actors.map((actor) => (
            <div key={actor.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-rose-400 text-base">{actor.name}</h3>
                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold rounded">
                  {actor.origin}
                </span>
              </div>

              <p className="text-xs text-slate-300">{actor.description}</p>

              <div className="space-y-1.5 text-xs pt-1">
                <div>
                  <strong className="text-slate-400">Aliases:</strong>{" "}
                  <span className="text-slate-200">{(actor.aliases || []).join(", ") || "Unknown"}</span>
                </div>
                <div>
                  <strong className="text-slate-400">Target Sectors:</strong>{" "}
                  <span className="text-cyan-300">{(actor.target_sectors || []).join(", ")|| "Unknown"}</span>
                  
                </div>
                <div>
                  <strong className="text-slate-400">Top Malware:</strong>{" "}
                  <span className="text-amber-300 font-mono"> {(actor.top_malware || []).join(", ") || "Unknown"}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-800">
                {(actor.mitre_attack_ids || []).map((id, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[10px] rounded">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: STIX/TAXII Feeds */}
      {activeTab === "feeds" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Feed Name</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Indicators Ingested</th>
                  <th className="py-3 px-4">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {feeds.map((feed) => (
                  <tr key={feed.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-100">{feed.name}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{feed.format}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
                        {feed.health_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{feed.indicator_count.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(feed.last_synced_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Telemetry Matches */}
      {activeTab === "matches" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Matched At</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Indicator Value</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Attributed Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{new Date(m.matched_at).toLocaleTimeString()}</td>
                    <td className="py-3 px-4 font-bold text-indigo-400">{m.matched_module}</td>
                    <td className="py-3 px-4 font-mono text-cyan-300 font-bold">{m.indicator_value}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 font-bold text-[10px] rounded">
                        {m.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{m.details.threatActor || "Unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Threat Reports */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {reports.map((rep) => (
            <div key={rep.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100 text-base">{rep.title}</h3>
                <span className="text-xs text-slate-400 font-mono">{new Date(rep.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{rep.summary}</p>
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <strong>Attributed Actor:</strong> {rep.threat_actor}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
