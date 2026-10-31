-- ============================================================================
-- SentinelAI Multi-Tenant Enterprise Management & SaaS Platform Schema
-- Version: 1.0.0
-- Database Compatibility: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants (Organizations) Table
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'DELETED')),
    tier VARCHAR(50) NOT NULL DEFAULT 'ENTERPRISE' CHECK (tier IN ('COMMUNITY', 'PRO', 'ENTERPRISE', 'GOVERNMENT')),
    max_agents INT NOT NULL DEFAULT 500,
    max_users INT NOT NULL DEFAULT 50,
    data_retention_days INT NOT NULL DEFAULT 90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tenant Settings
CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id VARCHAR(50) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    sso_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    sso_provider VARCHAR(50) DEFAULT 'OIDC' CHECK (sso_provider IN ('OIDC', 'SAML', 'NONE')),
    sso_domain VARCHAR(255),
    mfa_enforced BOOLEAN NOT NULL DEFAULT TRUE,
    ip_whitelist JSONB NOT NULL DEFAULT '[]'::jsonb,
    session_timeout_minutes INT NOT NULL DEFAULT 60,
    alert_email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    theme_preference VARCHAR(30) NOT NULL DEFAULT 'DARK_CYBER'
);

-- 3. Roles Definition
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Permissions Catalog
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL
);

-- 5. Role Permissions Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 6. Multi-Tenant Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED', 'PENDING_MFA', 'LOCKED')),
    mfa_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    mfa_secret VARCHAR(100),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);

-- 7. User Roles Mapping
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 8. API Keys Management
CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    secret_hash VARCHAR(255) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. User Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Software Licenses
CREATE TABLE IF NOT EXISTS licenses (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'ENTERPRISE_XDR',
    max_endpoints INT NOT NULL DEFAULT 1000,
    max_log_ingestion_gb_day INT NOT NULL DEFAULT 500,
    status VARCHAR(30) NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'EXPIRED', 'REVOKED')),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SaaS Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id VARCHAR(50) UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    billing_email VARCHAR(255) NOT NULL,
    billing_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (billing_status IN ('ACTIVE', 'PAST_DUE', 'CANCELLED')),
    monthly_price_usd NUMERIC(10, 2) NOT NULL DEFAULT 4999.00,
    renews_at TIMESTAMPTZ NOT NULL
);

-- 12. Tenant Audit Logs
CREATE TABLE IF NOT EXISTS tenant_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_user_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Tenant Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_tenant ON licenses (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_time ON tenant_audit_logs (tenant_id, timestamp DESC);

-- Seed System Roles
INSERT INTO roles (id, name, description, is_system_role) VALUES
('SUPER_ADMIN', 'Platform Super Admin', 'Full unrestricted platform access across all tenants', true),
('TENANT_ADMIN', 'Tenant Administrator', 'Full administrative access within specific organization tenant', true),
('CISO', 'Chief Information Security Officer', 'Executive view, compliance oversight, risk reporting', true),
('SOC_MANAGER', 'SOC Manager', 'Incident oversight, playbook approvals, team management', true),
('SECURITY_ANALYST', 'Security Analyst', 'Alert triage, investigation, query engine access', true),
('INCIDENT_RESPONDER', 'Incident Responder', 'EDR isolation, active containment, SOAR execution', true),
('AUDITOR', 'Auditor', 'Read-only access to compliance evidence and audit trails', true),
('READ_ONLY', 'Read Only User', 'View-only dashboards and metrics', true)
ON CONFLICT (id) DO NOTHING;
