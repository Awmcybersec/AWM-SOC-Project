# AWM AI SOC SENIOR — Enterprise Installation Guide

## System Requirements
- **OS**: Windows Server 2019 / 2022 / 2025 or Windows 10 / 11 (64-bit)
- **CPU**: 4 Cores minimum (8 Cores recommended for Local AI SecLM)
- **RAM**: 16 GB minimum (32 GB recommended)
- **Disk**: 100 GB SSD storage
- **Database**: PostgreSQL 14+ (Local or Remote)

## Quick Start Installation (Interactive Setup)

1. Download `AWM-AI-SOC-SENIOR-Setup.exe` from the Enterprise Release Portal.
2. Right-click `AWM-AI-SOC-SENIOR-Setup.exe` and select **Run as Administrator**.
3. Select installation tasks:
   - [x] Install and Start "AWM AI SOC Senior Engine" Windows Service
   - [x] Initialize Local PostgreSQL Enterprise Database (`awm_ai_soc_db`)
   - [x] Create Desktop Application Shortcut
4. Complete the Setup Wizard and launch **AWM AI SOC SENIOR**.

## Unattended Silent Installation (Automated Deployment)

```cmd
AWM-AI-SOC-SENIOR-Setup.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-
```

## Verifying Service Installation

Open PowerShell as Administrator and run:
```powershell
Get-Service AWMAISOCSeniorEngine
```
Expected Output: `Status: Running`
