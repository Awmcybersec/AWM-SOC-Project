-- ============================================================================
-- AWM Cyber AI Enterprise Autonomous Response & Human Approval Engine Schema
-- Version: 1.0.0
-- Database Compatibility: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Response Policies Table
CREATE TABLE IF NOT EXISTS response_policies (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('FIREWALL', 'ENDPOINT', 'IDENTITY', 'THREAT_INTEL')),
    action_type VARCHAR(50) NOT NULL,
    min_threat_score INT NOT NULL DEFAULT 70 CHECK (min_threat_score BETWEEN 0 AND 100),
    min_confidence INT NOT NULL DEFAULT 70 CHECK (min_confidence BETWEEN 0 AND 100),
    auto_approve BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Human Approval Requests Table
CREATE TABLE IF NOT EXISTS approval_requests (
    id VARCHAR(100) PRIMARY KEY,
    alert_id VARCHAR(100) NOT NULL,
    threat_score INT NOT NULL CHECK (threat_score BETWEEN 0 AND 100),
    confidence_score INT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    business_impact VARCHAR(50) NOT NULL,
    mitre_mapping JSONB NOT NULL DEFAULT '[]'::jsonb,
    asset_criticality VARCHAR(50) NOT NULL,
    threat_intel_reputation VARCHAR(50) NOT NULL,
    evidence TEXT NOT NULL,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_reasoning TEXT NOT NULL,
    risk_explanation TEXT NOT NULL,
    recommended_action VARCHAR(100) NOT NULL,
    alternative_action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'MODIFIED', 'AUTO_EXECUTED', 'MONITORED')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP WITH TIME ZONE,
    decided_by VARCHAR(100),
    modified_action VARCHAR(100)
);

-- 3. Executed Response Actions Table
CREATE TABLE IF NOT EXISTS response_actions (
    id VARCHAR(100) PRIMARY KEY,
    approval_request_id VARCHAR(100) REFERENCES approval_requests(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL,
    target_identifier VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING', 'ROLLED_BACK')),
    integration_system VARCHAR(100) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    result_details JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 4. Active & Historical Blocked Entities Table
CREATE TABLE IF NOT EXISTS blocked_entities (
    id VARCHAR(100) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('IP', 'CIDR', 'COUNTRY', 'PORT', 'ENDPOINT', 'PROCESS', 'FILE', 'USER', 'DOMAIN', 'URL', 'SHA256', 'MD5', 'JA3', 'EMAIL')),
    entity_value VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    blocked_by VARCHAR(50) NOT NULL CHECK (blocked_by IN ('AUTO', 'HUMAN_APPROVAL', 'MANUAL')),
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UNBLOCKED'))
);

-- 5. Response Audit Logs Table
CREATE TABLE IF NOT EXISTS response_audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    hash VARCHAR(255) NOT NULL
);

-- Indexing for high-throughput query performance
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_blocked_entities_status ON blocked_entities(status);
CREATE INDEX IF NOT EXISTS idx_response_actions_request ON response_actions(approval_request_id);
