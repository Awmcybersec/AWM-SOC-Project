-- ============================================================================
-- SentinelAI SIEM Engine - PostgreSQL Database Schema & Migrations
-- Version: 1.0.0
-- Database Compatibility: PostgreSQL 14+
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For high-performance text search

-- 1. SIEM Ingested Logs Table (Partitioned by timestamp for high performance)
CREATE TABLE IF NOT EXISTS siem_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')),
    source_type VARCHAR(50) NOT NULL, -- e.g. Syslog, WindowsEvent, CloudTrail, Suricata, Kubernetes
    service_name VARCHAR(100),
    host_name VARCHAR(255),
    source_ip INET,
    destination_ip INET,
    user_name VARCHAR(100),
    event_category VARCHAR(100),
    event_id INT,
    message TEXT NOT NULL,
    ecs_raw JSONB NOT NULL, -- Elastic Common Schema compliant JSON structure
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- High-performance indexes for log search & analytics
CREATE INDEX IF NOT EXISTS idx_siem_logs_timestamp ON siem_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_siem_logs_level ON siem_logs (log_level);
CREATE INDEX IF NOT EXISTS idx_siem_logs_source_ip ON siem_logs (source_ip);
CREATE INDEX IF NOT EXISTS idx_siem_logs_host_name ON siem_logs (host_name);
CREATE INDEX IF NOT EXISTS idx_siem_logs_event_category ON siem_logs (event_category);
CREATE INDEX IF NOT EXISTS idx_siem_logs_ecs_gin ON siem_logs USING GIN (ecs_raw);
CREATE INDEX IF NOT EXISTS idx_siem_logs_message_trgm ON siem_logs USING GIN (message gin_trgm_ops);

-- 2. SIEM Correlation Detection Rules Table
CREATE TABLE IF NOT EXISTS siem_rules (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    log_source VARCHAR(100) NOT NULL,
    condition_kql TEXT NOT NULL,
    time_window_seconds INT NOT NULL DEFAULT 300,
    threshold_count INT NOT NULL DEFAULT 1,
    mitre_tactic VARCHAR(100),
    mitre_technique VARCHAR(100),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SIEM Correlation Alerts Table
CREATE TABLE IF NOT EXISTS siem_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id VARCHAR(100) REFERENCES siem_rules(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    matched_log_count INT NOT NULL DEFAULT 1,
    first_seen TIMESTAMPTZ NOT NULL,
    last_seen TIMESTAMPTZ NOT NULL,
    host_name VARCHAR(255),
    source_ip INET,
    mitre_tactic VARCHAR(100),
    mitre_technique VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'MITIGATED', 'FALSE_POSITIVE')),
    trigger_context JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_siem_alerts_status ON siem_alerts (status);
CREATE INDEX IF NOT EXISTS idx_siem_alerts_severity ON siem_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_siem_alerts_created_at ON siem_alerts (created_at DESC);

-- Seed Initial Default SIEM Correlation Rules
INSERT INTO siem_rules (id, title, description, severity, log_source, condition_kql, time_window_seconds, threshold_count, mitre_tactic, mitre_technique, enabled)
VALUES
('RULE-101', 'Multiple Failed SSH Authentication Attempts', 'Triggers when a host receives multiple SSH login failures within 60 seconds.', 'HIGH', 'Syslog', 'level:WARN AND message:Failed', 60, 3, 'Credential Access', 'T1110 - Brute Force', TRUE),
('RULE-102', 'Privileged AWS CloudTrail IAM Modification', 'Detects deletion or policy attachment to admin role in AWS.', 'CRITICAL', 'CloudTrail', 'level:ERROR AND message:AttachRolePolicy', 120, 1, 'Privilege Escalation', 'T1098 - Account Manipulation', TRUE),
('RULE-103', 'Windows Security Event Log Clearing', 'Fired when event code 1102 (audit log cleared) is recorded on a domain controller.', 'CRITICAL', 'WindowsEvent', 'level:CRITICAL AND message:1102', 30, 1, 'Defense Evasion', 'T1070 - Indicator Removal', TRUE),
('RULE-104', 'Kubernetes Cluster RBAC Escalation', 'Detects binding cluster-admin role to unknown service account.', 'HIGH', 'Kubernetes', 'level:WARN AND message:ClusterRoleBinding', 300, 1, 'Privilege Escalation', 'T1611 - Escape to Host', TRUE)
ON CONFLICT (id) DO NOTHING;
