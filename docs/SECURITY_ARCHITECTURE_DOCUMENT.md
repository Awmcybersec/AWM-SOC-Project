# AWM AI SOC SENIOR — Security Architecture Document

## Architecture Overview
The **AWM AI SOC SENIOR** platform is designed following Zero-Trust principles, Defense-in-Depth, and strict data isolation boundaries.

---

## 1. System Component Boundaries

```
 +-----------------------------------------------------------------------+
 |                     Electron Desktop Client / Web UI                  |
 +-----------------------------------------------------------------------+
                                     |
                         HTTPS / TLS 1.3 (Port 3000)
                                     v
 +-----------------------------------------------------------------------+
 |               AWMAISOCSeniorEngine (Windows Background Service)        |
 | - Node.js Express Server on 0.0.0.0:3000                              |
 | - AI Decision & Autonomous Response Engines                          |
 | - HMAC SHA-256 Audit Log Signing Sink                                 |
 +-----------------------------------------------------------------------+
                |                                        |
     PostgreSQL 16 (Port 5432)               Windows Event Log / File Sink
                v                                        v
 +-----------------------------+          +------------------------------+
 | Database: awm_ai_soc_db     |          | C:\ProgramData\AWM-AI-SOC-   |
 | - Indexed SIEM & EDR Logs   |          | SENIOR\logs\awm-audit.log    |
 +-----------------------------+          +------------------------------+
```

---

## 2. Cryptographic Audit Integrity (HMAC SHA-256)
Every administrative event, user authentication, and autonomous intervention is signed using **HMAC SHA-256**.
Log entries take the format:
```json
{
  "timestamp": "2026-08-05T07:45:00.000Z",
  "actor": "admin.super",
  "action": "AUTONOMOUS_ISOLATION_APPROVED",
  "target": "WIN-SERVER-02",
  "hash": "8f3b2c...a911"
}
```
If an adversary edits `awm-audit.log`, the platform's verification tool detects hash mismatch and alerts the SOC.

---

## 3. Threat Containment Safety (Blast Radius Control)
The **Blast Radius Controller** prevents accidental catastrophic lockouts by limiting autonomous actions to:
- Max 5 simultaneous host isolations per 15-minute window.
- Protection list for critical Infrastructure Controllers (Domain Controllers, Gateways).
- Automatic downgrade to "Human Approval Required" if blast threshold is exceeded.
