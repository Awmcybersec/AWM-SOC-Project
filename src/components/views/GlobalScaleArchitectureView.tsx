import React, { useState } from "react";
import {
  Globe,
  Server,
  Network,
  Activity,
  Cpu,
  Layers,
  Database,
  CheckCircle2,
  RefreshCw,
  Zap,
  Shield,
  Radio,
  Share2,
  HardDrive,
} from "lucide-react";

interface RegionalNode {
  id: string;
  name: string;
  region: string;
  status: "ONLINE" | "HA_SYNCING" | "DEGRADED";
  activeAgents: number;
  logVolumeGbDay: number;
  latencyMs: number;
  replicationLagMs: number;
}

export const GlobalScaleArchitectureView: React.FC = () => {
  const [nodes, setNodes] = useState<RegionalNode[]>([
    {
      id: "NODE-US-EAST-01",
      name: "US-East Primary Regional SOC Node",
      region: "us-east-1 (N. Virginia)",
      status: "ONLINE",
      activeAgents: 14250,
      logVolumeGbDay: 840,
      latencyMs: 12,
      replicationLagMs: 2,
    },
    {
      id: "NODE-EU-WEST-01",
      name: "Europe Regional SOC Node",
      region: "eu-west-1 (Frankfurt)",
      status: "ONLINE",
      activeAgents: 9800,
      logVolumeGbDay: 620,
      latencyMs: 34,
      replicationLagMs: 5,
    },
    {
      id: "NODE-APAC-SOUTH-01",
      name: "Asia-Pacific Regional Node",
      region: "ap-southeast-1 (Singapore)",
      status: "ONLINE",
      activeAgents: 6100,
      logVolumeGbDay: 410,
      latencyMs: 82,
      replicationLagMs: 8,
    },
    {
      id: "NODE-AIRGAP-FED-01",
      name: "Air-Gapped Classified Federal Node",
      region: "us-gov-west-1",
      status: "HA_SYNCING",
      activeAgents: 2400,
      logVolumeGbDay: 190,
      latencyMs: 4,
      replicationLagMs: 14,
    },
  ]);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleTriggerReplication = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          replicationLagMs: Math.max(1, n.replicationLagMs - 2),
        }))
      );
      setIsRefreshing(false);
    }, 1000);
  };

  const totalAgents = nodes.reduce((acc, n) => acc + n.activeAgents, 0);
  const totalVolumeGb = nodes.reduce((acc, n) => acc + n.logVolumeGbDay, 0);

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/40 rounded-xl text-emerald-400">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Enterprise Global Scale Architecture</h1>
            <p className="text-xs text-slate-400 mt-1">
              Distributed agent telemetry fabric, regional SOC nodes, PostgreSQL WAL replication, and global load balancing.
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerReplication}
          disabled={isRefreshing}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Force Global Cluster Sync
        </button>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Global Active Agents</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{totalAgents.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500 block">Across 4 Global Nodes</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Daily Ingestion Volume</span>
          <div className="text-2xl font-bold text-cyan-400 font-mono">{totalVolumeGb.toLocaleString()} GB/Day</div>
          <span className="text-[11px] text-slate-500 block">Peak: 125,000 EPS</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Replication Sync Status</span>
          <div className="text-2xl font-bold text-teal-300 font-mono flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Active WAL
          </div>
          <span className="text-[11px] text-slate-500 block">Avg Lag: &lt; 5ms</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">HA Cluster Health</span>
          <div className="text-2xl font-bold text-indigo-400 font-mono">99.999%</div>
          <span className="text-[11px] text-slate-500 block">Zero Data Loss Target (RPO=0)</span>
        </div>
      </div>

      {/* Regional SOC Nodes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Server className="w-4 h-4 text-emerald-400" /> Regional SOC Ingestion & Command Nodes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nodes.map((node) => (
            <div key={node.id} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <h3 className="font-bold text-sm text-slate-100">{node.name}</h3>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full font-mono">
                  {node.status}
                </span>
              </div>

              <div className="text-xs text-slate-400 font-mono space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                <div className="flex justify-between">
                  <span>ID / Region:</span> <span className="text-cyan-400">{node.region}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Endpoints:</span> <span className="text-emerald-400 font-bold">{node.activeAgents.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Ingestion:</span> <span className="text-slate-200">{node.logVolumeGbDay} GB/day</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Latency:</span> <span className="text-amber-400">{node.latencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Replication Lag:</span> <span className="text-teal-400 font-bold">{node.replicationLagMs} ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distributed Architecture Pipeline Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Network className="w-4 h-4 text-teal-400" /> High Availability Cluster Topology
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="text-teal-400 font-bold block">1. Global Anycast Ingress</span>
            <p className="text-slate-400 text-[11px]">
              Cloudflare Magic Transit & Global Anycast IP routes endpoint agent telemetry to nearest regional SOC node.
            </p>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="text-cyan-400 font-bold block">2. Kafka Event Stream</span>
            <p className="text-slate-400 text-[11px]">
              High-throughput event mesh buffers 500,000+ EPS with multi-zone replication before SIEM indexing.
            </p>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="text-indigo-400 font-bold block">3. PostgreSQL WAL Replication</span>
            <p className="text-slate-400 text-[11px]">
              Streaming Write-Ahead Logs maintain real-time sync across primary & standby databases with automatic failover.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
