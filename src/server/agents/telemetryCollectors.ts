import { EventEmitter } from "events";
import { AgentOsType } from "./agentManagementEngine.js";
import { databaseStorage } from "../storage/databaseStorage.js";

export type TelemetryEventType =
  | "WINDOWS_EVENT_LOG"
  | "SYSMON_PROCESS_CREATE"
  | "SYSMON_NETWORK_CONNECTION"
  | "LINUX_AUDIT_EXECVE"
  | "LINUX_SSH_LOGIN"
  | "FIREWALL_EVENT"
  | string;

export type TelemetrySeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface TelemetryEvent {
  id: string;
  agentId: string;
  hostname: string;
  osType: AgentOsType;
  eventType: TelemetryEventType;
  severity: TelemetrySeverity;
  timestamp: string;
  source: string;
  payload: Record<string, any>;
}

export interface RawWindowsEventPayload {
  eventId: number;
  channel?: string;
  providerName?: string;
  message?: string;
  user?: string;
  processName?: string;
  processId?: number;
  commandLine?: string;
  parentProcessName?: string;
  destIp?: string;
  destPort?: number;
  rawXml?: string;
}

export interface RawLinuxEventPayload {
  syscall?: string;
  executable?: string;
  commandLine?: string;
  user?: string;
  uid?: number;
  pid?: number;
  ppid?: number;
  terminal?: string;
  remoteIp?: string;
  authResult?: "SUCCESS" | "FAILED";
  serviceName?: string;
  rawAuditLog?: string;
}

export interface RawNetworkEventPayload {
  srcIp: string;
  srcPort: number;
  destIp: string;
  destPort: number;
  protocol: "TCP" | "UDP" | "ICMP" | string;
  action: "ALLOW" | "DENY" | "REJECT" | "DROP";
  bytesSent?: number;
  bytesReceived?: number;
  direction?: "INBOUND" | "OUTBOUND";
  ruleName?: string;
}

export class TelemetryCollectorEngine extends EventEmitter {
  private eventsBuffer: TelemetryEvent[] = [];
  private maxBufferSize: number = 5000;

 constructor() {
  super();
   if (process.env.ENABLE_DEMO_DATA === "true") {
      this.seedSampleTelemetry();
   }
}

  /**
   * Primary ingestion endpoint for normalized or pre-formatted telemetry events
   */
  public collectEvent(
  event: Omit<TelemetryEvent, "id" | "timestamp"> & {
    id?: string;
    timestamp?: string;
  }
): TelemetryEvent {
  const fullEvent: TelemetryEvent = {
    id:
      event.id ||
      `TEL-${Date.now().toString(36).toUpperCase()}-${Math.floor(
        Math.random() * 10000
      )}`,
    agentId: event.agentId,
    hostname: event.hostname,
    osType: event.osType,
    eventType: event.eventType,
    severity: event.severity || "INFO",
    timestamp: event.timestamp || new Date().toISOString(),
    source: event.source || "xdr-sensor",
    payload: event.payload || {},
  };

  // Real-time in-memory buffer
  this.eventsBuffer.unshift(fullEvent);

  // Protect memory from unlimited growth
  if (this.eventsBuffer.length > 10000) {
    this.eventsBuffer.length = 10000;
  }

  // Persistent PostgreSQL storage
  databaseStorage
    .saveSecurityEvent({
      id: fullEvent.id,
      module: "TELEMETRY",
      eventType: fullEvent.eventType,
      severity: fullEvent.severity,
      agentId: fullEvent.agentId,
      hostname: fullEvent.hostname,
      osType: fullEvent.osType,
      source: fullEvent.source,
      timestamp: fullEvent.timestamp,
      payload: fullEvent.payload,
    })
    .catch((error) => {
      console.error(
        "[TelemetryCollector] PostgreSQL persistence failed:",
        error
      );
    });

  return fullEvent;
}
  /**
   * Normalizes raw Windows Security Event Logs and Sysmon records into TelemetryEvent structure
   */
  public normalizeWindowsEvent(
    agentId: string,
    hostname: string,
    osType: AgentOsType,
    raw: RawWindowsEventPayload
  ): TelemetryEvent {
    let eventType: TelemetryEventType = "WINDOWS_EVENT_LOG";
    let severity: TelemetrySeverity = "INFO";

    if (raw.eventId === 4688 || raw.eventId === 1) {
      eventType = "SYSMON_PROCESS_CREATE";
      severity = raw.commandLine?.includes("powershell -enc") || raw.commandLine?.includes("cmd.exe /c") ? "HIGH" : "LOW";
    } else if (raw.eventId === 3) {
      eventType = "SYSMON_NETWORK_CONNECTION";
      severity = "LOW";
    } else if (raw.eventId === 4625) {
      severity = "MEDIUM"; // Failed logon
    } else if (raw.eventId === 1102 || raw.eventId === 104) {
      severity = "HIGH"; // Audit log cleared
    }

    return this.collectEvent({
      agentId,
      hostname,
      osType: osType || "WINDOWS_SERVER",
      eventType,
      severity,
      source: raw.providerName || "Microsoft-Windows-Security-Auditing",
      payload: {
        eventId: raw.eventId,
        channel: raw.channel || "Security",
        user: raw.user || "SYSTEM",
        processName: raw.processName,
        processId: raw.processId,
        commandLine: raw.commandLine,
        parentProcessName: raw.parentProcessName,
        destIp: raw.destIp,
        destPort: raw.destPort,
        message: raw.message,
        rawXml: raw.rawXml,
      },
    });
  }

  /**
   * Normalizes raw Linux auditd records and SSH auth logs into TelemetryEvent structure
   */
  public normalizeLinuxEvent(
    agentId: string,
    hostname: string,
    osType: AgentOsType,
    raw: RawLinuxEventPayload
  ): TelemetryEvent {
    let eventType: TelemetryEventType = "LINUX_AUDIT_EXECVE";
    let severity: TelemetrySeverity = "INFO";

    if (raw.authResult) {
      eventType = "LINUX_SSH_LOGIN";
      severity = raw.authResult === "FAILED" ? "MEDIUM" : "LOW";
    } else if (raw.executable?.includes("/bin/nc") || raw.executable?.includes("/usr/bin/nmap")) {
      severity = "HIGH";
    }

    return this.collectEvent({
      agentId,
      hostname,
      osType: osType || "LINUX_SERVER",
      eventType,
      severity,
      source: "auditd/sshd",
      payload: {
        syscall: raw.syscall || "execve",
        executable: raw.executable,
        commandLine: raw.commandLine,
        user: raw.user || "root",
        uid: raw.uid ?? 0,
        pid: raw.pid,
        ppid: raw.ppid,
        terminal: raw.terminal,
        remoteIp: raw.remoteIp,
        authResult: raw.authResult,
        serviceName: raw.serviceName,
        rawAuditLog: raw.rawAuditLog,
      },
    });
  }

  /**
   * Normalizes raw network firewall and flow logs into TelemetryEvent structure
   */
  public normalizeNetworkEvent(
    agentId: string,
    hostname: string,
    osType: AgentOsType,
    raw: RawNetworkEventPayload
  ): TelemetryEvent {
    let severity: TelemetrySeverity = "INFO";

    if (raw.action === "DENY" || raw.action === "DROP") {
      severity = raw.destPort === 22 || raw.destPort === 3389 || raw.destPort === 445 ? "MEDIUM" : "LOW";
    }

    return this.collectEvent({
      agentId,
      hostname,
      osType,
      eventType: "FIREWALL_EVENT",
      severity,
      source: "Windows Firewall / iptables",
      payload: {
        srcIp: raw.srcIp,
        srcPort: raw.srcPort,
        destIp: raw.destIp,
        destPort: raw.destPort,
        protocol: raw.protocol,
        action: raw.action,
        bytesSent: raw.bytesSent,
        bytesReceived: raw.bytesReceived,
        direction: raw.direction || "OUTBOUND",
        ruleName: raw.ruleName,
      },
    });
  }

  /**
   * Query buffer for recent events with flexible filtering
   */
  public getRecentEvents(query?: {
    agentId?: string;
    eventType?: TelemetryEventType;
    severity?: TelemetrySeverity;
    limit?: number;
  }): TelemetryEvent[] {
    let result = [...this.eventsBuffer];

    if (query?.agentId) {
      result = result.filter((e) => e.agentId === query.agentId);
    }

    if (query?.eventType) {
      result = result.filter((e) => e.eventType === query.eventType);
    }

    if (query?.severity) {
      result = result.filter((e) => e.severity === query.severity);
    }

    const limit = query?.limit && query.limit > 0 ? query.limit : 100;
    return result.slice(0, limit);
  }

  /**
   * Seed realistic sample telemetry events across Windows and Linux endpoints
   */
  private seedSampleTelemetry(): void {
    const now = new Date();

    // 1. Sysmon process create (Powershell encoded command on Windows Server)
    this.normalizeWindowsEvent("AGT-WIN-001", "WIN-SEC-DC01", "WINDOWS_SERVER", {
      eventId: 1,
      channel: "Microsoft-Windows-Sysmon/Operational",
      providerName: "Sysmon",
      user: "NT AUTHORITY\\SYSTEM",
      processName: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
      processId: 4812,
      commandLine: "powershell.exe -e Q2hhbmdlUGFzc3dvcmQgLWFsbCA...",
      parentProcessName: "C:\\Windows\\System32\\cmd.exe",
    });

    // 2. Linux SSH Login Failure
    this.normalizeLinuxEvent("AGT-LNX-001", "LINUX-APP-NODE01", "LINUX_SERVER", {
      executable: "/usr/sbin/sshd",
      user: "root",
      authResult: "FAILED",
      remoteIp: "185.220.101.5",
      rawAuditLog: "Failed password for root from 185.220.101.5 port 42810 ssh2",
    });

    // 3. Sysmon Network Connection to suspicious C2 port
    this.normalizeWindowsEvent("AGT-WIN-002", "DESKTOP-SOC-ANALYST", "WINDOWS_11", {
      eventId: 3,
      channel: "Microsoft-Windows-Sysmon/Operational",
      providerName: "Sysmon",
      user: "CORP\\jdoe",
      processName: "C:\\Users\\jdoe\\AppData\\Local\\Temp\\svchost.exe",
      processId: 8192,
      destIp: "45.33.32.156",
      destPort: 4444,
    });

    // 4. Linux Execve on Kali Linux
    this.normalizeLinuxEvent("AGT-KALI-001", "KALI-REDTEAM-LAB", "KALI_LINUX", {
      executable: "/usr/bin/nmap",
      commandLine: "nmap -sS -p 1-65535 192.168.1.0/24",
      user: "kali",
      uid: 1000,
      pid: 14209,
    });

    // 5. Firewall Block Event
    this.normalizeNetworkEvent("AGT-WIN-001", "WIN-SEC-DC01", "WINDOWS_SERVER", {
      srcIp: "10.0.99.15",
      srcPort: 51234,
      destIp: "192.168.1.10",
      destPort: 445,
      protocol: "TCP",
      action: "DENY",
      direction: "INBOUND",
      ruleName: "Block-Inbound-SMB-Untrusted",
    });
  }
}

export const telemetryCollectorEngine = new TelemetryCollectorEngine();
