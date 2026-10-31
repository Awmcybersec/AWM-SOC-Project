-- ============================================================================
-- SentinelAI SOAR Engine - PostgreSQL Database Schema & Migrations
-- Version: 1.0.0
-- Database Compatibility: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Automated Security Playbooks
CREATE TABLE IF NOT EXISTS soar_playbooks (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('SIEM_ALERT', 'EDR_DETECTION', 'NDR_FLOW', 'UEBA_ANOMALY', 'MANUAL_TRIGGER', 'SCHEDULED')),
    trigger_condition JSONB NOT NULL DEFAULT '{}'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    total_runs INT NOT NULL DEFAULT 0,
    success_rate REAL NOT NULL DEFAULT 100.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Incident Case Management
CREATE TABLE IF NOT EXISTS soar_incidents (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'TRIAGED', 'IN_PROGRESS', 'CONTAINED', 'RESOLVED', 'CLOSED')),
    source_module VARCHAR(50) NOT NULL CHECK (source_module IN ('SIEM', 'EDR', 'NDR', 'UEBA', 'MANUAL')),
    source_alert_id VARCHAR(100),
    assigned_analyst VARCHAR(100) DEFAULT 'SOAR_AUTO_PILOT',
    timeline JSONB DEFAULT '[]'::jsonb,
    evidence JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Playbook Executions
CREATE TABLE IF NOT EXISTS soar_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playbook_id VARCHAR(100) REFERENCES soar_playbooks(id) ON DELETE CASCADE,
    incident_id VARCHAR(100) REFERENCES soar_incidents(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('PENDING', 'RUNNING', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    current_step INT NOT NULL DEFAULT 1,
    step_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    triggered_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM_CORRELATION'
);

-- 4. Individual Containment Actions
CREATE TABLE IF NOT EXISTS soar_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES soar_executions(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('BLOCK_IP', 'ISOLATE_HOST', 'DISABLE_USER', 'REVOKE_SESSION', 'QUARANTINE_FILE', 'CREATE_TICKET', 'SEND_NOTIFICATION', 'REQUEST_APPROVAL')),
    target VARCHAR(255) NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED')),
    result_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Human-in-the-Loop Approval Gates
CREATE TABLE IF NOT EXISTS soar_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES soar_executions(id) ON DELETE CASCADE,
    step_name VARCHAR(255) NOT NULL,
    required_role VARCHAR(100) NOT NULL DEFAULT 'SOC_LEAD_ANALYST',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(100)
);

-- 6. Audit & Compliance Logs
CREATE TABLE IF NOT EXISTS soar_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(100) REFERENCES soar_incidents(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES soar_executions(id) ON DELETE CASCADE,
    action_name VARCHAR(100) NOT NULL,
    actor VARCHAR(100) NOT NULL DEFAULT 'SOAR_ENGINE',
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Time Series and Search
CREATE INDEX IF NOT EXISTS idx_soar_incidents_severity ON soar_incidents (severity);
CREATE INDEX IF NOT EXISTS idx_soar_incidents_status ON soar_incidents (status);
CREATE INDEX IF NOT EXISTS idx_soar_executions_playbook ON soar_executions (playbook_id);
CREATE INDEX IF NOT EXISTS idx_soar_actions_type ON soar_actions (action_type);

-- Seed Initial Enterprise Playbooks
INSERT INTO soar_playbooks (id, name, description, trigger_type, is_active, total_runs, success_rate, steps)
VALUES
('PB-EDR-RANSOMWARE-01', 'Automated Ransomware Containment & Host Isolation', 'Immediately isolates endpoint, kills process tree, quarantines .locked file extensions, and notifies SOC', 'EDR_DETECTION', TRUE, 42, 100.0, '[
  {"step": 1, "name": "Isolate Host Network", "action": "ISOLATE_HOST", "target": "ENDPOINT_ID", "require_approval": false},
  {"step": 2, "name": "Terminate Suspicious Process Tree", "action": "QUARANTINE_FILE", "target": "PROCESS_PID", "require_approval": false},
  {"step": 3, "name": "Escalate Incident Ticket", "action": "CREATE_TICKET", "target": "SOC_BOARD", "require_approval": false}
]'::jsonb),
('PB-UEBA-IMPOSSIBLE-TRAVEL', 'Credential Compromise & Token Revocation', 'Revokes SAML tokens, resets user credentials, and blocks IP on firewall for impossible travel violations', 'UEBA_ANOMALY', TRUE, 28, 96.4, '[
  {"step": 1, "name": "Revoke User OAuth/SAML Token", "action": "REVOKE_SESSION", "target": "USER_ID", "require_approval": false},
  {"step": 2, "name": "Block Malicious Source IP", "action": "BLOCK_IP", "target": "SOURCE_IP", "require_approval": false},
  {"step": 3, "name": "Request Senior Analyst Account Disable Approval", "action": "REQUEST_APPROVAL", "target": "SOC_LEAD", "require_approval": true}
]'::jsonb),
('PB-NDR-C2-CONTAINMENT', 'NDR Botnet Command & Control IP Blacklisting', 'Correlates C2 beaconing activity, adds IP to edge firewall blacklist, and isolates originating subnet', 'NDR_FLOW', TRUE, 64, 100.0, '[
  {"step": 1, "name": "Edge Firewall IP Blacklist", "action": "BLOCK_IP", "target": "DEST_C2_IP", "require_approval": false},
  {"step": 2, "name": "Generate Threat Intel Indicator", "action": "CREATE_TICKET", "target": "THREAT_INTEL", "require_approval": false}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;
