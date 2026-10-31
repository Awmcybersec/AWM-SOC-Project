# AWM AI SOC SENIOR — Enterprise Administrator Guide

## Executive Overview
This guide provides comprehensive administrative procedures for configuring, operating, and maintaining the **AWM AI SOC SENIOR** platform in enterprise production environments.

---

## 1. Identity & Access Management (IAM) & RBAC

### Role-Based Access Control (RBAC) Matrix
The platform enforces 6 strict RBAC roles:

| Role Name | Scope & Purpose | Administrative Rights |
| :--- | :--- | :--- |
| **Super Administrator** | Global Platform Admin | Full Unrestricted Access, User Management, License Activation, Engine Config |
| **SOC Manager** | Operations Lead | SIEM, SOAR, EDR/NDR, Autonomous Response Approvals |
| **Security Analyst** | L1 / L2 Analyst | Read/Write SIEM Alerts, EDR Endpoint Inspection, Threat Hunting |
| **Incident Responder** | L3 Incident Lead | SOAR Playbook Execution, Autonomous Isolation Commands |
| **Auditor** | GRC & Compliance | Read-Only Access to Cryptographic Audit Ledger & Compliance Reports |
| **Read-Only Viewer** | Executive Dashboard | Read-Only Access to High-Level Health & Incident Statistics |

### Account Lockout & Password Security Policies
- **PBKDF2 Password Hashing**: Passwords stored with 10,000 PBKDF2 iterations using SHA-256 and unique per-user salts.
- **Account Lockout Policy**: Automatically locks accounts for 15 minutes after 5 consecutive failed login attempts.
- **MFA / 2FA Readiness**: Supports TOTP (Authenticator Apps), SMS 2FA, and FIDO2/WebAuthn Hardware Keys.

---

## 2. Directory Services Integration (Active Directory & Azure Entra ID)

### Active Directory / LDAP Integration
1. Navigate to **Enterprise Admin & Licensing -> Identity & RBAC Management -> Directory Services**.
2. Configure LDAPS Endpoint: `ldaps://dc01.corp.domain.internal:636`.
3. Provide Bind DN and Search Base for Users & Security Groups.
4. Set Sync Interval (Default: 15 minutes).

### Azure Active Directory / Entra ID Integration
1. Register enterprise app in Azure Portal (`Graph API`).
2. Configure `Tenant ID`, `Client ID`, and `Client Secret`.
3. Grant `User.Read.All` and `GroupMember.Read.All` Graph API permissions.

---

## 3. Commercial Product Licensing & Offline Activation

### Activation Methods
- **Online Serial Key**: Enter key format `AWM-ENT-2026-XXXX-XXXX` in the Admin Dashboard.
- **Offline Cryptographic License File (`.lic`)**: For air-gapped environments, upload the encrypted `.lic` bundle provided by sales.

### License Tiers
| Tier Name | Max Agents | Max Daily GB | Features Included |
| :--- | :--- | :--- | :--- |
| **Trial** | 50 | 100 GB | Autonomous Response, SIEM, EDR |
| **Enterprise Standard** | 1,000 | 1,000 GB | All Features, Local Storage |
| **Enterprise Premium** | 10,000 | 5,000 GB | All Features, Multi-Tenant, Offline Fallback |
| **MSSP Unlimited** | Unlimited | Unlimited | Multi-Tenant Isolation, SLA Enforcement |

---

## 4. Disaster Recovery & Backup Management
Execute automated backup jobs via PowerShell or REST API:
```powershell
.\windows\scripts\Backup-PostgreSQL.ps1 -DbName "awm_ai_soc_db" -RetentionDays 30
```
Restores can be executed via `pg_restore`:
```bash
pg_restore -U awm_soc_admin -d awm_ai_soc_db C:\ProgramData\AWM-AI-SOC-SENIOR\backups\awm_db_backup.dump
```
