import "./config/env.js";
import { EventEmitter } from "events";
import { databaseStorage } from "./storage/databaseStorage.js";
export interface SiemLogEntry {
  id: string;
  timestamp: string;
  level: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
  sourceType: string;
  logSource?: string;
  serviceName?: string;
  host: string;
  sourceIp: string;
  ip?: string;
  destinationIp?: string;
  user?: string;
  category: string;
  eventId?: string | number;
  message: string;
  raw: string;
  rawJson?: string;
  ecs: Record<string, any>;
}

export interface SiemRule {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  logSource: string;
  conditionKql: string;
  timeWindowSeconds: number;
  thresholdCount: number;
  mitreTactic: string;
  mitreTechnique: string;
  enabled: boolean;
}

export interface SiemAlert {
  id: string;
  ruleId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  matchedLogCount: number;
  firstSeen: string;
  lastSeen: string;
  host: string;
  sourceIp: string;
  mitreTactic: string;
  mitreTechnique: string;
  status: "OPEN" | "INVESTIGATING" | "MITIGATED" | "FALSE_POSITIVE";
  triggerContext: Record<string, any>;
  createdAt: string;
}

export class SiemEngine extends EventEmitter {
  private logs: SiemLogEntry[] = [];
  private rules: SiemRule[] = [];
  private alerts: SiemAlert[] = [];
  private maxLogsInMemory = 5000;

 constructor() {
  super();

  if (process.env.ENABLE_DEMO_DATA === "true") {
    this.seedDefaultRules();
    this.seedInitialLogs();
  }

  void this.loadRulesFromDatabase();
}
private async loadRulesFromDatabase(): Promise<void> {
  try {
    const dbRules = await databaseStorage.getSiemRules();

    this.rules = dbRules.map((rule: any) => ({
      id: rule.id,
      title: rule.title,
      description: rule.description || "",
      severity: rule.severity,
      logSource: rule.log_source,
      conditionKql: rule.condition_kql,
      timeWindowSeconds: Number(rule.time_window_seconds),
      thresholdCount: Number(rule.threshold_count),
      mitreTactic: rule.mitre_tactic || "",
      mitreTechnique: rule.mitre_technique || "",
      enabled: rule.enabled === true,
    }));

    console.log(
      `[SIEM-DB] Rules loaded from PostgreSQL: ${this.rules.length} ` +
      `IDs=${this.rules.map((r) => r.id).join(",")}`
    );
  } catch (error) {
    console.error(
      "[SIEM-DB] Failed to load SIEM rules from PostgreSQL:",
      error
    );
  }
}
  // 1. Seed Initial Default Rules
  private seedDefaultRules() {
    this.rules = [
      {
        id: "RULE-101",
        title: "Multiple Failed SSH Authentication Attempts",
        description: "Triggers when a host receives multiple SSH login failures within 60 seconds.",
        severity: "HIGH",
        logSource: "Syslog",
        conditionKql: "level:WARN AND message:Failed",
        timeWindowSeconds: 60,
        thresholdCount: 3,
        mitreTactic: "Credential Access",
        mitreTechnique: "T1110 - Brute Force",
        enabled: true,
      },
      {
        id: "RULE-102",
        title: "Privileged AWS CloudTrail IAM Modification",
        description: "Detects deletion or policy attachment to admin role in AWS.",
        severity: "CRITICAL",
        logSource: "CloudTrail",
        conditionKql: "level:ERROR AND message:AttachRolePolicy",
        timeWindowSeconds: 120,
        thresholdCount: 1,
        mitreTactic: "Privilege Escalation",
        mitreTechnique: "T1098 - Account Manipulation",
        enabled: true,
      },
      {
        id: "RULE-103",
        title: "Windows Security Event Log Clearing",
        description: "Fired when event code 1102 (audit log cleared) is recorded on a domain controller.",
        severity: "CRITICAL",
        logSource: "WindowsEvent",
        conditionKql: "level:CRITICAL AND message:1102",
        timeWindowSeconds: 30,
        thresholdCount: 1,
        mitreTactic: "Defense Evasion",
        mitreTechnique: "T1070 - Indicator Removal",
        enabled: true,
      },
      {
        id: "RULE-104",
        title: "Kubernetes Cluster RBAC Escalation",
        description: "Detects binding cluster-admin role to unknown service account.",
        severity: "HIGH",
        logSource: "Kubernetes",
        conditionKql: "level:WARN AND message:ClusterRoleBinding",
        timeWindowSeconds: 300,
        thresholdCount: 1,
        mitreTactic: "Privilege Escalation",
        mitreTechnique: "T1611 - Escape to Host",
        enabled: true,
      },
    ];
  }

  // 2. Seed Initial Telemetry Logs
  private seedInitialLogs() {
    const defaultData: Array<Partial<SiemLogEntry> & { message: string }> = [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        level: "CRITICAL",
        sourceType: "WindowsEvent",
        serviceName: "Security-Auditing",
        host: "dc-primary.corp.local",
        sourceIp: "10.0.4.15",
        user: "NT AUTHORITY\\SYSTEM",
        category: "Audit Logging",
        eventId: 1102,
        message: "The audit log was cleared on host dc-primary.corp.local by user Administrator.",
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        level: "WARN",
        sourceType: "Syslog",
        serviceName: "sshd",
        host: "app-prod-01",
        sourceIp: "185.220.101.5",
        user: "root",
        category: "Authentication",
        eventId: 4625,
        message: "Failed password for root from 185.220.101.5 port 54822 ssh2 (Attempt 1)",
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        level: "WARN",
        sourceType: "Syslog",
        serviceName: "sshd",
        host: "app-prod-01",
        sourceIp: "185.220.101.5",
        user: "root",
        category: "Authentication",
        eventId: 4625,
        message: "Failed password for root from 185.220.101.5 port 54823 ssh2 (Attempt 2)",
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        level: "WARN",
        sourceType: "Syslog",
        serviceName: "sshd",
        host: "app-prod-01",
        sourceIp: "185.220.101.5",
        user: "root",
        category: "Authentication",
        eventId: 4625,
        message: "Failed password for root from 185.220.101.5 port 54824 ssh2 (Attempt 3)",
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        level: "ERROR",
        sourceType: "CloudTrail",
        serviceName: "iam.amazonaws.com",
        host: "aws-us-east-1",
        sourceIp: "198.51.100.44",
        user: "dev-service-account",
        category: "IAM",
        eventId: 201,
        message: "AttachRolePolicy operation invoked: AdministratorAccess attached to role SecurityAuditorRole by dev-service-account.",
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        level: "INFO",
        sourceType: "Kubernetes",
        serviceName: "kube-apiserver",
        host: "k8s-master-node-01",
        sourceIp: "10.244.0.1",
        user: "system:serviceaccount:default:build-bot",
        category: "Cluster Audit",
        eventId: 1001,
        message: "User system:serviceaccount:default:build-bot requested GET /api/v1/namespaces/default/pods.",
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        level: "WARN",
        sourceType: "PaloAltoFirewall",
        serviceName: "pan-os-threat",
        host: "fw-edge-01.corp",
        sourceIp: "192.168.1.105",
        destinationIp: "185.220.101.5",
        user: "j.doe",
        category: "Network Flow",
        eventId: 3002,
        message: "THREAT: Suspicious outbound DNS TXT tunneling query detected to C2 server 185.220.101.5.",
      },
    ];

    for (const d of defaultData) {
      this.ingestRawLog(d);
    }
  }

  // 3. Ingest & Normalize Log to Elastic Common Schema (ECS)
  public ingestRawLog(rawInput: Partial<SiemLogEntry> & { message: string }): SiemLogEntry {
    const id = `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const timestamp = rawInput.timestamp || new Date().toISOString();
    const level = (rawInput.level || "INFO").toUpperCase() as SiemLogEntry["level"];
    const sourceType = rawInput.sourceType || "Syslog";
    const host = rawInput.host || "host-unknown";
    const sourceIp = rawInput.sourceIp || "127.0.0.1";
    const user = rawInput.user || "system";
    const category = rawInput.category || "General";
    const message = rawInput.message;

    // Build Elastic Common Schema (ECS) v8.x structure
    const ecs = {
      "@timestamp": timestamp,
      log: {
        level,
        original: message,
      },
      event: {
        id: id,
        kind: "event",
        category: [category],
        type: [sourceType],
        code: rawInput.eventId || 0,
      },
      host: {
        name: host,
        ip: [sourceIp],
      },
      source: {
        ip: sourceIp,
      },
      destination: rawInput.destinationIp ? { ip: rawInput.destinationIp } : undefined,
      user: {
        name: user,
      },
      service: {
        name: rawInput.serviceName || sourceType,
      },
    };

    const entry: SiemLogEntry = {
      id,
      timestamp,
      level,
      sourceType,
      serviceName: rawInput.serviceName,
      host,
      sourceIp,
      destinationIp: rawInput.destinationIp,
      user,
      category,
      eventId: rawInput.eventId,
      message,
      raw: JSON.stringify(ecs),
      ecs,
    };

    // Store log
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.pop();
    }
    // Persist real SIEM log to PostgreSQL
void databaseStorage.saveSiemLog({
  id: entry.id,
  timestamp: entry.timestamp,
  level: entry.level,
  sourceType: entry.sourceType,
  serviceName: entry.serviceName,
  host: entry.host,
  sourceIp: entry.sourceIp,
  destinationIp: entry.destinationIp,
  user: entry.user,
  category: entry.category,
  eventId: entry.eventId,
  message: entry.message,
  ecs: entry.ecs,
})
  .then(() => {
    console.log(
      `[SIEM-DB] Log persisted to PostgreSQL: ${entry.id}`
    );
  })
  .catch((error) => {
    console.error(
      `[SIEM-DB] Failed to persist log ${entry.id}:`,
      error
    );
  });

   // Emit live event for subscribers (SSE)
this.emit("new_log", entry);

// Run Real-Time Correlation Engine
console.log(
  `[SIEM-DEBUG] Starting correlation evaluation for log=${entry.id} ` +
  `source=${entry.sourceType} level=${entry.level}`
);

void this.evaluateCorrelationRules(entry)
  .then(() => {
    console.log(
      `[SIEM-DEBUG] Correlation evaluation completed for log=${entry.id}`
    );
  })
  .catch((error) => {
    console.error(
      "[SIEM] Failed to evaluate correlation rules:",
      error
    );
  });

return entry;
  }

// 4. Real-time Correlation Engine Logic
private async evaluateCorrelationRules(newLog: SiemLogEntry) {

  console.log(
    `[SIEM-DEBUG] Rules loaded=${this.rules.length} ` +
    `IDs=${this.rules.map((r) => r.id).join(",")}`
  );

  for (const rule of this.rules) {
    if (!rule.enabled) continue;

    console.log(
      `[SIEM-CORRELATION] Rule=${rule.id} source=${rule.logSource} ` +
      `newLogSource=${newLog.sourceType} level=${newLog.level} ` +
      `message="${newLog.message}"`
    );
    
   // Check KQL match against this single log
const kqlMatched = this.matchesKql(
  newLog,
  rule.conditionKql
);

console.log(
  `[SIEM-CORRELATION] Rule=${rule.id} ` +
  `KQL="${rule.conditionKql}" matched=${kqlMatched}`
);

if (!kqlMatched) {
  continue;
}

    // Time window
    const windowStart = new Date(
      new Date(newLog.timestamp).getTime() -
        rule.timeWindowSeconds * 1000
    );

    // Find matching logs inside the correlation window
    const matchingLogsInWindow = this.logs.filter((l) => {
      const sourceMatches =
        rule.logSource === "ALL" ||
        l.sourceType.toLowerCase() === rule.logSource.toLowerCase();

      if (!sourceMatches) {
        return false;
      }

      return (
        this.matchesKql(l, rule.conditionKql) &&
        new Date(l.timestamp).getTime() >= windowStart.getTime()
      );
    });

    // Threshold reached
    console.log(
  `[SIEM-CORRELATION] Rule=${rule.id} ` +
  `matchingLogs=${matchingLogsInWindow.length} ` +
  `threshold=${rule.thresholdCount}`
);
if (matchingLogsInWindow.length >= rule.thresholdCount) {
      // Check whether an open alert already exists
      const existingAlert = this.alerts.find(
        (a) =>
          a.ruleId === rule.id &&
          a.host === newLog.host &&
          a.status === "OPEN"
      );

      if (existingAlert) {
        existingAlert.matchedLogCount =
          matchingLogsInWindow.length;

        existingAlert.lastSeen = newLog.timestamp;

        continue;
      }

      // Create new SIEM alert
      const alert: SiemAlert = {
        id: `ALT-${Date.now().toString().slice(-6)}`,
        ruleId: rule.id,
        title: rule.title,
        severity: rule.severity,
        matchedLogCount: matchingLogsInWindow.length,
        firstSeen:
          matchingLogsInWindow[
            matchingLogsInWindow.length - 1
          ]?.timestamp || newLog.timestamp,
        lastSeen: newLog.timestamp,
        host: newLog.host,
        sourceIp: newLog.sourceIp,
        mitreTactic: rule.mitreTactic,
        mitreTechnique: rule.mitreTechnique,
        status: "OPEN",
        triggerContext: {
          ruleKql: rule.conditionKql,
          timeWindowSeconds: rule.timeWindowSeconds,
          thresholdCount: rule.thresholdCount,
          sampleLogId: newLog.id,
        },
        createdAt: new Date().toISOString(),
      };

      // Store in memory
      this.alerts.unshift(alert);

      // Emit real-time alert
      this.emit("new_alert", alert);

      // Persist alert to PostgreSQL
      try {
        const dbAlert = await databaseStorage.createSiemAlert({
          ruleId: alert.ruleId,
          title: alert.title,
          severity: alert.severity,
          matchedLogCount: alert.matchedLogCount,
          firstSeen: alert.firstSeen,
          lastSeen: alert.lastSeen,
          host: alert.host,
          sourceIp: alert.sourceIp,
          mitreTactic: alert.mitreTactic,
          mitreTechnique: alert.mitreTechnique,
          status: alert.status,
          triggerContext: alert.triggerContext,
        });

        console.log(
          `[SIEM] Alert persisted to PostgreSQL: ${dbAlert.id}`
        );
      } catch (error) {
        console.error(
          "[SIEM] Failed to persist alert to PostgreSQL:",
          error
        );
      }
    }
  }
}
  // 5. KQL Query Evaluation Parser
  public matchesKql(log: SiemLogEntry, kqlQuery: string): boolean {
    if (!kqlQuery || kqlQuery.trim() === "") return true;

    // Simple expression parser supporting AND clauses and key:value expressions
    const terms = kqlQuery.split(/\s+AND\s+/i);

    for (const term of terms) {
      const trimmed = term.trim();

      if (trimmed.includes(":")) {
        const [key, rawValue] = trimmed.split(":");
        const cleanKey = key.trim().toLowerCase();
        const cleanValue = rawValue.replace(/["']/g, "").trim().toLowerCase();
        console.log(
  `[SIEM-KQL] key=${cleanKey} expected=${cleanValue}`
);


        let fieldValue = "";

        if (cleanKey === "level") fieldValue = log.level.toLowerCase();
        else if (cleanKey === "host" || cleanKey === "hostname") fieldValue = log.host.toLowerCase();
        else if (cleanKey === "sourceip" || cleanKey === "ip") fieldValue = log.sourceIp.toLowerCase();
        else if (cleanKey === "user" || cleanKey === "username") fieldValue = (log.user || "").toLowerCase();
        else if (cleanKey === "sourcetype" || cleanKey === "source") fieldValue = log.sourceType.toLowerCase();
        else if (cleanKey === "category") fieldValue = log.category.toLowerCase();
        else if (cleanKey === "message") fieldValue = log.message.toLowerCase();
        else if (cleanKey === "eventid") fieldValue = String(log.eventId || "");

        console.log(
  `[SIEM-KQL] key=${cleanKey} actual="${fieldValue}" expected="${cleanValue}" match=${fieldValue.includes(cleanValue)}`
);

        if (!fieldValue.includes(cleanValue)) {
          return false;
        }
      } else {
        // Free text search in message or raw log
        const cleanTerm = trimmed.replace(/["']/g, "").toLowerCase();
        const matchesMessage = log.message.toLowerCase().includes(cleanTerm);
        const matchesHost = log.host.toLowerCase().includes(cleanTerm);
        const matchesIp = log.sourceIp.toLowerCase().includes(cleanTerm);

        if (!matchesMessage && !matchesHost && !matchesIp) {
          return false;
        }
      }
    }

    return true;
  }

 // 6. Query SIEM Logs with KQL Filter, Date Range, Level Filter, Pagination
public async queryLogs(params: {
  kql?: string;
  level?: string;
  sourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    // Read actual SIEM logs from PostgreSQL
    const dbLogs = await databaseStorage.getRecentSiemLogs(5000);

    // Convert PostgreSQL siem_logs -> dashboard SIEM format
    let filtered: SiemLogEntry[] = dbLogs.map((log: any) => {
      let ecs: Record<string, any> = {};

      try {
        ecs =
          log.ecs_raw && typeof log.ecs_raw === "object"
            ? log.ecs_raw
            : log.ecs_raw
              ? JSON.parse(log.ecs_raw)
              : {};
      } catch {
        ecs = {};
      }

      const level = String(log.log_level || "INFO").toUpperCase();

      const sourceType = log.source_type || "Unknown";
      const logSource = log.service_name || sourceType;

      const host = log.host_name || "host-unknown";

      const sourceIp =
        log.source_ip ||
        ecs?.source?.ip ||
        "127.0.0.1";

      const destinationIp =
        log.destination_ip ||
        ecs?.destination?.ip;

      const user =
        log.user_name ||
        ecs?.user?.name ||
        "system";

      const category =
        log.event_category ||
        ecs?.event?.category?.[0] ||
        "Security";

      const eventId =
        log.event_id ??
        ecs?.event?.code ??
        ecs?.event?.id;

      const message =
        log.message ||
        ecs?.log?.original ||
        "Security event";

      return {
        id: String(log.id),

        timestamp: new Date(log.timestamp).toISOString(),

        level: level as SiemLogEntry["level"],

        sourceType,

        logSource,

        serviceName: log.service_name || sourceType,

        host,

        sourceIp,

        ip: sourceIp,

        destinationIp,

        user,

        category,

        eventId,

        message,

        raw: JSON.stringify(ecs),

        rawJson: JSON.stringify(ecs),

        ecs: ecs && Object.keys(ecs).length > 0
          ? ecs
          : {
              "@timestamp": new Date(log.timestamp).toISOString(),

              log: {
                level,
                original: message,
              },

              event: {
                id: String(log.id),
                kind: "event",
                category: ["security"],
                type: [category],
                code: eventId,
              },

              host: {
                name: host,
                ip: [sourceIp],
              },

              source: {
                ip: sourceIp,
              },

              ...(destinationIp
                ? {
                    destination: {
                      ip: destinationIp,
                    },
                  }
                : {}),

              user: {
                name: user,
              },
            },
      };
    });

    // Level filter
    if (params.level && params.level !== "ALL") {
      filtered = filtered.filter(
        (log) =>
          String(log.level).toUpperCase() ===
          String(params.level).toUpperCase()
      );
    }

    // Source filter
    if (params.sourceType && params.sourceType !== "ALL") {
      filtered = filtered.filter(
        (log) =>
          String(log.sourceType).toLowerCase() ===
          String(params.sourceType).toLowerCase()
      );
    }

    // Start date filter
    if (params.startDate) {
      const start = new Date(params.startDate).getTime();

      filtered = filtered.filter(
        (log) =>
          new Date(log.timestamp).getTime() >= start
      );
    }

    // End date filter
    if (params.endDate) {
      const end = new Date(params.endDate).getTime();

      filtered = filtered.filter(
        (log) =>
          new Date(log.timestamp).getTime() <= end
      );
    }

    // KQL filter
    if (params.kql) {
      filtered = filtered.filter((log) =>
        this.matchesKql(log, params.kql!)
      );
    }

    const total = filtered.length;

    const limit = params.limit ?? 50;

    const offset = params.offset ?? 0;

    const paginated = filtered.slice(
      offset,
      offset + limit
    );

    console.log(
      `[SIEM-QUERY] PostgreSQL siem_logs total=${total} returned=${paginated.length} offset=${offset} limit=${limit}`
    );

    return {
      total,
      limit,
      offset,
      logs: paginated,
    };
  } catch (error) {
    console.error(
      "[SIEM] Failed to query PostgreSQL siem_logs:",
      error
    );

    throw error;
  }
}
  // 7. Get Telemetry Statistics
  public getStats() {
    const totalLogs = this.logs.length;
    const levelCounts: Record<string, number> = {
      TRACE: 0,
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      CRITICAL: 0,
    };

    const sourceCounts: Record<string, number> = {};
    const topHostsMap: Record<string, number> = {};

    for (const log of this.logs) {
      levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
      sourceCounts[log.sourceType] = (sourceCounts[log.sourceType] || 0) + 1;
      topHostsMap[log.host] = (topHostsMap[log.host] || 0) + 1;
    }

    const topHosts = Object.entries(topHostsMap)
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalLogs,
      ingestionRatePerSec: Math.min(25000, 120 + Math.floor(Math.random() * 85)),
      levelCounts,
      sourceCounts,
      topHosts,
      totalAlerts: this.alerts.length,
      activeRules: this.rules.filter((r) => r.enabled).length,
    };
  }

  // 8. Rules CRUD
  public getRules(): SiemRule[] {
    return this.rules;
  }

  public addRule(rule: SiemRule): SiemRule {
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

  // 9. Alerts Query
  public getAlerts(): SiemAlert[] {
    return this.alerts;
  }
}

export const siemEngine = new SiemEngine();
