// AWM Cyber AI Enterprise - AI Decision Engine
// Real-time threat scoring, confidence calculation, MITRE mapping, and decision triage

import { GoogleGenAI } from "@google/genai";

export type BusinessImpact = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AssetType = "User workstation" | "Server" | "Domain Controller" | "Database" | "Cloud Resource" | "Production System";
export type DecisionMode = "CRITICAL_AUTOMATION" | "HUMAN_APPROVAL" | "MONITOR_MODE";

export interface MitreMapping {
  tactic: string;
  technique: string;
  techniqueId: string;
}

export interface ThreatIntelReputation {
  ipReputationScore: number; // 0-100
  domainReputationScore: number; // 0-100
  hashReputationScore: number; // 0-100
  previousIncidentsCount: number;
  knownMalicious: boolean;
  threatActor?: string;
}

export interface ThreatEvaluationInput {
  alertId?: string;
  title: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sourceIp?: string;
  targetIp?: string;
  domain?: string;
  fileHash?: string;
  device?: string;
  user?: string;
  rawLogs?: string[];
  threatIntel?: ThreatIntelReputation;
  assetCriticality?: AssetType;
}

export interface DecisionResult {
  decisionId: string;
  timestamp: string;
  threatScore: number; // 0-100
  confidenceScore: number; // 0-100
  businessImpact: BusinessImpact;
  assetCriticality: AssetType;
  mitreMapping: MitreMapping;
  mode: DecisionMode;
  recommendedAction: string;
  alternativeActions: string[];
  reasoning: string;
  evidence: string[];
}

export class AiDecisionEngine {
  private genAI?: GoogleGenAI;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }

  public evaluateThreat(input: ThreatEvaluationInput): DecisionResult {
    // 1. Calculate Base Threat Score (0-100)
    let threatScore = 50;
    if (input.severity === "CRITICAL") threatScore = 95;
    else if (input.severity === "HIGH") threatScore = 80;
    else if (input.severity === "MEDIUM") threatScore = 55;
    else threatScore = 30;

    // Adjust based on Threat Intel
    if (input.threatIntel) {
      if (input.threatIntel.knownMalicious) threatScore = Math.min(100, threatScore + 10);
      if (input.threatIntel.previousIncidentsCount > 3) threatScore = Math.min(100, threatScore + 5);
    }

    // 2. Calculate Confidence Score (0-100)
    let confidenceScore = 85;
    if (input.fileHash && input.threatIntel?.hashReputationScore && input.threatIntel.hashReputationScore > 90) {
      confidenceScore = 98;
    } else if (input.sourceIp && input.threatIntel?.ipReputationScore && input.threatIntel.ipReputationScore > 90) {
      confidenceScore = 96;
    } else if (input.rawLogs && input.rawLogs.length > 5) {
      confidenceScore = 92;
    }

    // 3. Asset Criticality & Business Impact
    const assetCriticality: AssetType = input.assetCriticality || this.deduceAssetCriticality(input);
    const businessImpact: BusinessImpact = this.calculateBusinessImpact(assetCriticality, input.severity);

    // 4. MITRE ATT&CK Mapping
    const mitreMapping = this.mapMitreAttack(input);

    // 5. Determine Mode
    let mode: DecisionMode = "MONITOR_MODE";
    if (threatScore >= 95 && confidenceScore >= 95) {
      mode = "CRITICAL_AUTOMATION";
    } else if (threatScore >= 70 && threatScore <= 94) {
      mode = "HUMAN_APPROVAL";
    } else {
      mode = "MONITOR_MODE";
    }

    // 6. Formulate Actions
    const target = input.sourceIp || input.domain || input.fileHash || input.device || input.user || "Unknown Asset";
    let recommendedAction = `Block IP ${target}`;
    if (input.device && !input.sourceIp) {
      recommendedAction = `Isolate Endpoint Network (${input.device})`;
    } else if (input.user && !input.sourceIp) {
      recommendedAction = `Disable User Account (${input.user})`;
    } else if (input.fileHash) {
      recommendedAction = `Blacklist Hash & Quarantine File (${input.fileHash.slice(0, 10)}...)`;
    }

    const alternativeActions = [
      `Apply Temporary 24-Hour Block Rule on ${target}`,
      `Revoke User Active Sessions & Enforce Step-up MFA`,
      `Quarantine Process and Log Network Telemetry`
    ];

    const reasoning = `AWM AI Assistant evaluated threat "${input.title}" with a calculated Threat Score of ${threatScore}/100 and Confidence of ${confidenceScore}%. Asset criticality is ${assetCriticality} with business impact ${businessImpact}.`;

    const evidence = [
      `Severity classification: ${input.severity}`,
      `MITRE Technique: ${mitreMapping.technique} (${mitreMapping.techniqueId})`,
      input.sourceIp ? `Source IP identified: ${input.sourceIp}` : null,
      input.threatIntel?.threatActor ? `Associated Threat Actor: ${input.threatIntel.threatActor}` : null,
      input.rawLogs?.[0] ? `Telemetry match: ${input.rawLogs[0]}` : null,
    ].filter(Boolean) as string[];

    return {
      decisionId: `DEC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      threatScore,
      confidenceScore,
      businessImpact,
      assetCriticality,
      mitreMapping,
      mode,
      recommendedAction,
      alternativeActions,
      reasoning,
      evidence,
    };
  }

  private deduceAssetCriticality(input: ThreatEvaluationInput): AssetType {
    const dev = (input.device || "").toUpperCase();
    const usr = (input.user || "").toUpperCase();
    if (dev.includes("DC") || dev.includes("DOMAIN") || usr.includes("ADMIN")) return "Domain Controller";
    if (dev.includes("DB") || dev.includes("POSTGRES") || dev.includes("SQL")) return "Database";
    if (dev.includes("PROD") || dev.includes("K8S")) return "Production System";
    if (dev.includes("AWS") || dev.includes("AZURE") || dev.includes("GCP")) return "Cloud Resource";
    if (dev.includes("SRV") || dev.includes("SERVER")) return "Server";
    return "User workstation";
  }

  private calculateBusinessImpact(asset: AssetType, severity: string): BusinessImpact {
    if (asset === "Domain Controller" || asset === "Production System") {
      return severity === "CRITICAL" || severity === "HIGH" ? "CRITICAL" : "HIGH";
    }
    if (asset === "Database" || asset === "Cloud Resource") {
      return severity === "CRITICAL" ? "CRITICAL" : "HIGH";
    }
    if (asset === "Server") return severity === "CRITICAL" ? "HIGH" : "MEDIUM";
    return severity === "CRITICAL" ? "MEDIUM" : "LOW";
  }

  private mapMitreAttack(input: ThreatEvaluationInput): MitreMapping {
    const title = (input.title + " " + input.category).toLowerCase();
    if (title.includes("brute") || title.includes("credential")) {
      return { tactic: "Credential Access", technique: "Brute Force", techniqueId: "T1110" };
    }
    if (title.includes("ransomware") || title.includes("encrypt")) {
      return { tactic: "Impact", technique: "Data Encrypted for Impact", techniqueId: "T1486" };
    }
    if (title.includes("phishing") || title.includes("spear")) {
      return { tactic: "Initial Access", technique: "Phishing", techniqueId: "T1566" };
    }
    if (title.includes("beacon") || title.includes("c2") || title.includes("command")) {
      return { tactic: "Command and Control", technique: "Application Layer Protocol", techniqueId: "T1071" };
    }
    if (title.includes("privilege") || title.includes("escalation")) {
      return { tactic: "Privilege Escalation", technique: "Exploitation for Privilege Escalation", techniqueId: "T1068" };
    }
    return { tactic: "Defense Evasion", technique: "Obfuscated Files or Information", techniqueId: "T1027" };
  }
}

export const aiDecisionEngine = new AiDecisionEngine();
