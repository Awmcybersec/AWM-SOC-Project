import { describe, it, expect, beforeEach } from "vitest";
import { SiemEngine } from "../server/siemEngine";

describe("SIEM Engine Core Functionality Tests", () => {
  let engine: SiemEngine;

  beforeEach(() => {
    engine = new SiemEngine();
  });

  it("should ingest raw log and transform into Elastic Common Schema (ECS)", () => {
    const rawLog = {
      message: "User admin logged in from 192.168.1.50",
      level: "INFO" as const,
      sourceType: "Syslog",
      host: "auth-server-01",
      sourceIp: "192.168.1.50",
      user: "admin",
      category: "Authentication",
    };

    const ingested = engine.ingestRawLog(rawLog);

    expect(ingested.id).toBeDefined();
    expect(ingested.level).toBe("INFO");
    expect(ingested.ecs["@timestamp"]).toBeDefined();
    expect(ingested.ecs.host.name).toBe("auth-server-01");
    expect(ingested.ecs.source.ip).toBe("192.168.1.50");
    expect(ingested.ecs.user.name).toBe("admin");
  });

  it("should parse KQL key-value and text expressions correctly", () => {
    const sampleLog = {
      id: "LOG-001",
      timestamp: new Date().toISOString(),
      level: "WARN" as const,
      sourceType: "Syslog",
      host: "db-node-02",
      sourceIp: "10.0.0.15",
      user: "postgres",
      category: "Database",
      message: "Failed password for postgres from 10.0.0.15",
      raw: "{}",
      ecs: {},
    };

    expect(engine.matchesKql(sampleLog, "level:WARN")).toBe(true);
    expect(engine.matchesKql(sampleLog, "host:db-node-02")).toBe(true);
    expect(engine.matchesKql(sampleLog, "level:WARN AND message:Failed")).toBe(true);
    expect(engine.matchesKql(sampleLog, "level:ERROR")).toBe(false);
    expect(engine.matchesKql(sampleLog, "host:app-server")).toBe(false);
  });

  it("should execute correlation rules and generate security alerts when threshold is reached", () => {
    const initialAlertsCount = engine.getAlerts().length;

    // RULE-101 requires 3 'WARN' logs with 'Failed' in 60s for Syslog
    engine.ingestRawLog({
      message: "Failed SSH login attempt 1",
      level: "WARN",
      sourceType: "Syslog",
      host: "bastion-host",
      sourceIp: "185.220.101.99",
    });

    engine.ingestRawLog({
      message: "Failed SSH login attempt 2",
      level: "WARN",
      sourceType: "Syslog",
      host: "bastion-host",
      sourceIp: "185.220.101.99",
    });

    engine.ingestRawLog({
      message: "Failed SSH login attempt 3",
      level: "WARN",
      sourceType: "Syslog",
      host: "bastion-host",
      sourceIp: "185.220.101.99",
    });

    const newAlerts = engine.getAlerts();
    expect(newAlerts.length).toBeGreaterThan(initialAlertsCount);

    const triggeredAlert = newAlerts[0];
    expect(triggeredAlert.title).toContain("Multiple Failed SSH Authentication Attempts");
    expect(triggeredAlert.host).toBe("bastion-host");
    expect(triggeredAlert.severity).toBe("HIGH");
  });

  it("should calculate telemetry stats accurately", () => {
    const stats = engine.getStats();

    expect(stats.totalLogs).toBeGreaterThan(0);
    expect(stats.levelCounts.CRITICAL).toBeGreaterThanOrEqual(1);
    expect(stats.activeRules).toBeGreaterThan(0);
    expect(stats.topHosts.length).toBeGreaterThan(0);
  });

  it("should support adding and deleting custom correlation rules", () => {
    const initialRules = engine.getRules().length;

    const newRule = {
      id: "RULE-CUSTOM-99",
      title: "Custom High Volume Port Scan Detection",
      description: "Detects port scan attempts",
      severity: "CRITICAL" as const,
      logSource: "Syslog",
      conditionKql: "message:PortScan",
      timeWindowSeconds: 60,
      thresholdCount: 5,
      mitreTactic: "Reconnaissance",
      mitreTechnique: "T1595 - Active Scanning",
      enabled: true,
    };

    engine.addRule(newRule);
    expect(engine.getRules().length).toBe(initialRules + 1);

    const deleted = engine.deleteRule("RULE-CUSTOM-99");
    expect(deleted).toBe(true);
    expect(engine.getRules().length).toBe(initialRules);
  });
});
