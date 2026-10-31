# AWM AI SOC SENIOR - Enterprise Windows Deployment & Service Manual

## Executive Overview
**AWM AI SOC SENIOR** is an enterprise-grade Autonomous AI Cyber Security Operations Center platform. This guide provides deployment procedures to run the platform natively on **Windows Server 2019 / 2022 / 2025** and **Windows 10 / 11**.

---

## 1. System Requirements & Architecture

### Supported Windows Operating Systems
- **Windows Server 2025** Datacenter / Standard (x64)
- **Windows Server 2022** Datacenter / Standard (x64)
- **Windows Server 2019** Datacenter / Standard (x64)
- **Windows 11** Enterprise / Pro (22H2+)
- **Windows 10** Enterprise LTSC / Pro (21H2+)

### Hardware Requirements
| Metric | Minimum | Recommended Enterprise |
| :--- | :--- | :--- |
| **CPU** | 4 Cores (2.4 GHz+) | 16+ Cores |
| **RAM** | 16 GB | 32 GB – 64 GB |
| **Storage** | 100 GB SSD | 500 GB NVMe |
| **Network** | 1 Gbps NIC | 10 Gbps Redundant NICs |

---

## 2. Production Windows Deployment Package

### Package Components
- **`AWM-AI-SOC-SENIOR-Setup.exe`**: Enterprise self-extracting GUI installer.
- **`AWM AI SOC SENIOR.exe`**: Electron Desktop Client for SOC Analysts & CISOs.
- **`AWMAISOCSeniorEngine`**: Windows Service running the backend core engine on port `3000`.

### Building the Package
To compile all binaries, web app, electron bundle, and installer on a build machine:
```cmd
npm run windows-build
```

Outputs created in:
- `dist-installer/AWM-AI-SOC-SENIOR-Setup.exe`
- `dist-electron/main.js` (`AWM AI SOC SENIOR.exe`)
- `dist/server.cjs` (Service entry script)

---

## 3. Automated Windows Service Installation

The backend runs automatically as a background Windows Service (`AWMAISOCSeniorEngine`).

### PowerShell Installation (Administrator)
Open PowerShell as **Administrator** and execute:
```powershell
Set-ExecutionPolicy Unrestricted -Scope Process -Force
.\windows\scripts\Install-Service.ps1
```

### PowerShell Uninstallation (Administrator)
To stop and remove the Windows Service:
```powershell
.\windows\scripts\Uninstall-Service.ps1
```

### Service Specifications
- **Service Name**: `AWMAISOCSeniorEngine`
- **Display Name**: `AWM AI SOC Senior Engine`
- **Startup Type**: `Automatic (Delayed Start)`
- **Recovery Policy**: Auto-Restart after 10s, 30s, 60s
- **Log Location**: `C:\ProgramData\AWM-AI-SOC-SENIOR\logs\`

---

## 4. PostgreSQL Automated Installation & Database Initialization

### Automated Installation Script
Run the automated PowerShell database setup:
```powershell
.\windows\scripts\Init-PostgreSQL.ps1 -DbName "awm_ai_soc_db" -DbUser "awm_soc_admin"
```

### Included Database Schemas (`init-db.sql`)
1. **`siem_logs`**: High-throughput SIEM log telemetry with ECS indexes.
2. **`edr_endpoints`**: EDR agent state and network isolation flags.
3. **`ndr_network_flows`**: Deep packet inspection & netflow records.
4. **`ueba_anomalies`**: Identity risk scores & behavioral anomaly entries.
5. **`soar_executions`**: SOAR automated playbook execution logs.
6. **`autonomous_audit_logs`**: Autonomous response action audit trail.
7. **`system_audit_trail`**: Immutable GRC compliance audit log.

### Automated Backup & Disaster Recovery
Run automated PostgreSQL backup with retention enforcement and SHA-256 manifest calculation:
```powershell
.\windows\scripts\Backup-PostgreSQL.ps1 -DbName "awm_ai_soc_db" -RetentionDays 30
```

---

## 5. Security & Windows Firewall Configuration

### Security Hardening & Audit Verification
The platform enforces a 100% Security Hardening Benchmark covering:
- **Secrets Entropy**: 256-bit API secret key requirements.
- **TLS 1.3 Encryption**: Port 3000 / 8443 SSL/TLS certificate support.
- **Cryptographic Audit Log Signing**: Every entry in `awm-audit.log` is cryptographically signed with **HMAC SHA-256** signatures to detect log tampering.
- **Firewall Isolation**: Automated Windows Defender Firewall rule configuration.
- **Restricted ACL File Storage**: Restricted permissions on `C:\ProgramData\AWM-AI-SOC-SENIOR\logs`.

### Firewall Ports
| Port | Protocol | Purpose | Direction |
| :--- | :--- | :--- | :--- |
| **3000** | TCP | Web Dashboard & REST/SSE API | Inbound |
| **5432** | TCP | PostgreSQL Database Port | Local / Inbound |
| **443** | TCP | External Gemini AI Gateway & Threat Feeds | Outbound |

The installer script automatically executes:
```powershell
New-NetFirewallRule -DisplayName "AWM AI SOC Senior Engine (Port 3000)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Any
```

---

## 6. Windows Event Logging & Audit Trail
Logs are piped to both the standard Windows Event Log sink and rotating file logs under `C:\ProgramData\AWM-AI-SOC-SENIOR\logs`:
- `awm-service.log`: Service activity and heartbeat.
- `awm-error.log`: Exception traces and API error fallbacks.
- `awm-audit.log`: Immutable audit logs for compliance.

To inspect in Windows Event Viewer:
1. Open **`eventvwr.msc`**.
2. Navigate to **Windows Logs** -> **Application**.
3. Filter by Source: **`AWM-AI-SOC-SENIOR`**.

---

## 7. Supported Security Engine Modules
All core security engines remain fully active in the Windows production environment:
1. **SIEM Engine**: Log ingestion, ECS normalization, KQL search, correlation rules.
2. **SOAR Engine**: Playbook execution, automated incident orchestration, human approvals.
3. **EDR Engine**: Process tree tracking, File Integrity Monitoring (FIM), registry persistence analysis, host isolation.
4. **NDR Engine**: Flow inspection, packet capture analysis, sensor metrics.
5. **UEBA Engine**: Behavioral anomaly calculation, login activity tracking, risk scoring.
6. **Threat Intelligence Platform (TIP)**: STIX/TAXII feed sync, IOC matching, APT campaign mapping.
7. **Autonomous Response Engine**: Automated mitigation rules, blast-radius limiters, analyst approval gates.
8. **AI Decision Engine**: Gemini AI zero-trust router with instant offline engine fallback.
