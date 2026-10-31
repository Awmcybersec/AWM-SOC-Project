# AWM AI SOC SENIOR — Security Model & Cryptographic Assurance Documentation

## Zero-Trust Architecture
1. **Strict Mutual TLS (mTLS)**: All communication between endpoint agents, regional SOC nodes, and central command is encrypted with TLS 1.3.
2. **Role-Based Access Control (RBAC)**: Fine-grained permissions for Tier-1 Analyst, SOC Manager, Incident Handler, and Global Admin.
3. **Data Loss Prevention (DLP)**: All PII and internal IP addresses are masked before dispatch to cloud LLM providers.
4. **HMAC Non-Repudiation Audit Logs**: Every autonomous containment action is signed with SHA-256 HMAC for forensic compliance.
5. **Air-Gapped Local AI Protection**: Complete security operation availability even when disconnected from external networks.
