-- ============================================================================
-- SentinelAI EDR Engine - PostgreSQL Database Schema & Migrations
-- Version: 1.0.0
-- Database Compatibility: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Endpoints Master Inventory
CREATE TABLE IF NOT EXISTS edr_endpoints (
    id VARCHAR(100) PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    os_name VARCHAR(100) NOT NULL, -- Windows Server 2022, Ubuntu 22.04 LTS, macOS Sequoia 15.1
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('WINDOWS', 'LINUX', 'MACOS')),
    ip_address INET NOT NULL,
    mac_address VARCHAR(50),
    agent_version VARCHAR(50) NOT NULL DEFAULT 'v2.4.1',
    status VARCHAR(20) NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'ISOLATED', 'DEGRADED')),
    is_isolated BOOLEAN NOT NULL DEFAULT FALSE,
    risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Endpoint Agents Health & Metrics
CREATE TABLE IF NOT EXISTS edr_endpoint_agents (
    id VARCHAR(100) PRIMARY KEY,
    endpoint_id VARCHAR(100) REFERENCES edr_endpoints(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL DEFAULT 'SENTINEL_EDR_KERNEL',
    cpu_usage_pct REAL NOT NULL DEFAULT 0.0,
    memory_usage_mb REAL NOT NULL DEFAULT 0.0,
    health_score INT NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
    tamper_protection_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Endpoint Process Telemetry & Process Tree
CREATE TABLE IF NOT EXISTS edr_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id VARCHAR(100) REFERENCES edr_endpoints(id) ON DELETE CASCADE,
    pid INT NOT NULL,
    ppid INT NOT NULL,
    process_name VARCHAR(255) NOT NULL,
    process_path TEXT NOT NULL,
    command_line TEXT,
    user_account VARCHAR(255) NOT NULL,
    hash_sha256 VARCHAR(64),
    integrity_level VARCHAR(50) DEFAULT 'MEDIUM',
    parent_process_name VARCHAR(255),
    is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edr_proc_endpoint ON edr_processes (endpoint_id);
CREATE INDEX IF NOT EXISTS idx_edr_proc_name ON edr_processes (process_name);
CREATE INDEX IF NOT EXISTS idx_edr_proc_pid ON edr_processes (pid);

-- 4. File Integrity Monitoring (FIM) Events
CREATE TABLE IF NOT EXISTS edr_file_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id VARCHAR(100) REFERENCES edr_endpoints(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('CREATE', 'MODIFY', 'DELETE', 'RENAME')),
    file_path TEXT NOT NULL,
    file_hash VARCHAR(64),
    process_id INT,
    user_account VARCHAR(255),
    is_ransomware_activity BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edr_file_endpoint ON edr_file_events (endpoint_id);
CREATE INDEX IF NOT EXISTS idx_edr_file_path ON edr_file_events (file_path);

-- 5. Windows Registry Events
CREATE TABLE IF NOT EXISTS edr_registry_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id VARCHAR(100) REFERENCES edr_endpoints(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action VARCHAR(50) NOT NULL CHECK (action IN ('SET_VALUE', 'DELETE_KEY', 'CREATE_KEY')),
    hive VARCHAR(50) NOT NULL, -- HKLM, HKCU
    key_path TEXT NOT NULL,
    value_name VARCHAR(255),
    value_data TEXT,
    process_id INT,
    is_persistence_mechanism BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edr_reg_endpoint ON edr_registry_events (endpoint_id);

-- 6. Memory & Code Injection Events
CREATE TABLE IF NOT EXISTS edr_memory_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id VARCHAR(100) REFERENCES edr_endpoints(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detection_type VARCHAR(50) NOT NULL CHECK (detection_type IN ('PROCESS_INJECTION', 'REFLECTIVE_DLL', 'UNBACKED_MEMORY_EXEC', 'LSASS_CRED_DUMP')),
    process_id INT NOT NULL,
    target_pid INT,
    memory_region VARCHAR(100),
    risk_score INT NOT NULL DEFAULT 85,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EDR Endpoint Alerts
CREATE TABLE IF NOT EXISTS edr_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id VARCHAR(100) REFERENCES edr_endpoints(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    mitre_tactic VARCHAR(100),
    mitre_technique VARCHAR(100),
    attack_procedure TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'MITIGATED', 'FALSE_POSITIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edr_alerts_timestamp ON edr_alerts (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_edr_alerts_endpoint ON edr_alerts (endpoint_id);

-- 8. Response Actions (Remote Containment & Remediation)
CREATE TABLE IF NOT EXISTS edr_response_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id VARCHAR(100) REFERENCES edr_endpoints(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('ISOLATE_HOST', 'TERMINATE_PROCESS', 'QUARANTINE_FILE', 'RESTORE_NETWORK')),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    initiated_by VARCHAR(255) NOT NULL DEFAULT 'SOAR_AUTOMATION',
    result_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Endpoints
INSERT INTO edr_endpoints (id, hostname, os_name, platform, ip_address, mac_address, agent_version, status, is_isolated, risk_score)
VALUES
('EP-WIN-DC01', 'dc-primary.corp.local', 'Windows Server 2022 Standard', 'WINDOWS', '10.0.1.5', '00:15:5D:01:A4:10', 'v2.4.1', 'ONLINE', FALSE, 92),
('EP-LNX-K8S01', 'k8s-prod-node-01', 'Ubuntu 22.04.3 LTS', 'LINUX', '10.0.4.12', '02:42:AC:11:00:02', 'v2.4.1', 'ONLINE', FALSE, 15),
('EP-MAC-WK01', 'macbook-secops-01', 'macOS Sequoia 15.1', 'MACOS', '192.168.1.105', 'a4:83:e7:22:10:99', 'v2.4.1', 'ONLINE', FALSE, 85)
ON CONFLICT (id) DO NOTHING;
