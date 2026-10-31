-- Migration 013: AI Model Management & Provider Architecture
-- Schema for managing online AI models, offline local AI engines, router logs & provider configurations

CREATE TABLE IF NOT EXISTS ai_models (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL, -- ONLINE_AGENT, OFFLINE_LOCAL, ENTERPRISE_PRIVATE, HYBRID
    version VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'HEALTHY', -- HEALTHY, DEGRADED, UNAVAILABLE
    is_offline_capable BOOLEAN NOT NULL DEFAULT FALSE,
    last_health_check TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_model_usage_logs (
    id VARCHAR(64) PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL,
    model_name VARCHAR(128) NOT NULL,
    mode_used VARCHAR(32) NOT NULL, -- OFFLINE_ONLY, ONLINE_ONLY, HYBRID, ENTERPRISE_PRIVATE
    is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    latency_ms INT NOT NULL DEFAULT 0,
    tokens_used INT NOT NULL DEFAULT 0,
    prompt_scope VARCHAR(64) DEFAULT 'GENERAL_COPILOT',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_decision_feedback (
    id VARCHAR(64) PRIMARY KEY,
    decision_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    score INT NOT NULL, -- 0-100
    feedback_status VARCHAR(32) NOT NULL, -- ACCURATE, INCORRECT, FALSE_POSITIVE, ADJUSTED
    soc_operator VARCHAR(64),
    comments TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_provider_settings (
    id VARCHAR(64) PRIMARY KEY,
    setting_key VARCHAR(64) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial default AI providers
INSERT INTO ai_models (id, name, provider, type, version, status, is_offline_capable)
VALUES 
    ('provider-gemini-online', 'Gemini 3.6 Flash', 'google', 'ONLINE_AGENT', 'gemini-3.6-flash', 'HEALTHY', FALSE),
    ('provider-local-offline', 'AWM SecLM 8B', 'awm-local', 'OFFLINE_LOCAL', 'SecLM-v3.2-8B', 'HEALTHY', TRUE),
    ('provider-openai-online', 'OpenAI GPT-4o', 'openai', 'ONLINE_AGENT', 'gpt-4o-2024-08-06', 'HEALTHY', FALSE),
    ('provider-custom-enterprise', 'Enterprise Private AI', 'custom-vpc', 'ENTERPRISE_PRIVATE', 'vLLM-Qwen2.5-72B', 'HEALTHY', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed default provider settings
INSERT INTO ai_provider_settings (id, setting_key, setting_value, description)
VALUES 
    ('SET-001', 'AI_MODE', 'HYBRID', 'Global AI Operational Mode: OFFLINE_ONLY, ONLINE_ONLY, HYBRID, ENTERPRISE_PRIVATE'),
    ('SET-002', 'PRIMARY_PROVIDER', 'provider-gemini-online', 'Default active online AI Provider ID'),
    ('SET-003', 'FALLBACK_LOCAL_PROVIDER', 'provider-local-offline', 'Default offline local fallback AI engine'),
    ('SET-004', 'AIR_GAP_ENFORCEMENT', 'false', 'When true, immediately severs all external AI API calls')
ON CONFLICT (id) DO NOTHING;
