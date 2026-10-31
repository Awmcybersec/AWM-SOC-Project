import { windowsLogger } from "../windows/windowsLogger.js";

export interface AttackPathNode {
  id: string;
  label: string;
  type: "ENTRY_VECTOR" | "COMPROMISED_HOST" | "PIVOT_POINT" | "PRIVILEGE_ESCALATION" | "CROWN_JEWEL_TARGET";
  ipAddress: string;
  assetCriticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  compromiseProbability: number; // 0 - 100
  mitreTechniqueId: string;
  description: string;
}

export interface AttackPathEdge {
  sourceId: string;
  targetId: string;
  relationship: "EXPLOITS" | "PIVOTS_TO" | "LEVERAGES_CREDS_ON" | "EXFILTRATES_FROM";
  protocolPort: string;
}

export interface CyberKillChainStage {
  stageNumber: number;
  stageName: "Reconnaissance" | "Weaponization" | "Delivery" | "Exploitation" | "Installation" | "Command & Control" | "Actions on Objectives";
  activeThreatCount: number;
  mitreTechniqueIds: string[];
  status: "NORMAL" | "ELEVATED" | "CRITICAL";
  recentDetections: string[];
}

export interface ThreatHuntQueryResult {
  queryId: string;
  queryAwmQl: string;
  executedAt: string;
  matchedEventsCount: number;
  affectedEndpoints: string[];
  associatedIocs: string[];
  threatGroupMatch?: string;
  matchedLogs: Array<{
    timestamp: string;
    source: string;
    host: string;
    eventSummary: string;
    confidenceScore: number;
  }>;
}

class AdvancedAnalyticsEngine {
  private killChainStages: CyberKillChainStage[] = [
    {
      stageNumber: 1,
      stageName: "Reconnaissance",
      activeThreatCount: 14,
      mitreTechniqueIds: ["T1595", "T1590", "T1592"],
      status: "ELEVATED",
      recentDetections: ["Port scan detected from 185.220.101.99", "Subdomain enumeration query targeting API gateway"],
    },
    {
      stageNumber: 2,
      stageName: "Weaponization",
      activeThreatCount: 3,
      mitreTechniqueIds: ["T1587", "T1588"],
      status: "NORMAL",
      recentDetections: ["Obfuscated PowerShell payload generated with Invoke-Obfuscation"],
    },
    {
      stageNumber: 3,
      stageName: "Delivery",
      activeThreatCount: 8,
      mitreTechniqueIds: ["T1566", "T1193", "T1189"],
      status: "ELEVATED",
      recentDetections: ["Spearphishing attachment blocked by email gateway"],
    },
    {
      stageNumber: 4,
      stageName: "Exploitation",
      activeThreatCount: 5,
      mitreTechniqueIds: ["T1203", "T1059", "T1055"],
      status: "CRITICAL",
      recentDetections: ["Buffer overflow exploitation in LSASS process on DC-PRIMARY-01"],
    },
    {
      stageNumber: 5,
      stageName: "Installation",
      activeThreatCount: 4,
      mitreTechniqueIds: ["T1547", "T1053", "T1543"],
      status: "ELEVATED",
      recentDetections: ["Registry run key persistence injected on WORKSTATION-88"],
    },
    {
      stageNumber: 6,
      stageName: "Command & Control",
      activeThreatCount: 7,
      mitreTechniqueIds: ["T1071", "T1095", "T1573"],
      status: "CRITICAL",
      recentDetections: ["Encrypted HTTPS beaconing to C2 node 185.220.101.99 every 60s"],
    },
    {
      stageNumber: 7,
      stageName: "Actions on Objectives",
      activeThreatCount: 2,
      mitreTechniqueIds: ["T1486", "T1041", "T1490"],
      status: "CRITICAL",
      recentDetections: ["Ransomware file encryption attempt blocked by Autonomous Response Engine"],
    },
  ];

  private attackPathNodes: AttackPathNode[] = [
    {
      id: "NODE-1",
      label: "Public Web Gateway",
      type: "ENTRY_VECTOR",
      ipAddress: "198.51.100.10",
      assetCriticality: "HIGH",
      compromiseProbability: 85,
      mitreTechniqueId: "T1190",
      description: "Exposed Nginx Reverse Proxy running vulnerable OpenSSL library",
    },
    {
      id: "NODE-2",
      label: "DMZ Application Server",
      type: "COMPROMISED_HOST",
      ipAddress: "10.0.1.15",
      assetCriticality: "HIGH",
      compromiseProbability: 92,
      mitreTechniqueId: "T1059",
      description: "Remote code execution triggered via deserialization vulnerability",
    },
    {
      id: "NODE-3",
      label: "Internal Admin Jump Box",
      type: "PIVOT_POINT",
      ipAddress: "10.0.2.8",
      assetCriticality: "HIGH",
      compromiseProbability: 78,
      mitreTechniqueId: "T1021",
      description: "Lateral movement via harvested SSH private key",
    },
    {
      id: "NODE-4",
      label: "Active Directory Domain Controller",
      type: "PRIVILEGE_ESCALATION",
      ipAddress: "10.0.0.5",
      assetCriticality: "CRITICAL",
      compromiseProbability: 96,
      mitreTechniqueId: "T1055",
      description: "LSASS process injection & Kerberoasting privilege escalation to Domain Admin",
    },
    {
      id: "NODE-5",
      label: "SQL Customer Vault Database",
      type: "CROWN_JEWEL_TARGET",
      ipAddress: "10.0.3.100",
      assetCriticality: "CRITICAL",
      compromiseProbability: 99,
      mitreTechniqueId: "T1486",
      description: "Exfiltration target containing encrypted customer PII and transaction records",
    },
  ];

  private attackPathEdges: AttackPathEdge[] = [
    { sourceId: "NODE-1", targetId: "NODE-2", relationship: "EXPLOITS", protocolPort: "TCP/443" },
    { sourceId: "NODE-2", targetId: "NODE-3", relationship: "PIVOTS_TO", protocolPort: "TCP/22" },
    { sourceId: "NODE-3", targetId: "NODE-4", relationship: "LEVERAGES_CREDS_ON", protocolPort: "TCP/88 (Kerberos)" },
    { sourceId: "NODE-4", targetId: "NODE-5", relationship: "EXFILTRATES_FROM", protocolPort: "TCP/5432 (PostgreSQL)" },
  ];

  public calculateMultiFactorRiskScore(assetCriticalityWeight: number, cvssScore: number, threatIntelScore: number, uebaAnomalyScore: number): number {
    // Multi-factor formula: Risk = (Criticality * 0.25) + (CVSS * 3.5) + (ThreatIntel * 0.25) + (UEBA * 0.15)
    const rawScore = assetCriticalityWeight * 2.5 + cvssScore * 3.5 + threatIntelScore * 0.25 + uebaAnomalyScore * 0.15;
    return Math.min(100, Math.max(0, Math.round(rawScore)));
  }

  public getKillChainStatus(): CyberKillChainStage[] {
    return this.killChainStages;
  }

  public getAttackPathGraph(): { nodes: AttackPathNode[]; edges: AttackPathEdge[] } {
    return {
      nodes: this.attackPathNodes,
      edges: this.attackPathEdges,
    };
  }

  public executeThreatHuntQuery(awmQlQuery: string): ThreatHuntQueryResult {
    windowsLogger.audit("THREAT_HUNTING", `Executed AWM-QL query: '${awmQlQuery}'`);

    const matchedLogs = [
      {
        timestamp: new Date().toISOString(),
        source: "Windows Security EventLog (4624)",
        host: "DC-PRIMARY-01",
        eventSummary: "Explicit credential logon using Kerberos Ticket Granting Ticket (TGT) for svc_backup",
        confidenceScore: 98,
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        source: "Kernel eBPF Memory Probe",
        host: "WORKSTATION-88",
        eventSummary: "VirtualAllocEx memory allocation detected with PAGE_EXECUTE_READWRITE permissions",
        confidenceScore: 94,
      },
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        source: "PaloAlto NextGen Firewall",
        host: "GW-BORDER-01",
        eventSummary: "Outbound HTTPS connection to IP 185.220.101.99 matching APT29 C2 IOC Signature",
        confidenceScore: 99,
      },
    ];

    return {
      queryId: `HUNT-${Date.now().toString(36).toUpperCase()}`,
      queryAwmQl: awmQlQuery,
      executedAt: new Date().toISOString(),
      matchedEventsCount: matchedLogs.length,
      affectedEndpoints: ["DC-PRIMARY-01", "WORKSTATION-88", "GW-BORDER-01"],
      associatedIocs: ["185.220.101.99", "8f92a1029e81f182c19a", "apt29-domain-c2.org"],
      threatGroupMatch: "APT29 (Cozy Bear / Midnight Blizzard)",
      matchedLogs,
    };
  }
}

export const advancedAnalyticsEngine = new AdvancedAnalyticsEngine();
