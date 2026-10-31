-- AWM AI SOC SENIOR Enterprise PostgreSQL Initialization Schema
-- Supports Windows Server 2019/2022/2025 & Windows 10/11

CREATE DATABASE awm_ai_soc_db;

\c awm_ai_soc_db;

-- 1. SIEM Logs Schema
CREATE TABLE IF NOT EXISTS siem_logs (
    id VARCHAR(128) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(16) NOT NULL,
    source_type VARCHAR(64) NOT NULL,
    service_name VARCHAR(64),
    host VARCHAR(128) NOT NULL,
    source_ip VARCHAR(64) NOT NULL,
    destination_ip VARCHAR(64),
    user_name VARCHAR(128),
    category VARCHAR(64) NOT NULL,
    event_id VARCHAR(64),
    message TEXT NOT NULL,
    raw_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_siem_logs_timestamp ON siem_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_siem_logs_source_type ON siem_logs(source_type);
CREATE INDEX IF NOT EXISTS idx_siem_logs_level ON siem_logs(level);

-- 2. EDR Telemetry & Endpoints Schema
CREATE TABLE IF NOT EXISTS edr_endpoints (
    id VARCHAR(128) PRIMARY KEY,
    hostname VARCHAR(128) NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    os_name VARCHAR(128) NOT NULL,
    agent_version VARCHAR(32) NOT NULL,
    status VARCHAR(32) DEFAULT 'Online',
    isolated BOOLEAN DEFAULT FALSE,
    risk_score INT DEFAULT 0,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. NDR Network Flows Schema
CREATE TABLE IF NOT EXISTS ndr_network_flows (
    id VARCHAR(128) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    protocol VARCHAR(16) NOT NULL,
    source_ip VARCHAR(64) NOT NULL,
    source_port INT NOT NULL,
    destination_ip VARCHAR(64) NOT NULL,
    destination_port INT NOT NULL,
    bytes_sent BIGINT DEFAULT 0,
    bytes_received BIGINT DEFAULT 0,
    threat_category VARCHAR(64)
);

-- 4. UEBA Anomalies Schema
CREATE TABLE IF NOT EXISTS ueba_anomalies (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    username VARCHAR(128) NOT NULL,
    anomaly_type VARCHAR(128) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    risk_delta INT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

-- 5. SOAR Playbooks & Incident Executions Schema
CREATE TABLE IF NOT EXISTS soar_executions (
    id VARCHAR(128) PRIMARY KEY,
    playbook_id VARCHAR(128) NOT NULL,
    playbook_name VARCHAR(256) NOT NULL,
    status VARCHAR(32) NOT NULL,
    triggered_by VARCHAR(128) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_log JSONB
);

-- 6. Autonomous Response Audit Logs
CREATE TABLE IF NOT EXISTS autonomous_audit_logs (
    id VARCHAR(128) PRIMARY KEY,
    actor VARCHAR(128) NOT NULL,
    action_type VARCHAR(128) NOT NULL,
    target VARCHAR(256) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. System Audit & Compliance Register
CREATE TABLE IF NOT EXISTS system_audit_trail (
    id VARCHAR(128) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(128) NOT NULL,
    role VARCHAR(64) NOT NULL,
    action VARCHAR(256) NOT NULL,
    target VARCHAR(256) NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL
);
