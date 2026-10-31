-- ============================================================================
-- SentinelAI UEBA Engine - PostgreSQL Database Schema & Migrations
-- Version: 1.0.0
-- Database Compatibility: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Master Users & Identity Entities
CREATE TABLE IF NOT EXISTS ueba_users (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('USER', 'ADMIN', 'SERVICE_ACCOUNT', 'THIRD_PARTY_CONTRACTOR', 'CLOUD_IDENTITY')),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_dormant BOOLEAN NOT NULL DEFAULT FALSE,
    risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Entities (Non-Human or Multi-device Identifiers)
CREATE TABLE IF NOT EXISTS ueba_entities (
    id VARCHAR(100) PRIMARY KEY,
    entity_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('USER_ACCOUNT', 'SERVICE_PRINCIPAL', 'DEVICE_WORKSTATION', 'SERVER_NODE', 'CLOUD_RESOURCE')),
    owner_user_id VARCHAR(100) REFERENCES ueba_users(id) ON DELETE SET NULL,
    risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Behavioral Profiles & Learned Baselines
CREATE TABLE IF NOT EXISTS behavior_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) REFERENCES ueba_users(id) ON DELETE CASCADE,
    normal_working_hours VARCHAR(50) DEFAULT '08:00-18:00 UTC',
    usual_locations JSONB DEFAULT '["US-East", "US-West"]'::jsonb,
    usual_ip_ranges JSONB DEFAULT '["10.0.0.0/8", "192.168.1.0/24"]'::jsonb,
    usual_devices JSONB DEFAULT '["EP-WIN-DC01", "EP-MAC-WK01"]'::jsonb,
    avg_daily_auth_count REAL DEFAULT 15.2,
    avg_data_download_mb REAL DEFAULT 250.0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Authentication & Login Events
CREATE TABLE IF NOT EXISTS ueba_login_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) REFERENCES ueba_users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    login_status VARCHAR(20) NOT NULL CHECK (login_status IN ('SUCCESS', 'FAILURE', 'BLOCKED')),
    source_ip INET NOT NULL,
    geo_location VARCHAR(100) NOT NULL, -- e.g., "New York, USA", "London, UK", "Moscow, RU"
    device_hostname VARCHAR(255),
    auth_method VARCHAR(50) NOT NULL DEFAULT 'OAUTH_SAML_MFA',
    user_agent TEXT,
    is_impossible_travel BOOLEAN DEFAULT FALSE,
    is_off_hours BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ueba_login_user ON ueba_login_events (user_id);
CREATE INDEX IF NOT EXISTS idx_ueba_login_timestamp ON ueba_login_events (timestamp DESC);

-- 5. Entity Telemetry Events (FIM, Data Transfer, API, Privilege Access)
CREATE TABLE IF NOT EXISTS ueba_entity_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) REFERENCES ueba_users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_category VARCHAR(50) NOT NULL CHECK (event_category IN ('AUTH', 'DATA_ACCESS', 'PRIVILEGE_CHANGE', 'API_USAGE', 'NETWORK_FLOW', 'FILE_EXFILTRATION')),
    action_description TEXT NOT NULL,
    source_ip INET,
    target_resource VARCHAR(255),
    volume_bytes BIGINT DEFAULT 0,
    risk_impact INT DEFAULT 0 CHECK (risk_impact BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Behavioral Anomalies & Detections
CREATE TABLE IF NOT EXISTS ueba_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) REFERENCES ueba_users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    anomaly_type VARCHAR(100) NOT NULL, -- IMPOSSIBLE_TRAVEL, PASSWORD_SPRAYING, BRUTE_FORCE, ABNORMAL_DATA_EXFIL, PRIVILEGE_ESCALATION, DORMANT_ACCOUNT_REACTIVATION
    anomaly_score INT NOT NULL CHECK (anomaly_score BETWEEN 0 AND 100),
    confidence_score INT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    mitre_tactic VARCHAR(100),
    mitre_technique VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ueba_anomalies_user ON ueba_anomalies (user_id);
CREATE INDEX IF NOT EXISTS idx_ueba_anomalies_timestamp ON ueba_anomalies (timestamp DESC);

-- 7. Risk Score Tracking
CREATE TABLE IF NOT EXISTS ueba_risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) REFERENCES ueba_users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    risk_score INT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 8. AI Security Copilot Investigation History
CREATE TABLE IF NOT EXISTS ueba_investigation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) REFERENCES ueba_users(id) ON DELETE CASCADE,
    analyst_id VARCHAR(100) NOT NULL DEFAULT 'SOAR_AUTO_COPILOT',
    investigation_summary TEXT NOT NULL,
    mitre_mapping TEXT,
    recommended_soar_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial UEBA Users
INSERT INTO ueba_users (id, username, email, department, role, account_type, is_admin, is_dormant, risk_score, risk_level)
VALUES
('USR-ADMIN-01', 'admin01', 'admin01@corp.local', 'IT Security', 'Global Domain Administrator', 'ADMIN', TRUE, FALSE, 88, 'HIGH'),
('USR-DEV-04', 'j.doe', 'john.doe@corp.local', 'Engineering', 'Senior Backend Engineer', 'USER', FALSE, FALSE, 15, 'LOW'),
('USR-SVC-FINANCE', 'svc_net_backup', 'svc_net_backup@corp.local', 'Finance & Ops', 'Automated Backup Service', 'SERVICE_ACCOUNT', FALSE, TRUE, 94, 'CRITICAL'),
('USR-EXEC-CEO', 'c.vance', 'ceo.vance@corp.local', 'Executive', 'Chief Executive Officer', 'USER', FALSE, FALSE, 72, 'HIGH')
ON CONFLICT (id) DO NOTHING;
