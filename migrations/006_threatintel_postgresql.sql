-- ============================================================================
-- SentinelAI Threat Intelligence Platform (TIP) - PostgreSQL Schema & Migrations
-- Version: 1.0.0
-- Database Compatibility: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STIX/TAXII Threat Indicators (IOCs)
CREATE TABLE IF NOT EXISTS threat_indicators (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('IPv4', 'IPv6', 'DOMAIN', 'URL', 'MD5', 'SHA1', 'SHA256', 'EMAIL', 'MALWARE_SIGNATURE')),
    value TEXT NOT NULL UNIQUE,
    reputation_score INT NOT NULL DEFAULT 50 CHECK (reputation_score BETWEEN 0 AND 100),
    confidence_score INT NOT NULL DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    feed_source VARCHAR(100) NOT NULL DEFAULT 'STIX_TAXII_2.1',
    threat_actor VARCHAR(100) DEFAULT 'UNKNOWN_APT',
    malware_family VARCHAR(100) DEFAULT 'UNASSIGNED',
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STIX/TAXII Threat Feeds
CREATE TABLE IF NOT EXISTS threat_feeds (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    format VARCHAR(50) NOT NULL DEFAULT 'STIX2.1' CHECK (format IN ('STIX2.1', 'TAXII2.1', 'MISP_JSON', 'CSV_FEED', 'CUSTOM_API')),
    sync_interval_minutes INT NOT NULL DEFAULT 15,
    last_synced_at TIMESTAMPTZ,
    indicator_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    health_status VARCHAR(30) NOT NULL DEFAULT 'HEALTHY' CHECK (health_status IN ('HEALTHY', 'DEGRADED', 'SYNC_FAILED', 'UNREACHABLE'))
);

-- 3. Threat Actor Intelligence (APT Groups)
CREATE TABLE IF NOT EXISTS threat_actors (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
    origin VARCHAR(100) NOT NULL DEFAULT 'UNKNOWN',
    target_sectors JSONB NOT NULL DEFAULT '[]'::jsonb,
    top_malware JSONB NOT NULL DEFAULT '[]'::jsonb,
    ttps JSONB NOT NULL DEFAULT '[]'::jsonb,
    mitre_attack_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Malware Families Database
CREATE TABLE IF NOT EXISTS malware_families (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL DEFAULT 'Ransomware',
    platform VARCHAR(100) NOT NULL DEFAULT 'Windows/Linux',
    threat_actor_id VARCHAR(100) REFERENCES threat_actors(id) ON DELETE SET NULL,
    description TEXT,
    yara_signatures JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Threat Campaigns
CREATE TABLE IF NOT EXISTS threat_campaigns (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    threat_actor_id VARCHAR(100) REFERENCES threat_actors(id) ON DELETE SET NULL,
    target_industries JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DORMANT', 'CONCLUDED')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT
);

-- 6. Automated IOC Matches (Cross-Engine Hits)
CREATE TABLE IF NOT EXISTS ioc_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_value TEXT NOT NULL,
    indicator_type VARCHAR(50) NOT NULL,
    matched_module VARCHAR(50) NOT NULL CHECK (matched_module IN ('SIEM', 'NDR', 'EDR', 'UEBA', 'SOAR')),
    matched_event_id VARCHAR(100),
    severity VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    source_ip VARCHAR(50),
    dest_ip VARCHAR(50),
    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    details JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 7. AI Threat Intelligence Reports
CREATE TABLE IF NOT EXISTS threat_reports (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL DEFAULT 'SentinelAI Copilot',
    summary TEXT NOT NULL,
    threat_actor VARCHAR(100),
    key_iocs JSONB NOT NULL DEFAULT '[]'::jsonb,
    mitre_techniques JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Intelligence Audit & Compliance Logs
CREATE TABLE IF NOT EXISTS intelligence_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_name VARCHAR(100) NOT NULL,
    actor VARCHAR(100) NOT NULL DEFAULT 'TIP_ENGINE',
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_threat_indicators_value ON threat_indicators (value);
CREATE INDEX IF NOT EXISTS idx_threat_indicators_type ON threat_indicators (type);
CREATE INDEX IF NOT EXISTS idx_threat_indicators_reputation ON threat_indicators (reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_ioc_matches_matched_at ON ioc_matches (matched_at DESC);
CREATE INDEX IF NOT EXISTS idx_ioc_matches_module ON ioc_matches (matched_module);
