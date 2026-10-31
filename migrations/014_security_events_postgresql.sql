-- AWM AI SOC SENIOR
-- Migration 014: Unified Persistent Security Events

CREATE TABLE IF NOT EXISTS security_events (
    id BIGSERIAL PRIMARY KEY,

    event_id VARCHAR(150) NOT NULL UNIQUE,

    module VARCHAR(100) NOT NULL,
    event_type VARCHAR(150) NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'INFO',

    agent_id VARCHAR(150),
    hostname VARCHAR(255),
    os_type VARCHAR(100),
    source VARCHAR(150),

    event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    payload JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_event_time
    ON security_events (event_time DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_module
    ON security_events (module);

CREATE INDEX IF NOT EXISTS idx_security_events_severity
    ON security_events (severity);

CREATE INDEX IF NOT EXISTS idx_security_events_agent
    ON security_events (agent_id);

CREATE INDEX IF NOT EXISTS idx_security_events_hostname
    ON security_events (hostname);

CREATE INDEX IF NOT EXISTS idx_security_events_type
    ON security_events (event_type);

CREATE INDEX IF NOT EXISTS idx_security_events_payload
    ON security_events USING GIN (payload);