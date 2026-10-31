-- ============================================================================
-- SentinelAI Enterprise Compliance & Governance (GRC) Schema
-- Version: 1.0.0
-- Database Compatibility: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Compliance Frameworks Registry
CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'SECURITY_GOVERNANCE',
    total_controls INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Compliance Controls Library
CREATE TABLE IF NOT EXISTS compliance_controls (
    id VARCHAR(100) PRIMARY KEY,
    framework_id VARCHAR(50) NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    control_code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    domain VARCHAR(100) NOT NULL,
    owner VARCHAR(100) NOT NULL DEFAULT 'SecOps Compliance Team',
    severity_weight INT NOT NULL DEFAULT 3 CHECK (severity_weight BETWEEN 1 AND 5),
    automated_check_type VARCHAR(50) CHECK (automated_check_type IN ('SIEM_LOG', 'EDR_TELEMETRY', 'VULN_SCAN', 'IAM_POLICY', 'MANUAL_AUDIT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Control Assessments History
CREATE TABLE IF NOT EXISTS control_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    control_id VARCHAR(100) NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,
    framework_id VARCHAR(50) NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'NON_COMPLIANT' CHECK (status IN ('COMPLIANT', 'NON_COMPLIANT', 'PARTIALLY_COMPLIANT', 'NOT_APPLICABLE')),
    effectiveness_score INT NOT NULL DEFAULT 50 CHECK (effectiveness_score BETWEEN 0 AND 100),
    gap_summary TEXT,
    assessed_by VARCHAR(100) NOT NULL DEFAULT 'AUTOMATED_GRC_ENGINE',
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Evidence Records Repository
CREATE TABLE IF NOT EXISTS evidence_records (
    id VARCHAR(100) PRIMARY KEY,
    control_id VARCHAR(100) NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('SIEM_LOG', 'EDR_TELEMETRY', 'VULN_SCAN', 'IAM_CONFIG', 'AUDIT_ATTENUATION')),
    source_system VARCHAR(100) NOT NULL,
    evidence_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    verification_hash VARCHAR(255) NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Audit Sessions Workspace
CREATE TABLE IF NOT EXISTS audit_sessions (
    id VARCHAR(100) PRIMARY KEY,
    audit_title VARCHAR(255) NOT NULL,
    framework_id VARCHAR(50) NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    lead_auditor VARCHAR(100) NOT NULL,
    scope TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CLOSED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. Audit Findings Register
CREATE TABLE IF NOT EXISTS audit_findings (
    id VARCHAR(100) PRIMARY KEY,
    audit_id VARCHAR(100) NOT NULL REFERENCES audit_sessions(id) ON DELETE CASCADE,
    control_id VARCHAR(100) REFERENCES compliance_controls(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    finding_description TEXT NOT NULL,
    remediation_plan TEXT,
    assigned_to VARCHAR(100) NOT NULL DEFAULT 'SecOps Team',
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REMEDIATION_IN_PROGRESS', 'RESOLVED', 'RISK_ACCEPTED')),
    identified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 7. Risk Register & Heatmap
CREATE TABLE IF NOT EXISTS risk_register (
    id VARCHAR(100) PRIMARY KEY,
    risk_title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    likelihood INT NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
    impact INT NOT NULL CHECK (impact BETWEEN 1 AND 5),
    inherent_risk_score INT GENERATED ALWAYS AS (likelihood * impact) STORED,
    residual_risk_score INT NOT NULL DEFAULT 10,
    risk_owner VARCHAR(100) NOT NULL,
    risk_status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (risk_status IN ('OPEN', 'MITIGATED', 'ACCEPTED', 'TRANSFERRED')),
    mitigation_controls JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Compliance Executive Reports
CREATE TABLE IF NOT EXISTS compliance_reports (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    framework_id VARCHAR(50) REFERENCES compliance_frameworks(id) ON DELETE SET NULL,
    author VARCHAR(100) NOT NULL DEFAULT 'SentinelAI GRC Copilot',
    compliance_score INT NOT NULL CHECK (compliance_score BETWEEN 0 AND 100),
    executive_summary TEXT NOT NULL,
    gap_analysis JSONB NOT NULL DEFAULT '[]'::jsonb,
    policy_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Audit Timeline Indexes
CREATE INDEX IF NOT EXISTS idx_controls_framework ON compliance_controls (framework_id);
CREATE INDEX IF NOT EXISTS idx_assessments_control ON control_assessments (control_id);
CREATE INDEX IF NOT EXISTS idx_evidence_control ON evidence_records (control_id);
CREATE INDEX IF NOT EXISTS idx_findings_audit ON audit_findings (audit_id);
CREATE INDEX IF NOT EXISTS idx_risk_score ON risk_register (inherent_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON compliance_reports (created_at DESC);

-- Seed Initial Compliance Frameworks
INSERT INTO compliance_frameworks (id, name, version, description, category, total_controls)
VALUES
('ISO_27001', 'ISO/IEC 27001:2022', '2022', 'International standard for Information Security Management Systems (ISMS)', 'INTERNATIONAL_STANDARD', 93),
('NIST_800_53', 'NIST SP 800-53 Rev. 5', 'Rev. 5', 'Security and Privacy Controls for Federal Information Systems and Organizations', 'FEDERAL_GOVERNANCE', 280),
('SOC2_TYPE2', 'SOC 2 Type II Trust Services Criteria', '2023', 'AICPA criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy', 'AUDIT_ASSURANCE', 64),
('CIS_BENCHMARKS', 'CIS Critical Security Controls v8', 'v8.0', 'Prioritized set of actions to protect organizations and data from cyber attacks', 'CYBER_DEFENSE', 18),
('GDPR_PRIVACY', 'General Data Protection Regulation (GDPR)', '2018', 'EU Regulation on data protection and privacy for all individuals within the European Union', 'DATA_PRIVACY', 45)
ON CONFLICT (id) DO NOTHING;
