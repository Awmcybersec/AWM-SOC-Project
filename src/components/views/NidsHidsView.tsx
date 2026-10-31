import React, { useState, useEffect } from "react";
import {
  Network,
  Activity,
  Shield,
  Radio,
  Server,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Terminal,
  Cpu,
  Layers,
  Send,
  Zap,
  CheckCircle2,
  XCircle,
  Code,
  FileCode,
  Eye
} from "lucide-react";

export const NidsHidsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"flows" | "pcap" | "alerts" | "rules" | "sensors">("flows");
  const [flows, setFlows] = useState<any[]>([]);
  const [packets, setPackets] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterProtocol, setFilterProtocol] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPacket, setSelectedPacket] = useState<any | null>(null);

  // Ingestion Simulator State
  const [simUri, setSimUri] = useState("/match/c2/beacon?id=49201");
  const [simProtocol, setSimProtocol] = useState<"HTTP" | "DNS" | "TLS" | "SMB">("HTTP");
  const [simSrcIp, setSimSrcIp] = useState("192.168.1.150");
  const [simDstIp, setSimDstIp] = useState("185.220.101.5");
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchNdrData = async () => {
    setIsLoading(true);
    try {
      const [flowsRes, packetsRes, alertsRes, rulesRes, sensorsRes, statsRes] = await Promise.all([
        fetch("/api/ndr/flows"),
        fetch("/api/ndr/packets"),
        fetch("/api/ndr/alerts"),
        fetch("/api/ndr/rules"),
        fetch("/api/ndr/sensors"),
        fetch("/api/ndr/stats"),
      ]);

      const flowsData = await flowsRes.json();
      const packetsData = await packetsRes.json();
      const alertsData = await alertsRes.json();
      const rulesData = await rulesRes.json();
      const sensorsData = await sensorsRes.json();
      const statsData = await statsRes.json();

      setFlows(flowsData);
      setPackets(packetsData);
      setAlerts(alertsData);
      setRules(rulesData);
      setSensors(sensorsData);
      setStats(statsData);

      if (packetsData.length > 0 && !selectedPacket) {
        setSelectedPacket(packetsData[0]);
      }
    } catch (err) {
      console.error("Failed to load NDR data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNdrData();

    // Subscribe to SSE stream for real-time telemetry updates
    const eventSource = new EventSource("/api/ndr/stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "flow") {
          setFlows((prev) => [data.payload, ...prev.slice(0, 99)]);
        } else if (data.type === "alert") {
          setAlerts((prev) => [data.payload, ...prev.slice(0, 49)]);
        }
      } catch (e) {
        console.error("Error parsing SSE data", e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Simulator Handler
  const handleSimulateFlow = async () => {
    setIsSimulating(true);
    try {
      const payload: any = {
        protocol: simProtocol,
        sourceIp: simSrcIp,
        destinationIp: simDstIp,
        sourcePort: 51000 + Math.floor(Math.random() * 5000),
        destinationPort: simProtocol === "HTTP" ? 80 : simProtocol === "DNS" ? 53 : simProtocol === "TLS" ? 443 : 445,
        bytesSent: 1240,
        bytesReceived: 4096,
        packetsCount: 14,
      };

      if (simProtocol === "HTTP") {
        payload.httpMethod = "GET";
        payload.httpUri = simUri;
        payload.httpUserAgent = "Mozilla/5.0 (Windows NT 10.0; CobaltStrike)";
      } else if (simProtocol === "DNS") {
        payload.dnsQuery = simUri || "v9a8f219a8f01b942a19.txt.c2-exfil-dns.org";
      }

      await fetch("/api/ndr/flows/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await fetchNdrData();
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredFlows = flows.filter((f) => {
    const matchProto = filterProtocol === "ALL" || f.protocol === filterProtocol;
    const matchQuery =
      searchQuery === "" ||
      f.sourceIp?.includes(searchQuery) ||
      f.destinationIp?.includes(searchQuery) ||
      f.httpUri?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.dnsQuery?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchProto && matchQuery;
  });

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
              NIDS & NDR Deep Packet / Threat Engine
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold rounded">
                Suricata + Zeek + eBPF
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-Time DPI, C2 Beaconing Frequency, DNS Anomaly Detection & MITRE ATT&CK Mapping
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNdrData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg font-mono flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> SSE Stream Live
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium">Bandwidth Throughput</p>
              <p className="text-xl font-extrabold text-cyan-400 font-mono mt-1">
                {stats.bandwidthMbps} <span className="text-xs text-slate-500 font-sans">Mbps</span>
              </p>
            </div>
            <Activity className="w-6 h-6 text-cyan-400/50" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium">Active NDR Sensors</p>
              <p className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                {stats.activeSensors} <span className="text-xs text-slate-500 font-sans">/ {stats.totalSensors}</span>
              </p>
            </div>
            <Server className="w-6 h-6 text-emerald-400/50" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium">Network Flows Ingested</p>
              <p className="text-xl font-extrabold text-slate-100 font-mono mt-1">{stats.totalFlows}</p>
            </div>
            <Layers className="w-6 h-6 text-purple-400/50" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium">Intrusion Alerts</p>
              <p className="text-xl font-extrabold text-rose-400 font-mono mt-1">{stats.totalAlerts}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-rose-400/50" />
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab("flows")}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 ${
            activeTab === "flows"
              ? "bg-slate-800 text-cyan-400 border-t-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Network className="w-4 h-4" /> Flow Explorer ({flows.length})
        </button>

        <button
          onClick={() => setActiveTab("pcap")}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 ${
            activeTab === "pcap"
              ? "bg-slate-800 text-cyan-400 border-t-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Terminal className="w-4 h-4" /> Deep Packet Inspector (DPI)
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 ${
            activeTab === "alerts"
              ? "bg-slate-800 text-cyan-400 border-t-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Shield className="w-4 h-4" /> Intrusion Alerts ({alerts.length})
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 ${
            activeTab === "rules"
              ? "bg-slate-800 text-cyan-400 border-t-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Code className="w-4 h-4" /> Detection Rules ({rules.length})
        </button>

        <button
          onClick={() => setActiveTab("sensors")}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 ${
            activeTab === "sensors"
              ? "bg-slate-800 text-cyan-400 border-t-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Cpu className="w-4 h-4" /> Sensors ({sensors.length})
        </button>
      </div>

      {/* TAB 1: FLOW EXPLORER */}
      {activeTab === "flows" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold">Protocol:</span>
              {["ALL", "HTTP", "DNS", "TLS", "SMB", "SSH"].map((proto) => (
                <button
                  key={proto}
                  onClick={() => setFilterProtocol(proto)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                    filterProtocol === proto
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {proto}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search IP, URI or DNS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <th className="p-3">TIMESTAMP</th>
                  <th className="p-3">PROTO</th>
                  <th className="p-3">SOURCE</th>
                  <th className="p-3">DESTINATION</th>
                  <th className="p-3">DETAILS / PAYLOAD SUMMARY</th>
                  <th className="p-3">BYTES</th>
                  <th className="p-3">RISK SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredFlows.map((flow) => (
                  <tr key={flow.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(flow.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold rounded text-[10px]">
                        {flow.protocol}
                      </span>
                    </td>
                    <td className="p-3 text-slate-200">
                      {flow.sourceIp}:{flow.sourcePort}
                    </td>
                    <td className="p-3 text-slate-200">
                      {flow.destinationIp}:{flow.destinationPort}
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate font-sans">
                      {flow.httpUri ? (
                        <span className="text-amber-300">{flow.httpMethod} {flow.httpUri}</span>
                      ) : flow.dnsQuery ? (
                        <span className="text-purple-300">DNS Query: {flow.dnsQuery}</span>
                      ) : flow.ja3Hash ? (
                        <span className="text-emerald-300">JA3: {flow.ja3Hash}</span>
                      ) : (
                        `Packets: ${flow.packetsCount}, Duration: ${flow.durationMs}ms`
                      )}
                    </td>
                    <td className="p-3 text-slate-400">{flow.bytesSent + flow.bytesReceived} B</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          flow.riskScore >= 80
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : flow.riskScore >= 50
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {flow.riskScore} / 100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DEEP PACKET INSPECTOR (DPI) */}
      {activeTab === "pcap" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" /> Captured Packets
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {packets.map((pkt) => (
                <div
                  key={pkt.id}
                  onClick={() => setSelectedPacket(pkt)}
                  className={`p-3 rounded-lg border text-xs font-mono cursor-pointer transition ${
                    selectedPacket?.id === pkt.id
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-200"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400">{pkt.protocol}</span>
                    <span className="text-slate-500 text-[10px]">{pkt.id}</span>
                  </div>
                  <div className="text-[11px] mt-1 text-slate-200">
                    {pkt.sourceIp}:{pkt.sourcePort} &rarr; {pkt.destinationIp}:{pkt.destinationPort}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            {selectedPacket ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" /> Packet Hex/ASCII PCAP Inspector
                  </h3>
                  <span className="text-xs font-mono text-cyan-400 font-bold">{selectedPacket.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500">Source:</span>{" "}
                    <span className="text-slate-200 font-bold">{selectedPacket.sourceIp}:{selectedPacket.sourcePort}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Destination:</span>{" "}
                    <span className="text-slate-200 font-bold">{selectedPacket.destinationIp}:{selectedPacket.destinationPort}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Protocol:</span>{" "}
                    <span className="text-cyan-300 font-bold">{selectedPacket.protocol}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Flags:</span>{" "}
                    <span className="text-amber-300 font-bold">{selectedPacket.flags}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase font-mono">Hex Dump View</h4>
                  <pre className="p-4 bg-slate-950 text-cyan-300 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                    {selectedPacket.payloadHex}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase font-mono">ASCII Payload Representation</h4>
                  <pre className="p-4 bg-slate-950 text-emerald-300 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                    {selectedPacket.payloadAscii}
                  </pre>
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-xs text-center py-12">Select a packet from the list to inspect</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: INTRUSION ALERTS */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3 relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full ${
                    alert.severity === "CRITICAL"
                      ? "bg-rose-500"
                      : alert.severity === "HIGH"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                />

                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      alert.severity === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {alert.severity} INTRUSION ALERT
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-100">{alert.title}</h3>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                  <div>
                    <span className="text-slate-500">Src:</span> {alert.sourceIp}:{alert.sourcePort}
                  </div>
                  <div>
                    <span className="text-slate-500">Dst:</span> {alert.destinationIp}:{alert.destinationPort}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded font-mono text-[10px]">
                    MITRE: {alert.mitreTechnique}
                  </span>
                  <span className="text-cyan-400 font-mono text-[11px] font-bold">
                    C2 Score: {alert.c2ConfidenceScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DETECTION RULES & SIMULATOR */}
      {activeTab === "rules" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Detection Signatures</h3>
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-cyan-400 font-bold">{rule.id} (SID: {rule.sid || "N/A"})</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        rule.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-100">{rule.title}</h4>
                  <p className="text-xs text-slate-400">{rule.description}</p>
                  <pre className="p-2 bg-slate-950 text-amber-300 font-mono text-xs rounded border border-slate-800 overflow-x-auto">
                    {rule.patternExpression}
                  </pre>
                  <div className="text-[10px] text-purple-300 font-mono">MITRE: {rule.mitreTechnique}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SIMULATION PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 h-fit">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Packet Ingestion Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Inject synthetic network telemetry to trigger Suricata C2 beaconing and DNS tunneling detection rules.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Protocol:</label>
                <select
                  value={simProtocol}
                  onChange={(e) => setSimProtocol(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                >
                  <option value="HTTP">HTTP (Cobalt Strike Beacon)</option>
                  <option value="DNS">DNS (High Entropy Tunneling)</option>
                  <option value="TLS">TLS (Blacklisted JA3 Hash)</option>
                  <option value="SMB">SMB (Lateral Movement)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Payload / URI / Domain:</label>
                <input
                  type="text"
                  value={simUri}
                  onChange={(e) => setSimUri(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Source IP:</label>
                  <input
                    type="text"
                    value={simSrcIp}
                    onChange={(e) => setSimSrcIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Dest IP:</label>
                  <input
                    type="text"
                    value={simDstIp}
                    onChange={(e) => setSimDstIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleSimulateFlow}
                disabled={isSimulating}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition shadow flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> {isSimulating ? "Ingesting Packet..." : "Ingest Packet Payload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SENSORS */}
      {activeTab === "sensors" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sensors.map((sensor) => (
            <div key={sensor.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-mono text-xs text-cyan-400 font-bold">{sensor.sensorType}</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {sensor.status}
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-100">{sensor.name}</h3>

              <div className="space-y-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300">
                <div><span className="text-slate-500">Host:</span> {sensor.hostname}</div>
                <div><span className="text-slate-500">IP:</span> {sensor.ipAddress}</div>
                <div><span className="text-slate-500">Interface:</span> {sensor.interfaceName}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-center font-mono">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <p className="text-[10px] text-slate-500">PACKETS PROCESSED</p>
                  <p className="font-extrabold text-cyan-400 mt-1">{sensor.packetsProcessed.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <p className="text-[10px] text-slate-500">DROPS COUNT</p>
                  <p className="font-extrabold text-slate-300 mt-1">{sensor.dropsCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
