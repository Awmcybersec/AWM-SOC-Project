# AWM AI SOC SENIOR — SOC Analyst User Guide

## Overview
This operational guide provides workflows and standard operating procedures (SOPs) for Tier 1, Tier 2, and Tier 3 Security Operations Center (SOC) Analysts utilizing **AWM AI SOC SENIOR**.

---

## 1. SOC Command Center & Real-Time Alert Triage

### Alert Lifecycle
1. **Detection**: Ingested via SIEM, EDR, NDR, or UEBA sensors.
2. **AI Correlation & Score**: AI Decision Engine scores threat severity (1-100) and correlates related logs into a unified case file.
3. **Analyst Review**: Inspect telemetry in **SOC Command Center** or **EDR Telemetry**.
4. **Autonomous Response / Human Approval**:
   - High Confidence Threats (Score > 85): Automatically contained if Autonomous Mode is enabled.
   - Pending Approval: Appears under **Autonomous Response & Approvals** requiring 1-click human analyst confirmation.

---

## 2. EDR Host Isolation & Threat Hunting
- Navigate to **EDR Telemetry & Containment**.
- Click **"Isolate Endpoint"** to sever netflow access while preserving agent command channel.
- Run interactive YARA / Sigma rule matches against memory dumps and disk artifacts.

---

## 3. SOAR Playbook Execution
- Navigate to **SOAR Playbooks**.
- Select playbook (e.g., `Phishing Containment`, `Ransomware Host Lock`).
- Click **Execute Playbook** to run automated mitigation workflows.

---

## 4. Voice AI Assistant Commands
Click the **Voice Assistant** microphone button or press `Alt + V` to issue voice commands:
- *"Isolate endpoint Workstation-09"*
- *"Show me critical SIEM alerts"*
- *"Execute Ransomware Response Playbook"*
