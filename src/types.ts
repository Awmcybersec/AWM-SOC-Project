export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export type AlertStatus = "Unassigned" | "Investigating" | "Mitigated" | "Escalated" | "False Positive";

export type ThreatCategory = 
  | "Malware" 
  | "NIDS Intrusion" 
  | "HIDS Suspicious Execution" 
  | "UEBA Anomaly" 
  | "Data Exfiltration" 
  | "Privilege Escalation" 
  | "Brute Force" 
  | "C2 Communication";

export interface Alert {
  id: string;
  title: string;
  category: ThreatCategory;
  severity: Severity;
  status: AlertStatus;
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  user?: string;
  device: string;
  description: string;
  mitreTactic: string;
  mitreTechnique: string;
  mitreTechniqueId: string;
  iocHash?: string;
  score: number;
}

export interface SiemLog {
  id: string;
  timestamp: string;
  logSource: "Windows Security" | "Syslog Linux" | "AWS CloudTrail" | "PaloAlto Firewall" | "K8s Audit";
  eventId: string;
  host: string;
  user: string;
  ip: string;
  message: string;
  level: "ERROR" | "WARN" | "INFO" | "CRITICAL";
  rawJson: string;
}

export interface MalwareSample {
  id: string;
  filename: string;
  sizeBytes: number;
  md5: string;
  sha256: string;
  uploadDate: string;
  verdict: "Malicious" | "Suspicious" | "Benign";
  threatScore: number;
  entropy: number;
  submittingUser: string;
  mitreTechniques: string[];
  yaraMatches: string[];
  c2Ips: string[];
}

export interface IOC {
  id: string;
  type: "IP" | "Domain" | "SHA256" | "MD5" | "URL";
  value: string;
  threatGroup: string; // e.g. APT28, Lazarus, FIN7
  confidenceScore: number; // 0 - 100
  firstSeen: string;
  lastSeen: string;
  feedSource: string;
  tags: string[];
}

export interface PlaybookStep {
  stepNumber: number;
  name: string;
  description: string;
  automated: boolean;
  actionType: "ISOLATE_HOST" | "BLOCK_IP" | "REVOKE_SESSION" | "KILL_PROCESS" | "ENRICH_INTEL" | "NOTIFY_SLACK";
  target: string;
  status: "Idle" | "Running" | "Success" | "Failed";
}

export interface SoarPlaybook {
  id: string;
  name: string;
  triggerCategory: ThreatCategory;
  minSeverity: Severity;
  autoExecute: boolean;
  lastExecuted: string;
  totalRuns: number;
  successRate: number;
  steps: PlaybookStep[];
}

export interface UserBehaviorProfile {
  id: string;
  username: string;
  department: string;
  role: string;
  riskScore: number; // 0 to 100
  anomalyType: string;
  lastActive: string;
  device: string;
  unusualActivityCount: number;
  geoLocations: string[];
  failedLogins24h: number;
}

export interface AssetVulnerability {
  id: string;
  cveId: string;
  title: string;
  cvssScore: number;
  severity: Severity;
  affectedPackage: string;
  patchAvailable: boolean;
  remediationCommand: string;
}

export interface EnterpriseAsset {
  id: string;
  hostname: string;
  ipAddress: string;
  os: string;
  type: "Server" | "Workstation" | "Database" | "Cloud Node" | "Container Host";
  riskScore: number;
  agentVersion: string;
  agentStatus: "Online" | "Offline" | "Degraded";
  vulnerabilities: AssetVulnerability[];
  lastScanTime: string;
}

export interface DetectionRule {
  id: string;
  type: "YARA" | "Sigma";
  name: string;
  target: string;
  severity: Severity;
  author: string;
  content: string;
  enabled: boolean;
  lastMatched: string;
  matchCount: number;
}

export interface MitreTechnique {
  id: string; // e.g. T1059
  name: string; // Command and Scripting Interpreter
  tactic: string; // Execution
  subTechniquesCount: number;
  detectionCount: number;
  riskLevel: Severity;
  description: string;
  mitigation: string;
}

export interface ComplianceControl {
  id: string;
  code: string;
  name: string;
  status: "Compliant" | "Non-Compliant" | "In Review";
  evidenceCount: number;
  lastAudited: string;
}

export interface ComplianceFramework {
  id: string;
  name: "NIST SP 800-53" | "ISO 27001" | "SOC 2 Type II" | "HIPAA Security";
  score: number; // percentage e.g. 94%
  passedControls: number;
  totalControls: number;
  controls: ComplianceControl[];
}

export interface Tenant {
  id: string;
  name: string;
  tier: "Enterprise Pro" | "Government Cloud" | "MSSP Global";
  activeAgents: number;
  monthlyLogVolumeGb: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  ipAddress: string;
  hash: string;
}

export interface IncidentNote {
  id: string;
  timestamp: string;
  author: string;
  note: string;
}

export interface DigitalEvidence {
  id: string;
  filename: string;
  fileType: string;
  hash: string;
  collectedTime: string;
  collector: string;
  sizeKb: number;
}

export interface IncidentResponseRecord {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  outcome: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: "New" | "Triaged" | "Investigating" | "Containment" | "Remediated" | "Closed";
  assignee: string;
  createdTime: string;
  updatedTime: string;
  source: string;
  affectedAssets: string[];
  associatedAlertIds: string[];
  investigationNotes: IncidentNote[];
  evidence: DigitalEvidence[];
  responseHistory: IncidentResponseRecord[];
  reportSummary?: string;
}

export interface ThreatFeedConnector {
  id: string;
  name: "MISP Enterprise" | "OpenCTI Instance" | "STIX/TAXII 2.1 Feed" | "AlienVault OTX" | "VirusTotal API";
  type: "MISP" | "OpenCTI" | "STIX/TAXII" | "API";
  status: "Active" | "Syncing" | "Error" | "Disabled";
  lastSync: string;
  iocCount: number;
  endpointUrl: string;
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  origin: string;
  targetSectors: string[];
  mitreAttckIds: string[];
  description: string;
  sophistication: "Nation-State" | "Cybercrime" | "Hacktivist" | "Insider";
}

export interface ReportDefinition {
  id: string;
  title: string;
  type: "Daily SOC Report" | "Weekly Security Posture" | "Executive Risk" | "Compliance Status";
  generatedAt: string;
  generatedBy: string;
  period: string;
  summary: string;
  metrics: Record<string, any>;
  recommendations: string[];
}

export interface MultiEnvConfig {
  id: string;
  environmentType: "On-Premise" | "Private Cloud" | "Hybrid SOC";
  organizationName: string;
  dataIsolationMode: "Strict Tenant Isolation" | "Shared VPC Partition" | "Air-Gapped Local Sink";
  region: string;
  agentClusterEndpoints: string[];
  maxDailyLogVolumeGb: number;
  activeInstances: number;
}

export type ActiveTab =
  | "dashboard"
  | "alerts"
  | "soc_command"
  | "incident_response"
  | "ai_analyst_assistant"
  | "enterprise_reporting"
  | "copilot"
  | "edr"
  | "malware"
  | "siem"
  | "nids"
  | "ueba"
  | "soar"
  | "autonomous_response"
  | "ai_models"
  | "threat_intel"
  | "mitre"
  | "yara_sigma"
  | "vulnerability"
  | "compliance"
  | "rbac_audit"
  | "tenant_management"
  | "windows_deployment"
  | "enterprise_admin"
  | "api_gateway"
  | "advanced_analytics"
  | "architecture_docs"
  | "autonomous_soc"
  | "threat_hunting"
  | "marketplace"
  | "global_scale";