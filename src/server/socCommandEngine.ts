import { EventEmitter } from 'events';
import { siemEngine } from './siemEngine';
import { ndrEngine } from './ndrEngine';
import { edrEngine } from './edrEngine';
import { uebaEngine } from './uebaEngine';
import { soarEngine } from './soarEngine';
import { threatIntelEngine } from './threatIntelEngine';
import { vulnerabilityEngine } from './vulnerabilityEngine';
import { complianceEngine } from './complianceEngine';
import { tenantEngine } from './tenantEngine';
import { autonomousResponseEngine } from './autonomousResponseEngine';
import { aiModelRouter } from "./ai/aiModelRouter.js";

export interface SocAlert {
  id: string;
  incidentId?: string;
  sourceModule: 'SIEM' | 'NDR' | 'EDR' | 'UEBA' | 'SOAR' | 'TIP' | 'VM' | 'GRC';
  alertName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitreTechnique?: string;
  sourceIp?: string;
  destinationIp?: string;
  hostname?: string;
  username?: string;
  rawTelemetry: Record<string, any>;
  timestamp: string;
}

export interface SocIncident {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
  riskScore: number; // 0 - 100
  mitreTactics: string[];
  affectedHosts: string[];
  affectedUsers: string[];
  assignedAnalyst: string;
  summary: string;
  alerts: SocAlert[];
  createdAt: string;
  updatedAt: string;
}

export interface AttackTimelineStage {
  id: string;
  incidentId: string;
  stageOrder: number;
  stageTitle: string;
  description: string;
  mitreTechnique?: string;
  moduleSource: string;
  timestamp: string;
}

export interface SocDashboardData {
  globalThreatScore: number;
  activeIncidents: SocIncident[];
  criticalAlerts: SocAlert[];
  securityPosture: {
    siemStatus: string;
    ndrStatus: string;
    edrStatus: string;
    uebaStatus: string;
    soarStatus: string;
    tipStatus: string;
    vmStatus: string;
    grcStatus: string;
  };
  socKpis: {
    mttdMinutes: number;
    mttrMinutes: number;
    mttcMinutes: number;
    events24h: number;
    playbooksExecuted: number;
    activeAnalysts: number;
  };
}

class SocCommandEngine extends EventEmitter {
  private incidents: Map<string, SocIncident> = new Map();
  private alerts: SocAlert[] = [];
  private timelines: Map<string, AttackTimelineStage[]> = new Map();
  
  constructor() {
    super();
    this.seedInitialIncidentAndAlerts();

    const enableSocCorrelation =
      process.env.SOC_CORRELATION_ENABLED === "true" || process.env.NODE_ENV !== "production";

    if (enableSocCorrelation) {
      this.startCrossModuleCorrelationLoop();
    }
  }

  

  private seedInitialIncidentAndAlerts() {
    const inc01: SocIncident = {
      id: 'INC-2026-XDR-001',
      title: 'Multi-Stage APT Campaign: Ransomware Staging & LSASS Memory Dump',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      riskScore: 96,
      mitreTactics: ['Initial Access', 'Credential Access', 'Defense Evasion', 'Impact'],
      affectedHosts: ['EP-WIN-DC01', '192.168.1.105'],
      affectedUsers: ['CORP\\Administrator', 'usr-m-vance'],
      assignedAnalyst: 'Elena Rostova (Lead CISO)',
      summary: 'Correlation detected across SIEM, EDR, NDR, and UEBA engines. Encoded PowerShell command executed on Domain Controller DC01, LSASS memory dumped, and SMB relay connection established to suspicious external C2 IP.',
      alerts: [],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialAlerts: SocAlert[] = [
      {
        id: 'ALT-SIEM-9901',
        incidentId: inc01.id,
        sourceModule: 'SIEM',
        alertName: 'Suspicious Encoded PowerShell Execution',
        severity: 'HIGH',
        mitreTechnique: 'T1059.001 - Command & Scripting Interpreter',
        hostname: 'EP-WIN-DC01',
        username: 'CORP\\Administrator',
        rawTelemetry: { process: 'powershell.exe -e JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdA...' },
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'ALT-EDR-4412',
        incidentId: inc01.id,
        sourceModule: 'EDR',
        alertName: 'Process Memory Read (LSASS Dump Attempt)',
        severity: 'CRITICAL',
        mitreTechnique: 'T1003.001 - OS Credential Dumping: LSASS Memory',
        hostname: 'EP-WIN-DC01',
        username: 'CORP\\Administrator',
        rawTelemetry: { targetProcess: 'lsass.exe', sourceProcess: 'procdump64.exe' },
        timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
      },
      {
        id: 'ALT-NDR-8823',
        incidentId: inc01.id,
        sourceModule: 'NDR',
        alertName: 'Outbound SMB / Encrypted C2 Beaconing to Suspicious IP',
        severity: 'HIGH',
        mitreTechnique: 'T1071.001 - Application Layer Protocol: Web Protocols',
        sourceIp: '192.168.1.105',
        destinationIp: '185.220.101.5',
        rawTelemetry: { bytesTransferred: 458920, protocol: 'TCP/443' },
        timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      },
      {
        id: 'ALT-UEBA-1120',
        incidentId: inc01.id,
        sourceModule: 'UEBA',
        alertName: 'Anomalous Off-Hours Admin Login & Privilege Escalation',
        severity: 'HIGH',
        mitreTechnique: 'T1078.002 - Valid Accounts: Domain Accounts',
        hostname: 'EP-WIN-DC01',
        username: 'usr-m-vance',
        rawTelemetry: { riskDeviation: '+4.5 StdDev', geoCity: 'Moscow, RU' },
        timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(),
      },
    ];

    inc01.alerts = initialAlerts;
    this.incidents.set(inc01.id, inc01);
    this.alerts.push(...initialAlerts);

    // Initial Attack Timeline
    const timeline: AttackTimelineStage[] = [
      {
        id: 'STG-01',
        incidentId: inc01.id,
        stageOrder: 1,
        stageTitle: 'Initial Compromise & Off-Hours Login',
        description: 'User account usr-m-vance logged in off-hours from an unexpected foreign IP address.',
        mitreTechnique: 'T1078.002',
        moduleSource: 'UEBA',
        timestamp: new Date(Date.now() - 3600000 * 2.2).toISOString(),
      },
      {
        id: 'STG-02',
        incidentId: inc01.id,
        stageOrder: 2,
        stageTitle: 'PowerShell Obfuscated Execution',
        description: 'Encoded Base64 PowerShell script launched on EP-WIN-DC01 to establish persistence.',
        mitreTechnique: 'T1059.001',
        moduleSource: 'SIEM',
        timestamp: new Date(Date.now() - 3600000 * 2.0).toISOString(),
      },
      {
        id: 'STG-03',
        incidentId: inc01.id,
        stageOrder: 3,
        stageTitle: 'Credential Access (LSASS Memory Dump)',
        description: 'Procdump tool executed targeting lsass.exe process memory to extract NT hashes.',
        mitreTechnique: 'T1003.001',
        moduleSource: 'EDR',
        timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
      },
      {
        id: 'STG-04',
        incidentId: inc01.id,
        stageOrder: 4,
        stageTitle: 'C2 Exfiltration Beaconing',
        description: 'Outbound TCP connection initiated from DC01 to known Tor exit node IP 185.220.101.5.',
        mitreTechnique: 'T1071.001',
        moduleSource: 'NDR',
        timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      },
    ];

    this.timelines.set(inc01.id, timeline);
  }

  private startCrossModuleCorrelationLoop() {
    // Periodically poll underlying engines to synthesize real-time cross-module SOC alerts
    setInterval(() => {
      try {
        this.synthesizeRealTimeAlerts();
      } catch (err) {
        console.error('Error in SOC correlation engine loop:', err);
      }
    }, 15000);
  }

  private synthesizeRealTimeAlerts() {
    // Sample real-time correlation logic
    const edrStats = edrEngine.getStats();
    const siemStats = siemEngine.getStats();

    if (edrStats.isolatedEndpoints > 0 && siemStats.totalAlerts > 5) {
      // Create a correlated event alert if not already present
      const alertId = `ALT-CORR-${Date.now().toString().slice(-4)}`;
      const newAlert: SocAlert = {
        id: alertId,
        incidentId: 'INC-2026-XDR-001',
        sourceModule: 'SOAR',
        alertName: 'Automated Isolation Executed for High-Risk Endpoint',
        severity: 'HIGH',
        mitreTechnique: 'T1112 - Modify Registry',
        hostname: 'EP-WIN-DC01',
        rawTelemetry: { isolatedCount: edrStats.isolatedEndpoints },
        timestamp: new Date().toISOString(),
      };

      this.alerts.unshift(newAlert);
      this.emit('soc_alert', newAlert);
    }
  }

  // --- Public API Methods ---

  public getDashboardData(): SocDashboardData {
    const activeIncs = Array.from(this.incidents.values()).filter(
      (i) => i.status === 'OPEN' || i.status === 'INVESTIGATING'
    );

    // Calculate Global Threat Score (0 - 100)
    let threatScore = 45;
    if (activeIncs.some((i) => i.severity === 'CRITICAL')) {
      threatScore = 92;
    } else if (activeIncs.length > 3) {
      threatScore = 78;
    }

    const criticalAlerts = this.alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').slice(0, 10);

    return {
      globalThreatScore: threatScore,
      activeIncidents: Array.from(this.incidents.values()),
      criticalAlerts,
      securityPosture: {
        siemStatus: 'HEALTHY (12,450 EPS)',
        ndrStatus: 'HEALTHY (10 Gbps Ingest)',
        edrStatus: 'HEALTHY (1,240 Agents Connected)',
        uebaStatus: 'ACTIVE (0 Anomalous Risk Deviation)',
        soarStatus: 'ACTIVE (32 Playbooks Ready)',
        tipStatus: 'SYNCHRONIZED (4,500 IOCs)',
        vmStatus: 'SCAN COMPLETE (8 Critical Unpatched)',
        grcStatus: 'COMPLIANT (SOC 2, ISO 27001)',
      },
      socKpis: {
        mttdMinutes: 3.8,
        mttrMinutes: 11.4,
        mttcMinutes: 7.2,
        events24h: 1489200,
        playbooksExecuted: 384,
        activeAnalysts: tenantEngine.getStats().activeUsers || 12,
      },
    };
  }

  public getIncidents(): SocIncident[] {
    return Array.from(this.incidents.values());
  }

  public getIncidentById(id: string): SocIncident | undefined {
    return this.incidents.get(id);
  }

  public createIncident(title: string, severity: SocIncident['severity'], affectedHosts: string[], affectedUsers: string[], summary: string): SocIncident {
    const incId = `INC-2026-XDR-${Math.floor(Math.random() * 900 + 100)}`;
    const newInc: SocIncident = {
      id: incId,
      title,
      severity,
      status: 'OPEN',
      riskScore: severity === 'CRITICAL' ? 90 : severity === 'HIGH' ? 75 : 50,
      mitreTactics: ['Initial Access', 'Execution'],
      affectedHosts,
      affectedUsers,
      assignedAnalyst: 'Unassigned',
      summary,
      alerts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.incidents.set(incId, newInc);
    this.emit('incident_created', newInc);

    // Evaluate in Autonomous Response Engine
    autonomousResponseEngine.evaluateAlert({
      id: incId,
      title: newInc.title,
      severity: newInc.severity === 'CRITICAL' ? 'Critical' : newInc.severity === 'HIGH' ? 'High' : 'Medium',
      device: affectedHosts[0],
      user: affectedUsers[0],
      description: summary,
      score: newInc.riskScore,
    }).catch((err) => console.error('Error evaluating autonomous response for incident:', err));

    return newInc;
  }

  public updateIncidentStatus(id: string, status: SocIncident['status'], analyst?: string): SocIncident {
    const inc = this.incidents.get(id);
    if (!inc) throw new Error(`Incident '${id}' not found`);

    inc.status = status;
    if (analyst) inc.assignedAnalyst = analyst;
    inc.updatedAt = new Date().toISOString();

    this.incidents.set(id, inc);
    this.emit('incident_updated', inc);
    return inc;
  }

  public getTimeline(incidentId: string): AttackTimelineStage[] {
    return this.timelines.get(incidentId) || [];
  }

  public getThreatMapData() {
    return {
      activeNodesCount: 14,
      globalThreatPoints: [
        { lat: 55.7558, lng: 37.6173, location: 'Moscow, RU', threatActor: 'APT28 (Fancy Bear)', severity: 'CRITICAL', attacks24h: 1420 },
        { lat: 39.9042, lng: 116.4074, location: 'Beijing, CN', threatActor: 'APT41 (Double Dragon)', severity: 'HIGH', attacks24h: 980 },
        { lat: 35.6762, lng: 139.6503, location: 'Tokyo, JP', threatActor: 'Lazarus Group', severity: 'HIGH', attacks24h: 650 },
        { lat: 52.5200, lng: 13.4050, location: 'Berlin, DE', threatActor: 'FIN7', severity: 'MEDIUM', attacks24h: 310 },
        { lat: 37.7749, lng: -122.4194, location: 'San Francisco, US', threatActor: 'Scattered Spider', severity: 'CRITICAL', attacks24h: 2100 },
      ],
      tipStats: threatIntelEngine.getStats(),
    };
  }

  public getMetrics() {
    return {
      siem: siemEngine.getStats(),
      ndr: ndrEngine.getStats(),
      edr: edrEngine.getStats(),
      ueba: uebaEngine.getStats(),
      soar: soarEngine.getStats(),
      tip: threatIntelEngine.getStats(),
      vm: vulnerabilityEngine.getStats(),
      grc: complianceEngine.getStats(),
      tenants: tenantEngine.getStats(),
    };
  }

  // --- AWM AI SOC Assistant  ---
  public async investigateIncidentWithAI(incidentId: string): Promise<{
    incidentId: string;
    aiExecutiveSummary: string;
    attackVectorAnalysis: string;
    recommendedPlaybooks: string[];
    mitreTacticsExplained: string[];
    containmentGuidance: string;
  }> {
    const inc = this.getIncidentById(incidentId);
    if (!inc) throw new Error(`Incident '${incidentId}' not found`);

    const timeline = this.getTimeline(incidentId);

    const prompt = `You are AWM Cyber AI's Lead Autonomous Security Analyst Assistant.
Analyze this high-severity security incident and timeline:

Incident Title: ${inc.title}
Severity: ${inc.severity}
Affected Hosts: ${inc.affectedHosts.join(', ')}
Affected Users: ${inc.affectedUsers.join(', ')}
Summary: ${inc.summary}

Attack Stages:
${timeline.map((t) => `- [${t.moduleSource}] ${t.stageTitle}: ${t.description}`).join('\n')}

Provide a structuredJSON investigation report with:
1. "aiExecutiveSummary": High-level CISO summary.
2. "attackVectorAnalysis": Technical root cause & attack sequence explanation.
3. "recommendedPlaybooks": Array of 3 specific SOAR automated playbooks to run.
4. "mitreTacticsExplained": Array explaining relevant MITRE ATT&CK techniques.
5. "containmentGuidance": Step-by-step immediate remediation steps.`;

    try {
      const routing = await aiModelRouter.selectProvider();
const provider = routing.selectedProvider;

console.log(
  `[SOC AI] Provider: ${provider.name} | Mode: ${routing.modeUsed} | Fallback: ${routing.isFallback}`
);

if (!provider.generateChatResponse) {
  throw new Error(
    `Selected AI provider '${provider.name}' does not support chat responses`
  );
}

const text = await provider.generateChatResponse(
  `Return ONLY valid JSON.

You are the Lead Autonomous Security Analyst for AWM Cyber AI SOC.

Analyze this high-severity security incident and timeline.

Incident Title: ${inc.title}
Severity: ${inc.severity}
Affected Hosts: ${inc.affectedHosts.join(", ")}
Affected Users: ${inc.affectedUsers.join(", ")}
Summary: ${inc.summary}

Attack Stages:
${timeline
  .map(
    (t) =>
      `- [${t.moduleSource}] ${t.stageTitle}: ${t.description}`
  )
  .join("\n")}

Return this exact JSON structure:

{
  "aiExecutiveSummary": "High-level CISO summary",
  "attackVectorAnalysis": "Technical root cause and attack sequence",
  "recommendedPlaybooks": [
    "SOAR playbook 1",
    "SOAR playbook 2",
    "SOAR playbook 3"
  ],
  "mitreTacticsExplained": [
    "Relevant MITRE ATT&CK technique and explanation"
  ],
  "containmentGuidance": "Step-by-step immediate remediation"
}

Do not use Markdown.
Do not wrap the JSON in code fences.
Return JSON only.`,
  [],
  {
    incidentId,
    severity: inc.severity,
    affectedHosts: inc.affectedHosts,
    affectedUsers: inc.affectedUsers,
    timeline,
  }
);
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
        return {
          incidentId,
          aiExecutiveSummary: parsed.aiExecutiveSummary || inc.summary,
          attackVectorAnalysis: parsed.attackVectorAnalysis || 'Multi-stage credential access & C2 beaconing via PowerShell.',
          recommendedPlaybooks: parsed.recommendedPlaybooks || ['Isolate Host & Block C2 IP', 'Revoke Compromised Credentials', 'Run Malware Scan'],
          mitreTacticsExplained: parsed.mitreTacticsExplained || ['T1059.001 PowerShell', 'T1003.001 LSASS Memory Dump', 'T1071.001 Web Protocols'],
          containmentGuidance: parsed.containmentGuidance || 'Immediately isolate EP-WIN-DC01 using EDR, revoke Domain Admin credentials, and block 185.220.101.5 on perimeter firewall.',
        };
      } catch (parseError) {
        return {
          incidentId,
          aiExecutiveSummary: text.substring(0, 300) || inc.summary,
          attackVectorAnalysis: 'Multi-stage credential access, memory dumping, and C2 exfiltration detected by AWM Cyber AI XDR correlation engine.',
          recommendedPlaybooks: ['Isolate Compromised Host via EDR', 'Block External C2 IP via NDR', 'Revoke Compromised Domain Admin Credentials'],
          mitreTacticsExplained: ['T1059.001 - Command & Scripting Interpreter', 'T1003.001 - OS Credential Dumping', 'T1071.001 - C2 Web Protocols'],
          containmentGuidance: 'Execute automated SOAR playbook "Host Isolation & Account Reset" on EP-WIN-DC01.',
        };
      }
    } catch (apiError) {
      console.warn('SOC AI investigation fallback due to API limit/error:', apiError);
      return {
        incidentId,
        aiExecutiveSummary: `[AI Fallback Report] High-confidence correlation detected on ${inc.affectedHosts.join(', ')}. Attackers leveraged credential dumping and PowerShell script execution to attempt ransomware deployment.`,
        attackVectorAnalysis: 'Attack initiated via phishing credential compromise, followed by LSASS memory dumping using procdump64 and outbound encrypted C2 beaconing to Tor exit nodes.',
        recommendedPlaybooks: ['SOAR-PLAYBOOK-HOST-ISOLATION', 'SOAR-PLAYBOOK-CREDENTIAL-REVOCATION', 'SOAR-PLAYBOOK-PERIMETER-FIREWALL-BLOCK'],
        mitreTacticsExplained: ['T1059.001 - PowerShell Command Execution', 'T1003.001 - Credential Access via LSASS', 'T1071.001 - Application Layer C2 Traffic'],
        containmentGuidance: '1. Isolate EP-WIN-DC01 immediately from the network using EDR.\n2. Revoke session tokens for CORP\\Administrator and usr-m-vance.\n3. Add C2 IP 185.220.101.5 to firewall blocklists.',
      };
    }
  }
}

export const socCommandEngine = new SocCommandEngine();
