-- ============================================================================
-- SentinelAI NDR/NIDS Engine - PostgreSQL Database Schema & Migrations
-- Version: 1.0.0
-- Database Compatibility: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Sensors Table (Suricata, Zeek, eBPF Kernel Probes)
CREATE TABLE IF NOT EXISTS ndr_sensors (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sensor_type VARCHAR(50) NOT NULL CHECK (sensor_type IN ('SURICATA', 'ZEEK', 'EBPF_PROBE', 'NETFLOW_AGENT')),
    hostname VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    interface VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DEGRADED', 'OFFLINE')),
    packets_processed BIGINT NOT NULL DEFAULT 0,
    drops_count BIGINT NOT NULL DEFAULT 0,
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Network Flows Table
CREATE TABLE IF NOT EXISTS network_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id VARCHAR(100) REFERENCES ndr_sensors(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    protocol VARCHAR(20) NOT NULL, -- HTTP, DNS, TLS, SSH, SMB, TCP, UDP
    source_ip INET NOT NULL,
    source_port INT NOT NULL,
    destination_ip INET NOT NULL,
    destination_port INT NOT NULL,
    bytes_sent BIGINT NOT NULL DEFAULT 0,
    bytes_received BIGINT NOT NULL DEFAULT 0,
    packets_count INT NOT NULL DEFAULT 1,
    duration_ms INT NOT NULL DEFAULT 0,
    ja3_hash VARCHAR(64), -- SSL/TLS Fingerprint
    sni_hostname VARCHAR(255),
    dns_query VARCHAR(255),
    http_method VARCHAR(10),
    http_uri TEXT,
    http_user_agent TEXT,
    risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_flows_timestamp ON network_flows (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_network_flows_src_ip ON network_flows (source_ip);
CREATE INDEX IF NOT EXISTS idx_network_flows_dst_ip ON network_flows (destination_ip);
CREATE INDEX IF NOT EXISTS idx_network_flows_protocol ON network_flows (protocol);
CREATE INDEX IF NOT EXISTS idx_network_flows_dns ON network_flows (dns_query);

-- 3. Network Raw Packet Telemetry Table
CREATE TABLE IF NOT EXISTS network_packets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID REFERENCES network_flows(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_ip INET NOT NULL,
    destination_ip INET NOT NULL,
    source_port INT NOT NULL,
    destination_port INT NOT NULL,
    protocol VARCHAR(20) NOT NULL,
    payload_length INT NOT NULL,
    payload_hex TEXT NOT NULL,
    payload_ascii TEXT,
    flags VARCHAR(50), -- SYN, ACK, FIN, RST
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_packets_flow ON network_packets (flow_id);

-- 4. NDR Intrusion Detection Rules (Suricata / Zeek / Behavioral Signatures)
CREATE TABLE IF NOT EXISTS ndr_detection_rules (
    id VARCHAR(100) PRIMARY KEY,
    sid INT UNIQUE, -- Suricata Signature ID
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('SURICATA_SIG', 'ZEEK_SCRIPT', 'DNS_ANOMALY', 'C2_BEACON', 'LATERAL_MOVE')),
    pattern_expression TEXT NOT NULL,
    mitre_tactic VARCHAR(100),
    mitre_technique VARCHAR(100),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Intrusion Alerts Table
CREATE TABLE IF NOT EXISTS intrusion_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id VARCHAR(100) REFERENCES ndr_detection_rules(id) ON DELETE SET NULL,
    sensor_id VARCHAR(100) REFERENCES ndr_sensors(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    source_ip INET NOT NULL,
    source_port INT NOT NULL,
    destination_ip INET NOT NULL,
    destination_port INT NOT NULL,
    protocol VARCHAR(20) NOT NULL,
    mitre_tactic VARCHAR(100),
    mitre_technique VARCHAR(100),
    c2_confidence_score INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'MITIGATED', 'FALSE_POSITIVE')),
    packet_evidence_id UUID REFERENCES network_packets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intrusion_alerts_timestamp ON intrusion_alerts (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_intrusion_alerts_severity ON intrusion_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_intrusion_alerts_status ON intrusion_alerts (status);

-- Seed Sensors
INSERT INTO ndr_sensors (id, name, sensor_type, hostname, ip_address, interface, status, packets_processed, drops_count)
VALUES
('SENSOR-SURICATA-01', 'Primary Edge Suricata NIDS', 'SURICATA', 'suricata-node-01.corp', '10.0.1.10', 'eth0', 'ACTIVE', 18459200, 12),
('SENSOR-ZEEK-01', 'Core Network Zeek Protocol Analyzer', 'ZEEK', 'zeek-node-01.corp', '10.0.1.11', 'eth1', 'ACTIVE', 24100500, 0),
('SENSOR-EBPF-01', 'Host eBPF Kernel Network Probe', 'EBPF_PROBE', 'app-prod-host-01', '10.0.4.12', 'veth0', 'ACTIVE', 8920100, 3)
ON CONFLICT (id) DO NOTHING;

-- Seed NDR Detection Rules
INSERT INTO ndr_detection_rules (id, sid, title, description, severity, rule_type, pattern_expression, mitre_tactic, mitre_technique, enabled)
VALUES
('NDR-RULE-201', 2028101, 'ET TROJAN Cobalt Strike Malleable HTTP C2 Beaconing', 'Detects Cobalt Strike default HTTP GET metadata payload in URI', 'CRITICAL', 'SURICATA_SIG', 'http.uri contains "/match/c2/beacon"', 'Command and Control', 'T1071.001 - Web Protocols', TRUE),
('NDR-RULE-202', 2028102, 'DNS High Entropy TXT Tunneling Query', 'Detects DNS queries with high Shannon entropy indicative of Iodine / Dnscat2 C2', 'HIGH', 'DNS_ANOMALY', 'dns.entropy > 4.2 AND type == "TXT"', 'Command and Control', 'T1071.004 - DNS C2', TRUE),
('NDR-RULE-203', 2028103, 'Internal SMB Pass-the-Hash / Lateral Movement Sweep', 'Detects high frequency SMB connection bursts across internal subnets', 'HIGH', 'LATERAL_MOVE', 'protocol == "SMB" AND flow.rate > 20/sec', 'Lateral Movement', 'T1021.002 - SMB/Windows Admin Shares', TRUE),
('NDR-RULE-204', 2028104, 'JA3 Blacklisted SSL/TLS Malware Fingerprint Match', 'Matches SSL Client Hello JA3 fingerprint against known Ransomware C2 infrastructure', 'CRITICAL', 'SURICATA_SIG', 'ja3 == "7225725203138b1933e0856edc95e1e1"', 'Command and Control', 'T1573 - Encrypted Channel', TRUE)
ON CONFLICT (id) DO NOTHING;
