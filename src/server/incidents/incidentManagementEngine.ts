// AWM AI SOC SENIOR - Incident Response Management System Engine
// Handles full Incident Response Lifecycle, Investigation Notes, Evidence Locker, Response Audits & Reports.

import { EventEmitter } from "events";
import { Incident, Severity, IncidentNote, DigitalEvidence, IncidentResponseRecord } from "../../types.js";

export class IncidentManagementEngine extends EventEmitter {
  private incidents: Incident[] = [
    {
      id: "INC-2026-8801",
      title: "Ransomware Pre-Execution & Process Injection on WIN-DC01",
      severity: "Critical",
      status: "Investigating",
      assignee: "Alex Rivera (L3 Responder)",
      createdTime: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedTime: new Date(Date.now() - 60000 * 15).toISOString(),
      source: "EDR + SIEM Correlation",
      affectedAssets: ["WIN-DC01", "SQL-PROD-02"],
      associatedAlertIds: ["ALT-9021", "ALT-9022"],
      investigationNotes: [
        {
          id: "NOTE-1",
          timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
          author: "SIEM Correlation Engine",
          note: "Detected LSASS memory access from process powershell.exe (PID 4821) followed by outbound C2 communication to 185.220.101.5.",
        },
        {
          id: "NOTE-2",
          timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
          author: "Alex Rivera",
          note: "Isolated host WIN-DC01. Dumped RAM sample for sandbox static analysis. Revoked domain Kerberos TGT for compromised account CORP\\svc_backup.",
        },
      ],
      evidence: [
        {
          id: "EVD-101",
          filename: "lsass_dump_20260805.dmp",
          fileType: "Memory Dump",
          hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          collectedTime: new Date(Date.now() - 3600000 * 2).toISOString(),
          collector: "EDR Driver Agent v4.2",
          sizeKb: 142050,
        },
        {
          id: "EVD-102",
          filename: "network_capture_pcap.pcapng",
          fileType: "PCAP Packet Trace",
          hash: "a81d4b68e0b12b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c",
          collectedTime: new Date(Date.now() - 3600000 * 1.8).toISOString(),
          collector: "NDR DPI Sensor Port 443",
          sizeKb: 28400,
        },
      ],
      responseHistory: [
        {
          id: "ACT-1",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          action: "ISOLATE_ENDPOINT",
          actor: "Alex Rivera",
          outcome: "Endpoint network interface locked. Agent RPC preserved.",
        },
        {
          id: "ACT-2",
          timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
          action: "BLOCK_C2_IP",
          actor: "SOAR Automated Rule",
          outcome: "IP 185.220.101.5 blocked across Palo Alto & Fortinet firewall mesh.",
        },
      ],
      reportSummary: "Ransomware staging vector identified. Credential harvesting blocked before domain controller compromise completed.",
    },
    {
      id: "INC-2026-8802",
      title: "Suspicious Large Volume S3 Exfiltration from K8s Node",
      severity: "High",
      status: "Containment",
      assignee: "Sarah Chen (L2 Analyst)",
      createdTime: new Date(Date.now() - 3600000 * 6).toISOString(),
      updatedTime: new Date(Date.now() - 3600000 * 1).toISOString(),
      source: "UEBA Anomaly Tracker",
      affectedAssets: ["k8s-worker-us-east-04"],
      associatedAlertIds: ["ALT-9008"],
      investigationNotes: [
        {
          id: "NOTE-1",
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          author: "Sarah Chen",
          note: "Anomalous 14.8 GB outbound stream to external IP 45.33.22.11 during off-hours (03:14 UTC).",
        },
      ],
      evidence: [
        {
          id: "EVD-201",
          filename: "aws_cloudtrail_audit.json",
          fileType: "API Audit Logs",
          hash: "7f8e9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e",
          collectedTime: new Date(Date.now() - 3600000 * 4).toISOString(),
          collector: "AWS CloudTrail SIEM Sink",
          sizeKb: 12400,
        },
      ],
      responseHistory: [
        {
          id: "ACT-1",
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          action: "REVOKE_IAM_KEY",
          actor: "Sarah Chen",
          outcome: "AWS IAM Access Key AKIA...REVOKED successfully.",
        },
      ],
    },
    {
      id: "INC-2026-8803",
      title: "Multi-Factor Authentication Fatigue Attack on C-Suite Account",
      severity: "Medium",
      status: "Remediated",
      assignee: "Marcus Vance (L1 Triage)",
      createdTime: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedTime: new Date(Date.now() - 3600000 * 8).toISOString(),
      source: "Identity Governance Engine",
      affectedAssets: ["Azure AD / Entra ID"],
      associatedAlertIds: ["ALT-8991"],
      investigationNotes: [
        {
          id: "NOTE-1",
          timestamp: new Date(Date.now() - 3600000 * 11).toISOString(),
          author: "Marcus Vance",
          note: "42 push notifications sent in 3 minutes to CEO device from Nigerian IP 105.112.44.12.",
        },
      ],
      evidence: [],
      responseHistory: [
        {
          id: "ACT-1",
          timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
          action: "ENFORCE_NUMBER_MATCHING",
          actor: "Marcus Vance",
          outcome: "MFA upgraded to FIDO2 Hardware Token Requirement.",
        },
      ],
    },
  ];

  public getIncidents(): Incident[] {
    return this.incidents;
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.find((inc) => inc.id === id);
  }

  public createIncident(data: {
    title: string;
    severity: Severity;
    assignee?: string;
    source?: string;
    affectedAssets?: string[];
    associatedAlertIds?: string[];
    initialNote?: string;
  }): Incident {
    const newInc: Incident = {
      id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: data.title,
      severity: data.severity,
      status: "New",
      assignee: data.assignee || "Unassigned",
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
      source: data.source || "Manual Analyst Intake",
      affectedAssets: data.affectedAssets || [],
      associatedAlertIds: data.associatedAlertIds || [],
      investigationNotes: data.initialNote
        ? [
            {
              id: `NOTE-${Date.now()}`,
              timestamp: new Date().toISOString(),
              author: data.assignee || "System",
              note: data.initialNote,
            },
          ]
        : [],
      evidence: [],
      responseHistory: [
        {
          id: `ACT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: "INCIDENT_CREATED",
          actor: data.assignee || "SOC Analyst",
          outcome: "Incident case file initialized.",
        },
      ],
    };

    this.incidents.unshift(newInc);
    this.emit("incident_created", newInc);
    return newInc;
  }

  public updateStatus(id: string, status: Incident["status"], assignee?: string): Incident | undefined {
    const inc = this.getIncidentById(id);
    if (!inc) return undefined;

    inc.status = status;
    if (assignee) inc.assignee = assignee;
    inc.updatedTime = new Date().toISOString();

    inc.responseHistory.push({
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "STATUS_UPDATE",
      actor: assignee || inc.assignee || "SOC Lead",
      outcome: `Status transitioned to '${status}'.`,
    });

    this.emit("incident_updated", inc);
    return inc;
  }

  public addNote(id: string, noteText: string, author: string): IncidentNote | undefined {
    const inc = this.getIncidentById(id);
    if (!inc) return undefined;

    const newNote: IncidentNote = {
      id: `NOTE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author,
      note: noteText,
    };

    inc.investigationNotes.push(newNote);
    inc.updatedTime = new Date().toISOString();
    this.emit("incident_updated", inc);
    return newNote;
  }

  public addEvidence(
    id: string,
    evidenceData: { filename: string; fileType: string; hash: string; collector: string; sizeKb: number }
  ): DigitalEvidence | undefined {
    const inc = this.getIncidentById(id);
    if (!inc) return undefined;

    const newEvd: DigitalEvidence = {
      id: `EVD-${Math.floor(100 + Math.random() * 900)}`,
      filename: evidenceData.filename,
      fileType: evidenceData.fileType,
      hash: evidenceData.hash,
      collectedTime: new Date().toISOString(),
      collector: evidenceData.collector,
      sizeKb: evidenceData.sizeKb,
    };

    inc.evidence.push(newEvd);
    inc.updatedTime = new Date().toISOString();
    this.emit("incident_updated", inc);
    return newEvd;
  }

  public recordResponseAction(
    id: string,
    action: string,
    actor: string,
    outcome: string
  ): IncidentResponseRecord | undefined {
    const inc = this.getIncidentById(id);
    if (!inc) return undefined;

    const record: IncidentResponseRecord = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      actor,
      outcome,
    };

    inc.responseHistory.push(record);
    inc.updatedTime = new Date().toISOString();
    this.emit("incident_updated", inc);
    return record;
  }

  public getStats() {
    const total = this.incidents.length;
    const critical = this.incidents.filter((i) => i.severity === "Critical").length;
    const high = this.incidents.filter((i) => i.severity === "High").length;
    const active = this.incidents.filter((i) => i.status !== "Closed" && i.status !== "Remediated").length;
    const remediated = this.incidents.filter((i) => i.status === "Remediated" || i.status === "Closed").length;

    return {
      totalIncidents: total,
      criticalCount: critical,
      highCount: high,
      activeIncidents: active,
      remediatedIncidents: remediated,
      mttrMinutes: 28, // Mean Time to Respond
    };
  }
}

export const incidentManagementEngine = new IncidentManagementEngine();
