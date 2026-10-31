# AWM AI SOC SENIOR — Enterprise Multi-Environment Deployment Guide

## Deployment Topologies

### 1. Single Server All-In-One Deployment
Ideal for SMB and regional branch offices.
- Windows Server 2022 hosting Node.js server, Electron Desktop Client, and local PostgreSQL database.

### 2. High Availability Distributed Cluster
Ideal for Global Enterprises & MSSPs.
- Ingress: Anycast Load Balancer (Port 443 / TCP 3000)
- Ingestion Nodes: Multiple stateless regional worker nodes running `AWM AI SOC Senior Engine`
- Database: Managed PostgreSQL High Availability Cluster with streaming WAL replication
- AI Inference: Local SecLM + Groq LPU acceleration cluster

## PowerShell Automated Deployment Command

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
.\windows\scripts\Install-Service.ps1 -Port 3000 -LogDir "C:\ProgramData\AWM-AI-SOC-SENIOR\logs"
```
