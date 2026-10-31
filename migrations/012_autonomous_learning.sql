-- Migration 012: Autonomous Learning & AI Decision History Schema
-- Enterprise AWM Cyber AI Cyber Defense Platform

CREATE TABLE IF NOT EXISTS response_feedback (
    feedback_id VARCHAR(64) PRIMARY KEY,
    decision_id VARCHAR(64) NOT NULL,
    alert_id VARCHAR(64) NOT NULL,
    threat_score INT NOT NULL,
    confidence_score INT NOT NULL,
    recommended_action TEXT NOT NULL,
    soc_action VARCHAR(32) NOT NULL, -- APPROVED, REJECTED, MODIFIED
    modified_action TEXT,
    analyst_comment TEXT,
    was_false_positive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_decision_history (
    decision_id VARCHAR(64) PRIMARY KEY,
    alert_id VARCHAR(64),
    threat_score INT NOT NULL,
    confidence_score INT NOT NULL,
    business_impact VARCHAR(32) NOT NULL,
    asset_criticality VARCHAR(64) NOT NULL,
    mitre_tactic VARCHAR(128),
    mitre_technique VARCHAR(128),
    mitre_technique_id VARCHAR(32),
    decision_mode VARCHAR(32) NOT NULL, -- CRITICAL_AUTOMATION, HUMAN_APPROVAL, MONITOR_MODE
    recommended_action TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_accuracy_metrics (
    metric_id VARCHAR(64) PRIMARY KEY,
    total_evaluations INT NOT NULL,
    approved_count INT NOT NULL,
    rejected_count INT NOT NULL,
    modified_count INT NOT NULL,
    false_positive_rate NUMERIC(5,2) NOT NULL,
    confidence_calibration_score INT NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS soc_behavior_patterns (
    pattern_id VARCHAR(64) PRIMARY KEY,
    analyst_user VARCHAR(128) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    frequency_count INT DEFAULT 1,
    last_observed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
