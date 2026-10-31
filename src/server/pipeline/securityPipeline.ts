import { aiGateway } from "../ai/aiGateway.js";
import { Severity } from "../../types.js";

export interface RawTelemetryEvent {
  source: "WINDOWS_EVENT_LOG" | "LINUX_SYSLOG" | "NETWORK_EVENT" | "ENDPOINT_EDR" | "WAZUH_SIEM" | "THREAT_INTEL";
  host: string;
  user?: string;
  process?: string;
  commandLine?: string;
  sourceIp?: string;
  destinationIp?: string;
  destinationPort?: number;
  rawPayload: string;
  timestamp?: string;
}

export interface NormalizedSecurityEvent {
  eventId: string;
  source: string;
  host: string;
  user: string;
  category: string;
  severity: Severity;
  threatScore: number;
  aiVerdict: string;
  mitreTactic: string;
  mitreTechnique: string;
  automatedResponseTriggered: boolean;
  actionTaken?: string;
  timestamp: string;
}

export class SecurityMonitoringPipeline {
  private eventHistory: NormalizedSecurityEvent[] = [];

  public async processTelemetry(raw: RawTelemetryEvent): Promise<NormalizedSecurityEvent> {
    const eventId = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = raw.timestamp || new Date().toISOString();

    // 1. Normalization Step
    const normalizedUser = raw.user || "SYSTEM";
    const category = this.categorizeEvent(raw);

    // 2. AI Analysis & Threat Scoring Step
    const aiResult = await aiGateway.analyzeThreat({
      title: `${raw.source} Event on ${raw.host}`,
      category,
      severity: "HIGH",
      device: raw.host,
      sourceIp: raw.sourceIp || "127.0.0.1",
      targetIp: raw.destinationIp,
    });

    const severity = this.mapScoreToSeverity(aiResult.threatScore);

    // 3. Automated Response Decision
    let automatedResponseTriggered = false;
    let actionTaken: string | undefined = undefined;

    if (aiResult.threatScore >= 80) {
      automatedResponseTriggered = true;
      actionTaken = `Isolated host [${raw.host}] and revoked tokens for user [${normalizedUser}].`;
    }

    const processedEvent: NormalizedSecurityEvent = {
      eventId,
      source: raw.source,
      host: raw.host,
      user: normalizedUser,
      category,
      severity,
      threatScore: aiResult.threatScore,
      aiVerdict: aiResult.verdict,
      mitreTactic: "Execution / Persistence",
      mitreTechnique: "Command and Scripting Interpreter (T1059)",
      automatedResponseTriggered,
      actionTaken,
      timestamp,
    };

    this.eventHistory.unshift(processedEvent);
    if (this.eventHistory.length > 500) {
      this.eventHistory.pop();
    }

    return processedEvent;
  }

  public getPipelineEvents(): NormalizedSecurityEvent[] {
    return [...this.eventHistory];
  }

  private categorizeEvent(raw: RawTelemetryEvent): string {
    if (raw.source === "WINDOWS_EVENT_LOG" || raw.commandLine?.includes("powershell")) {
      return "POWERSHELL_EXECUTION";
    }
    if (raw.source === "NETWORK_EVENT" || raw.destinationPort) {
      return "NETWORK_EXFILTRATION";
    }
    if (raw.source === "WAZUH_SIEM") {
      return "SIEM_RULE_MATCH";
    }
    return "ENDPOINT_SUSPICIOUS_BEHAVIOR";
  }

  private mapScoreToSeverity(score: number): Severity {
    if (score >= 85) return "Critical";
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  }
}

export const securityPipeline = new SecurityMonitoringPipeline();
