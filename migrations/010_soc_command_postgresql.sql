-- ============================================================================
-- SentinelAI Final Enterprise XDR SOC Command Center Integration Schema
-- Version: 1.0.0
-- Database Compatibility: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Unified SOC Incidents Register
CREATE TABLE IF NOT EXISTS soc_incidents (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED')),
    risk_score INT NOT NULL DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
    mitre_tactics JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_hosts JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_users JSONB NOT NULL DEFAULT '[]'::jsonb,
    assigned_analyst VARCHAR(100) DEFAULT 'Unassigned',
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Unified Normalized SOC Alerts Table
CREATE TABLE IF NOT EXISTS soc_alerts (
    id VARCHAR(100) PRIMARY KEY,
    incident_id VARCHAR(100) REFERENCES soc_incidents(id) ON DELETE SET NULL,
    source_module VARCHAR(50) NOT NULL CHECK (source_module IN ('SIEM', 'NDR', 'EDR', 'UEBA', 'SOAR', 'TIP', 'VM', 'GRC')),
    alert_name VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    mitre_technique VARCHAR(50),
    source_ip VARCHAR(50),
    destination_ip VARCHAR(50),
    hostname VARCHAR(100),
    username VARCHAR(100),
    raw_telemetry JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Cross-Module Raw SOC Events
CREATE TABLE IF NOT EXISTS soc_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    severity_level INT NOT NULL DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 5),
    event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Incident Attack Timelines Reconstruction
CREATE TABLE IF NOT EXISTS attack_timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(100) NOT NULL REFERENCES soc_incidents(id) ON DELETE CASCADE,
    stage_order INT NOT NULL,
    stage_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    mitre_technique VARCHAR(50),
    module_source VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enterprise Threat Risk Scores Log
CREATE TABLE IF NOT EXISTS threat_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    global_threat_score INT NOT NULL CHECK (global_threat_score BETWEEN 0 AND 100),
    active_incidents_count INT NOT NULL,
    critical_alerts_count INT NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Analyst Cases & Workspace Assignments
CREATE TABLE IF NOT EXISTS analyst_cases (
    id VARCHAR(100) PRIMARY KEY,
    incident_id VARCHAR(100) NOT NULL REFERENCES soc_incidents(id) ON DELETE CASCADE,
    lead_analyst VARCHAR(100) NOT NULL,
    case_priority VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    investigation_status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    resolution_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SOC Performance Metrics
CREATE TABLE IF NOT EXISTS soc_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mttd_minutes NUMERIC(10, 2) NOT NULL DEFAULT 4.20,
    mttr_minutes NUMERIC(10, 2) NOT NULL DEFAULT 12.50,
    mttc_minutes NUMERIC(10, 2) NOT NULL DEFAULT 8.10,
    events_ingested_24h BIGINT NOT NULL DEFAULT 1428500,
    automated_playbooks_executed INT NOT NULL DEFAULT 342,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Investigation Notes & Evidence History
CREATE TABLE IF NOT EXISTS investigation_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(100) NOT NULL REFERENCES soc_incidents(id) ON DELETE CASCADE,
    author VARCHAR(100) NOT NULL,
    note_content TEXT NOT NULL,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Correlation Indexes
CREATE INDEX IF NOT EXISTS idx_soc_alerts_incident ON soc_alerts (incident_id);
CREATE INDEX IF NOT EXISTS idx_soc_alerts_module ON soc_alerts (source_module);
CREATE INDEX IF NOT EXISTS idx_soc_incidents_severity ON soc_incidents (severity);
CREATE INDEX IF NOT EXISTS idx_attack_timelines_incident ON attack_timelines (incident_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_soc_events_time ON soc_events (occurred_at DESC);

-- Seed Initial High Severity SOC Incident
INSERT INTO soc_incidents (id, title, severity, status, risk_score, mitre_tactics, affected_hosts, affected_users, assigned_analyst, summary)
VALUES (
    'INC-2026-XDR-001',
    'Multi-StageAPT Campaign: Ransomware Staging & LSASS Credential Dumping',
    'CRITICAL',
    'INVESTIGATING',
    96,
    '["Initial Access", "Credential Access", "Defense Evasion", "Impact"]'::jsonb,
    '["EP-WIN-DC01", "192.168.1.105"]'::jsonb,
    '["CORP\\\\Administrator", "usr-m-vance"]'::jsonb,
    'Elena Rostova (Lead CISO)',
    'Correlation detected across SIEM, EDR, NDR, and UEBA engines. PowerShell encoded command executed on DC01, LSASS memory dumped, and suspicious SMB relay connection established to external Tor exit node.'
) ON CONFLICT (id) DO NOTHING;
