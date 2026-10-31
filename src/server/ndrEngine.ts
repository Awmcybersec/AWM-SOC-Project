import { EventEmitter } from "events";
import { siemEngine } from "./siemEngine";

export interface NdrSensor {
  id: string;
  name: string;
  sensorType: "SURICATA" | "ZEEK" | "EBPF_PROBE" | "NETFLOW_AGENT";
  hostname: string;
  ipAddress: string;
  interfaceName: string;
  status: "ACTIVE" | "DEGRADED" | "OFFLINE";
  packetsProcessed: number;
  dropsCount: number;
  lastHeartbeat: string;
}

export interface NetworkFlow {
  id: string;
  sensorId: string;
  timestamp: string;
  protocol: "HTTP" | "DNS" | "TLS" | "SSH" | "SMB" | "TCP" | "UDP";
  sourceIp: string;
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  bytesSent: number;
  bytesReceived: number;
  packetsCount: number;
  durationMs: number;
  ja3Hash?: string;
  sniHostname?: string;
  dnsQuery?: string;
  httpMethod?: string;
  httpUri?: string;
  httpUserAgent?: string;
  riskScore: number;
  createdAt: string;
}

export interface NetworkPacket {
  id: string;
  flowId?: string;
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  payloadLength: number;
  payloadHex: string;
  payloadAscii: string;
  flags: string;
}

export interface NdrDetectionRule {
  id: string;
  sid?: number;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ruleType: "SURICATA_SIG" | "ZEEK_SCRIPT" | "DNS_ANOMALY" | "C2_BEACON" | "LATERAL_MOVE";
  patternExpression: string;
  mitreTactic: string;
  mitreTechnique: string;
  enabled: boolean;
}

export interface IntrusionAlert {
  id: string;
  ruleId?: string;
  sensorId: string;
  timestamp: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sourceIp: string;
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  protocol: string;
  mitreTactic: string;
  mitreTechnique: string;
  c2ConfidenceScore: number;
  status: "OPEN" | "INVESTIGATING" | "MITIGATED" | "FALSE_POSITIVE";
  packetEvidenceId?: string;
  createdAt: string;
}

export class NdrEngine extends EventEmitter {
  private sensors: NdrSensor[] = [];
  private flows: NetworkFlow[] = [];
  private packets: NetworkPacket[] = [];
  private rules: NdrDetectionRule[] = [];
  private alerts: IntrusionAlert[] = [];
  private maxHistory = 3000;

  constructor() {
    super();

    if (process.env.ENABLE_DEMO_DATA === "true") {
   this.seedInitialFlowsAndPackets();
}
  }
  // 1. Seed Sensors
  private seedSensors() {
    this.sensors = [
      {
        id: "SENSOR-SURICATA-01",
        name: "Primary Edge Suricata NIDS",
        sensorType: "SURICATA",
        hostname: "suricata-node-01.corp",
        ipAddress: "10.0.1.10",
        interfaceName: "eth0",
        status: "ACTIVE",
        packetsProcessed: 18459200,
        dropsCount: 12,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: "SENSOR-ZEEK-01",
        name: "Core Network Zeek Protocol Analyzer",
        sensorType: "ZEEK",
        hostname: "zeek-node-01.corp",
        ipAddress: "10.0.1.11",
        interfaceName: "eth1",
        status: "ACTIVE",
        packetsProcessed: 24100500,
        dropsCount: 0,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: "SENSOR-EBPF-01",
        name: "Host eBPF Kernel Network Probe",
        sensorType: "EBPF_PROBE",
        hostname: "app-prod-host-01",
        ipAddress: "10.0.4.12",
        interfaceName: "veth0",
        status: "ACTIVE",
        packetsProcessed: 8920100,
        dropsCount: 3,
        lastHeartbeat: new Date().toISOString(),
      },
    ];
  }

  // 2. Seed Detection Rules
  private seedRules() {
    this.rules = [
      {
        id: "NDR-RULE-201",
        sid: 2028101,
        title: "ET TROJAN Cobalt Strike Malleable HTTP C2 Beaconing",
        description: "Detects Cobalt Strike default HTTP GET metadata payload in URI",
        severity: "CRITICAL",
        ruleType: "SURICATA_SIG",
        patternExpression: "http.uri contains '/match/c2/beacon'",
        mitreTactic: "Command and Control",
        mitreTechnique: "T1071.001 - Web Protocols",
        enabled: true,
      },
      {
        id: "NDR-RULE-202",
        sid: 2028102,
        title: "DNS High Entropy TXT Tunneling Query",
        description: "Detects DNS queries with high Shannon entropy indicative of Iodine / Dnscat2 C2",
        severity: "HIGH",
        ruleType: "DNS_ANOMALY",
        patternExpression: "dns.entropy > 4.2 AND type == 'TXT'",
        mitreTactic: "Command and Control",
        mitreTechnique: "T1071.004 - DNS C2",
        enabled: true,
      },
      {
        id: "NDR-RULE-203",
        sid: 2028103,
        title: "Internal SMB Pass-the-Hash / Lateral Movement Sweep",
        description: "Detects high frequency SMB connection bursts across internal subnets",
        severity: "HIGH",
        ruleType: "LATERAL_MOVE",
        patternExpression: "protocol == 'SMB' AND flow.packets > 15",
        mitreTactic: "Lateral Movement",
        mitreTechnique: "T1021.002 - SMB/Windows Admin Shares",
        enabled: true,
      },
      {
        id: "NDR-RULE-204",
        sid: 2028104,
        title: "JA3 Blacklisted SSL/TLS Malware Fingerprint Match",
        description: "Matches SSL Client Hello JA3 fingerprint against known Ransomware C2 infrastructure",
        severity: "CRITICAL",
        ruleType: "SURICATA_SIG",
        patternExpression: "ja3 == '7225725203138b1933e0856edc95e1e1'",
        mitreTactic: "Command and Control",
        mitreTechnique: "T1573 - Encrypted Channel",
        enabled: true,
      },
    ];
  }

  // 3. Seed Initial Flow Telemetry and Packets
  private seedInitialFlowsAndPackets() {
    const defaultFlows: Partial<NetworkFlow>[] = [
      {
        sensorId: "SENSOR-SURICATA-01",
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        protocol: "HTTP",
        sourceIp: "192.168.1.105",
        sourcePort: 51204,
        destinationIp: "185.220.101.5",
        destinationPort: 80,
        bytesSent: 1420,
        bytesReceived: 4096,
        packetsCount: 18,
        durationMs: 340,
        httpMethod: "GET",
        httpUri: "/match/c2/beacon?id=492019&meta=a3910c",
        httpUserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CobaltStrike/4.8",
        riskScore: 95,
      },
      {
        sensorId: "SENSOR-ZEEK-01",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        protocol: "DNS",
        sourceIp: "192.168.1.105",
        sourcePort: 61102,
        destinationIp: "10.0.0.2",
        destinationPort: 53,
        bytesSent: 280,
        bytesReceived: 512,
        packetsCount: 4,
        durationMs: 45,
        dnsQuery: "v9a8f219a8f01b942a19.txt.c2-exfil-dns.org",
        riskScore: 88,
      },
      {
        sensorId: "SENSOR-SURICATA-01",
        timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        protocol: "TLS",
        sourceIp: "10.0.4.15",
        sourcePort: 49210,
        destinationIp: "198.51.100.88",
        destinationPort: 443,
        bytesSent: 12500,
        bytesReceived: 88200,
        packetsCount: 64,
        durationMs: 1250,
        ja3Hash: "7225725203138b1933e0856edc95e1e1",
        sniHostname: "update-check-service.net",
        riskScore: 92,
      },
      {
        sensorId: "SENSOR-EBPF-01",
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        protocol: "SMB",
        sourceIp: "10.0.4.15",
        sourcePort: 445,
        destinationIp: "10.0.4.20",
        destinationPort: 445,
        bytesSent: 45000,
        bytesReceived: 1200,
        packetsCount: 22,
        durationMs: 180,
        riskScore: 78,
      },
      {
        sensorId: "SENSOR-ZEEK-01",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        protocol: "HTTP",
        sourceIp: "10.0.2.14",
        sourcePort: 58920,
        destinationIp: "172.217.16.206",
        destinationPort: 80,
        bytesSent: 420,
        bytesReceived: 1240,
        packetsCount: 6,
        durationMs: 85,
        httpMethod: "GET",
        httpUri: "/index.html",
        httpUserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        riskScore: 5,
      },
    ];

    for (const f of defaultFlows) {
      this.ingestFlow(f);
    }
  }

  // 4. Ingest Flow & Deep Packet Inspection (DPI)
  public ingestFlow(rawFlow: Partial<NetworkFlow>): NetworkFlow {
    const id = `FLOW-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const timestamp = rawFlow.timestamp || new Date().toISOString();
    const sensorId = rawFlow.sensorId || "SENSOR-SURICATA-01";
    const protocol = (rawFlow.protocol || "TCP") as NetworkFlow["protocol"];
    const sourceIp = rawFlow.sourceIp || "192.168.1.100";
    const sourcePort = rawFlow.sourcePort || 50000 + Math.floor(Math.random() * 10000);
    const destinationIp = rawFlow.destinationIp || "10.0.0.1";
    const destinationPort = rawFlow.destinationPort || 80;

    let riskScore = rawFlow.riskScore || 0;

    // Calculate DNS Entropy for DNS tunneling detection
    let dnsEntropy = 0;
    if (protocol === "DNS" && rawFlow.dnsQuery) {
      dnsEntropy = this.calculateEntropy(rawFlow.dnsQuery);
      if (dnsEntropy > 4.2) {
        riskScore = Math.max(riskScore, 85);
      }
    }

    // Check JA3 Hash against Blacklist
    if (protocol === "TLS" && rawFlow.ja3Hash === "7225725203138b1933e0856edc95e1e1") {
      riskScore = 95;
    }

    const flow: NetworkFlow = {
      id,
      sensorId,
      timestamp,
      protocol,
      sourceIp,
      sourcePort,
      destinationIp,
      destinationPort,
      bytesSent: rawFlow.bytesSent || 512,
      bytesReceived: rawFlow.bytesReceived || 1024,
      packetsCount: rawFlow.packetsCount || 8,
      durationMs: rawFlow.durationMs || 120,
      ja3Hash: rawFlow.ja3Hash,
      sniHostname: rawFlow.sniHostname,
      dnsQuery: rawFlow.dnsQuery,
      httpMethod: rawFlow.httpMethod,
      httpUri: rawFlow.httpUri,
      httpUserAgent: rawFlow.httpUserAgent,
      riskScore,
      createdAt: new Date().toISOString(),
    };

    // Store Flow
    this.flows.unshift(flow);
    if (this.flows.length > this.maxHistory) {
      this.flows.pop();
    }

    // Generate Raw Packet PCAP Inspection Payload for DPI
    const packet = this.generatePacketEvidence(flow);
    this.packets.unshift(packet);
    if (this.packets.length > this.maxHistory) {
      this.packets.pop();
    }

    // Evaluate NDR Rules against this Flow
    this.evaluateRulesForFlow(flow, packet, dnsEntropy);

    // Update Sensor Stats
    const sensor = this.sensors.find((s) => s.id === sensorId);
    if (sensor) {
      sensor.packetsProcessed += flow.packetsCount;
      sensor.lastHeartbeat = new Date().toISOString();
    }

    // Emit live event for SSE subscribers
    this.emit("new_flow", flow);

    return flow;
  }

  // 5. Generate Packet PCAP Evidence (Hex / ASCII)
  private generatePacketEvidence(flow: NetworkFlow): NetworkPacket {
    const payloadText =
      flow.protocol === "HTTP"
        ? `${flow.httpMethod || "GET"} ${flow.httpUri || "/"} HTTP/1.1\r\nHost: ${flow.destinationIp}\r\nUser-Agent: ${flow.httpUserAgent || "curl/7.68.0"}\r\n\r\n`
        : flow.protocol === "DNS"
        ? `\x00\x01\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00 ${flow.dnsQuery || "example.com"}`
        : flow.protocol === "TLS"
        ? `\x16\x03\x01\x00\xba\x01\x00\x00\xb6\x03\x03 SNI: ${flow.sniHostname || "server.com"} JA3: ${flow.ja3Hash || "3b5073"}`
        : `\x00\x00\x00\x2d\xff\x53\x4d\x42 SMB Payload Protocol Request from ${flow.sourceIp}`;

    const hex = Buffer.from(payloadText).toString("hex").match(/.{1,2}/g)?.join(" ") || "00 00";

    return {
      id: `PKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      flowId: flow.id,
      timestamp: flow.timestamp,
      sourceIp: flow.sourceIp,
      destinationIp: flow.destinationIp,
      sourcePort: flow.sourcePort,
      destinationPort: flow.destinationPort,
      protocol: flow.protocol,
      payloadLength: payloadText.length,
      payloadHex: hex,
      payloadAscii: payloadText.replace(/[^\x20-\x7E]/g, "."),
      flags: "PSH, ACK",
    };
  }

  // 6. Shannon Entropy Calculation for High-Entropy Domain / Payload Detection
  public calculateEntropy(text: string): number {
    if (!text || text.length === 0) return 0;
    const freq: Record<string, number> = {};
    for (const char of text) {
      freq[char] = (freq[char] || 0) + 1;
    }
    let entropy = 0;
    const len = text.length;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    return Math.round(entropy * 100) / 100;
  }

  // 7. Rule Evaluation Engine
  private evaluateRulesForFlow(flow: NetworkFlow, packet: NetworkPacket, dnsEntropy: number) {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      let matched = false;

      if (rule.ruleType === "SURICATA_SIG") {
        if (rule.patternExpression.includes("c2/beacon") && flow.httpUri?.includes("/match/c2/beacon")) {
          matched = true;
        } else if (rule.patternExpression.includes("7225725203138b1933e0856edc95e1e1") && flow.ja3Hash === "7225725203138b1933e0856edc95e1e1") {
          matched = true;
        }
      } else if (rule.ruleType === "DNS_ANOMALY") {
        if (dnsEntropy > 4.2 || (flow.dnsQuery && flow.dnsQuery.includes("c2-exfil"))) {
          matched = true;
        }
      } else if (rule.ruleType === "LATERAL_MOVE") {
        if (flow.protocol === "SMB" && flow.packetsCount >= 15) {
          matched = true;
        }
      }

      if (matched) {
        const alert: IntrusionAlert = {
          id: `NDR-ALT-${Date.now().toString().slice(-6)}`,
          ruleId: rule.id,
          sensorId: flow.sensorId,
          timestamp: flow.timestamp,
          title: rule.title,
          severity: rule.severity,
          sourceIp: flow.sourceIp,
          sourcePort: flow.sourcePort,
          destinationIp: flow.destinationIp,
          destinationPort: flow.destinationPort,
          protocol: flow.protocol,
          mitreTactic: rule.mitreTactic,
          mitreTechnique: rule.mitreTechnique,
          c2ConfidenceScore: rule.severity === "CRITICAL" ? 95 : 80,
          status: "OPEN",
          packetEvidenceId: packet.id,
          createdAt: new Date().toISOString(),
        };

        this.alerts.unshift(alert);
        this.emit("new_alert", alert);

        // Cross-Module Integration: Forward High-Severity NDR Alert to SIEM Engine!
        siemEngine.ingestRawLog({
          timestamp: alert.timestamp,
          level: alert.severity === "CRITICAL" ? "CRITICAL" : "WARN",
          sourceType: "NIDS_Suricata",
          serviceName: "ndr-sensor-pipeline",
          host: alert.sourceIp,
          sourceIp: alert.sourceIp,
          destinationIp: alert.destinationIp,
          category: "Network Intrusion",
          eventId: 3001,
          message: `NIDS ALERT: ${alert.title} detected from ${alert.sourceIp}:${alert.sourcePort} -> ${alert.destinationIp}:${alert.destinationPort} [MITRE ${alert.mitreTechnique}]`,
        });
      }
    }
  }

  // 8. Queries
  public queryFlows(params: { protocol?: string; sourceIp?: string; destinationIp?: string; limit?: number }) {
    let result = [...this.flows];
    if (params.protocol && params.protocol !== "ALL") {
      result = result.filter((f) => f.protocol.toLowerCase() === params.protocol!.toLowerCase());
    }
    if (params.sourceIp) {
      result = result.filter((f) => f.sourceIp.includes(params.sourceIp!));
    }
    if (params.destinationIp) {
      result = result.filter((f) => f.destinationIp.includes(params.destinationIp!));
    }

    const limit = params.limit || 50;
    return result.slice(0, limit);
  }

  public getPackets(): NetworkPacket[] {
    return this.packets;
  }

  public getPacketById(id: string): NetworkPacket | undefined {
    return this.packets.find((p) => p.id === id);
  }

  public getAlerts(): IntrusionAlert[] {
    return this.alerts;
  }

  public getSensors(): NdrSensor[] {
    return this.sensors;
  }

  public getRules(): NdrDetectionRule[] {
    return this.rules;
  }

  public addRule(rule: NdrDetectionRule): NdrDetectionRule {
    this.rules.unshift(rule);
    return rule;
  }

  public deleteRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx !== -1) {
      this.rules.splice(idx, 1);
      return true;
    }
    return false;
  }

  public getStats() {
    const totalFlows = this.flows.length;
    let totalBytes = 0;
    const protocolBreakdown: Record<string, number> = {};

    for (const f of this.flows) {
      totalBytes += f.bytesSent + f.bytesReceived;
      protocolBreakdown[f.protocol] = (protocolBreakdown[f.protocol] || 0) + 1;
    }

    const activeSensors = this.sensors.filter((s) => s.status === "ACTIVE").length;

    return {
      totalFlows,
      totalBytes,
      activeSensors,
      totalSensors: this.sensors.length,
      protocolBreakdown,
      totalAlerts: this.alerts.length,
      activeRules: this.rules.filter((r) => r.enabled).length,
      bandwidthMbps: Math.round((totalBytes * 8) / (1024 * 1024) * 10) / 10 + 45.2,
    };
  }
}

export const ndrEngine = new NdrEngine();
